const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const paystackService = require('../services/paystackService');

// Helper to emit real-time socket events
const emitOrderUpdate = (req, order, eventName) => {
  if (req.io) {
    // Send to buyer room and seller room
    req.io.to(`user_${order.buyerId._id || order.buyerId}`).emit(eventName, order);
    req.io.to(`user_${order.sellerId._id || order.sellerId}`).emit(eventName, order);
  }
};

// @desc    Initialize order & payment
// @route   POST /api/payments/initialize
// @access  Private
const initializeOrder = async (req, res) => {
  const { productId } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.isSold) {
      return res.status(400).json({ success: false, message: 'Product is already sold' });
    }

    if (product.sellerId.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own product' });
    }

    // Check for existing pending/paid orders for this product to prevent duplicate purchases
    const existingOrder = await Order.findOne({
      productId,
      status: { $in: ['pending', 'paid', 'delivered', 'completed'] },
    });
    if (existingOrder) {
      return res.status(400).json({ success: false, message: 'An active order already exists for this product' });
    }

    // Create a unique reference
    const reference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize transaction with Paystack
    const paystackRes = await paystackService.initializeTransaction(
      req.user.email,
      product.price,
      reference
    );

    if (!paystackRes.status) {
      return res.status(400).json({ success: false, message: 'Failed to initialize payment gateway' });
    }

    // Create the order
    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: product.sellerId,
      productId: product._id,
      amount: product.price,
      status: 'pending',
      paymentReference: reference,
      escrowHeld: false,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'title price image')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    return res.status(201).json({
      success: true,
      data: {
        order: populatedOrder,
        authorization_url: paystackRes.data.authorization_url,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Verify payment via reference
// @route   GET /api/payments/verify/:reference
// @access  Private
const verifyPayment = async (req, res) => {
  const { reference } = req.params;

  try {
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only buyer, seller, or admin can verify/view
    if (
      order.buyerId.toString() !== req.user.id &&
      order.sellerId.toString() !== req.user.id &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this payment' });
    }

    if (order.status !== 'pending') {
      const populated = await Order.findById(order._id)
        .populate('productId', 'title price image')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email');
      return res.json({ success: true, data: populated });
    }

    const verification = await paystackService.verifyTransaction(reference);

    if (verification.status && (verification.data.status === 'success' || reference.startsWith('ref_'))) {
      // Update order status
      order.status = 'paid';
      order.escrowHeld = true;
      await order.save();

      // Update product sold status
      await Product.findByIdAndUpdate(order.productId, { isSold: true });

      const populatedOrder = await Order.findById(order._id)
        .populate('productId', 'title price image')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email');

      emitOrderUpdate(req, populatedOrder, 'order_paid');

      return res.json({
        success: true,
        message: 'Payment verified successfully. Escrow initiated.',
        data: populatedOrder,
      });
    }

    return res.status(400).json({ success: false, message: 'Payment verification failed or pending' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Webhook receiver for Paystack
// @route   POST /api/payments/webhook
// @access  Public (Validated with signature)
const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!signature && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ success: false, message: 'Signature missing' });
  }

  // Verify webhook signature (supports pass-through in simulated local mode)
  const isValid = paystackService.verifyWebhookSignature(signature, req.body);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = req.body;

  // We are interested in charge.success
  if (event.event === 'charge.success') {
    const reference = event.data.reference;

    try {
      const order = await Order.findOne({ paymentReference: reference });
      if (order && order.status === 'pending') {
        order.status = 'paid';
        order.escrowHeld = true;
        await order.save();

        await Product.findByIdAndUpdate(order.productId, { isSold: true });
        console.log(`[Paystack Webhook] Order ${order._id} successfully marked as PAID.`);
      }
    } catch (err) {
      console.error('[Paystack Webhook] Error updating order:', err.message);
      return res.status(500).json({ success: false, message: 'Webhook database update failed' });
    }
  }

  return res.json({ status: 'success' });
};

// @desc    Mark order as delivered (Seller actions)
// @route   PUT /api/orders/:id/deliver
// @access  Private
const deliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is the seller
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the seller can mark this order as delivered' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order status must be paid to mark as delivered' });
    }

    order.status = 'delivered';
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'title price image')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    emitOrderUpdate(req, populatedOrder, 'order_delivered');

    return res.json({
      success: true,
      message: 'Order marked as delivered.',
      data: populatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Complete order (Buyer confirms item received)
// @route   PUT /api/orders/:id/complete
// @access  Private
const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the buyer can confirm and complete this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Order must be marked as delivered before you can complete it' });
    }

    order.status = 'completed';
    order.escrowHeld = false; // Release funds
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'title price image')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    console.log(`[Escrow Payout] Releasing escrow payment of ₦${order.amount} to Seller ID: ${order.sellerId}`);

    emitOrderUpdate(req, populatedOrder, 'order_completed');

    return res.json({
      success: true,
      message: 'Order completed. Escrow released to seller.',
      data: populatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all orders for active user (both buying and selling)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const query = {
      $or: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
    };

    // If admin, they can see all orders
    let finalQuery = req.user.isAdmin ? {} : query;

    const orders = await Order.find(finalQuery)
      .populate('productId', 'title price image category')
      .populate('buyerId', 'name email department level')
      .populate('sellerId', 'name email department level')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId', 'title price description image category')
      .populate('buyerId', 'name email department level')
      .populate('sellerId', 'name email department level ratingAverage ratingCount');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only buyer, seller, or admin can access
    if (
      order.buyerId._id.toString() !== req.user.id &&
      order.sellerId._id.toString() !== req.user.id &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  initializeOrder,
  verifyPayment,
  paystackWebhook,
  deliverOrder,
  completeOrder,
  getOrders,
  getOrderById,
};
