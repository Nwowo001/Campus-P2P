const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "campusmart_jwt_super_secure_secret_key_2026",
      );

      // Get user from the token, exclude password
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authorized, user not found" });
      }

      if (req.user.isBlocked) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Account blocked. Contact support.",
          });
      }

      next();
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token provided" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };
