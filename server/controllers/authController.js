const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========================================
// POST /api/auth/register
// Register a new user
// ========================================
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Only allow 'user' or 'employer' roles during registration
    const allowedRoles = ["user", "employer"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[REGISTER] Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// POST /api/auth/login
// Login and generate JWT
// ========================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Use +password to include the password field (select: false in schema)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("[LOGIN] JWT_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LOGIN] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET /api/auth/me
// Get the currently authenticated user
// ========================================
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("[GET ME] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// POST /api/auth/logout
// Logout (client-side token removal)
// ========================================
const logout = async (req, res, next) => {
  // JWT is stateless — the client must discard the token.
  // This endpoint confirms the action.
  return res.status(200).json({
    success: true,
    message: "Logged out successfully. Please discard your token.",
  });
};

// ========================================
// GET /api/auth/dashboard
// Get dashboard data for the logged-in user
// ========================================
const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      dashboard: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        account: {
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[DASHBOARD] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  getDashboard,
};
