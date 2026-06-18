const Report = require("../models/Report");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// @desc    Submit a report against a user
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { reportedUserId, reason } = req.body;

  try {
    if (reportedUserId === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot report yourself" });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User to report not found" });
    }

    const report = await Report.create({
      reportedUserId,
      reporterId: req.user.id,
      reason,
    });

    return res.status(201).json({
      success: true,
      message:
        "Report submitted successfully. Administrators will review this shortly.",
      data: report,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate(
        "reportedUserId",
        "name email department level ratingAverage ratingCount",
      )
      .populate("reporterId", "name email department level")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Dismiss/Delete a report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private/Admin
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    await Report.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Report dismissed successfully",
    });
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Admin stats dashboard overview
// @route   GET /api/reports/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalReports = await Report.countDocuments({});
    const totalOrders = await require("../models/Order").countDocuments({});

    // Calculate total volume (sum of completed orders amount)
    const completedOrders = await require("../models/Order").find({
      status: "completed",
    });
    const totalVolume = completedOrders.reduce(
      (sum, order) => sum + order.amount,
      0,
    );
    const totalCommission = completedOrders.reduce(
      (sum, order) => sum + (order.platformAmount ?? order.amount * 0.1),
      0,
    );

    const activeProductsCount =
      await require("../models/Product").countDocuments({ isSold: false });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalReports,
        totalOrders,
        totalVolume,
        totalCommission,
        activeProductsCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createReport,
  getReports,
  deleteReport,
  getAdminStats,
};
