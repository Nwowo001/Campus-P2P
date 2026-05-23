const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, price, description, image, category } = req.body;

  try {
    const product = await Product.create({
      title,
      price,
      description,
      image,
      category,
      sellerId: req.user.id,
    });

    const populatedProduct = await Product.findById(product._id).populate('sellerId', 'name ratingAverage ratingCount');

    return res.status(201).json({
      success: true,
      data: populatedProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all products (with optional filtering)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, showSold } = req.query;
    let query = {};

    // Filter sold items unless explicitly requested to show sold items
    if (showSold !== 'true') {
      query.isSold = false;
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by search query (case-insensitive title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate('sellerId', 'name ratingAverage ratingCount')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('sellerId', 'name email department level ratingAverage ratingCount createdAt');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, price, description, image, category } = req.body;

  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.sellerId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'User not authorized to update this product' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { title, price, description, image, category },
      { new: true, runValidators: true }
    ).populate('sellerId', 'name ratingAverage ratingCount');

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.sellerId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'User not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
