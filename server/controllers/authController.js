const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "campusmart_jwt_super_secure_secret_key_2026",
    {
      expiresIn: "30d",
    },
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, department, level } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already exists with this email",
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      department,
      level,
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          level: user.level,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
          ratingAverage: user.ratingAverage,
          ratingCount: user.ratingCount,
          token: generateToken(user._id),
        },
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({
          success: false,
          message: "This account has been blocked. Contact support.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        level: user.level,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        ratingAverage: user.ratingAverage,
        ratingCount: user.ratingCount,
        bankName: user.bankName || "",
        bankAccountNumber: user.bankAccountNumber || "",
        isBlocked: user.isBlocked || false,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const completedSales = await Order.find({
      sellerId: user._id,
      status: "completed",
    });
    const completedPurchases = await Order.find({
      buyerId: user._id,
      status: "completed",
    });

    const totalEarned = completedSales.reduce(
      (sum, order) => sum + (order.sellerAmount ?? order.amount * 0.9),
      0,
    );
    const totalSpent = completedPurchases.reduce(
      (sum, order) => sum + order.amount,
      0,
    );

    return res.json({
      success: true,
      data: {
        ...user.toObject(),
        totalEarned,
        totalSpent,
        totalSales: completedSales.length,
        totalPurchases: completedPurchases.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update current user profile bank details
// @route   PUT /api/auth/me
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { name, department, level, bankName, bankAccountNumber } = req.body;

    if (name) user.name = name;
    if (department) user.department = department;
    if (level) user.level = level;
    if (bankName !== undefined) user.bankName = bankName;
    if (bankAccountNumber !== undefined)
      user.bankAccountNumber = bankAccountNumber;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
