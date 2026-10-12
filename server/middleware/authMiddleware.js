const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both token formats: { userId } and { user: { id } }
    const userId =
      decoded.userId ||
      decoded.user?.id ||
      decoded.user?._id ||
      decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Fetch user to get current role and verify user still exists
    const user = await User.findById(userId).select("name email role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists. Please register again.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = authMiddleware;
