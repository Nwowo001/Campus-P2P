const User = require("../models/User");

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Block or unblock a user (Admin only)
// @route   PUT /api/users/:id/block
// @access  Private/Admin
const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Administrators cannot block themselves",
        });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Administrators cannot delete their own account",
        });
    }

    await user.remove();
    return res.json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  toggleUserBlock,
  deleteUser,
};
