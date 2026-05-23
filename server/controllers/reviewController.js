const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create a review for a completed order
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { orderId, rating, comment } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only buyer can review
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the buyer can leave a review' });
    }

    // Order status must be completed
    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed transactions' });
    }

    // Prevent duplicate reviews
    const reviewExists = await Review.findOne({ orderId });
    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this transaction' });
    }

    // Create review
    const review = await Review.create({
      reviewerId: req.user.id,
      reviewedUserId: order.sellerId,
      orderId,
      rating,
      comment,
    });

    // Update seller's rating average and count
    const sellerId = order.sellerId;
    const allSellerReviews = await Review.find({ reviewedUserId: sellerId });
    
    const ratingCount = allSellerReviews.length;
    const ratingSum = allSellerReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const ratingAverage = Number((ratingSum / ratingCount).toFixed(1));

    await User.findByIdAndUpdate(sellerId, {
      ratingAverage,
      ratingCount,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'name email')
      .populate('orderId', 'amount paymentReference');

    return res.status(201).json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all reviews for a specific user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUserId: req.params.userId })
      .populate('reviewerId', 'name email department level')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createReview,
  getUserReviews,
};
