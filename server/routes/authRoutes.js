const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  registerValidation,
  loginValidation,
} = require("../validators/authValidators");
const {
  register,
  login,
  getMe,
  logout,
  getDashboard,
} = require("../controllers/authController");

const router = express.Router();

// Login rate limiter: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// POST /api/auth/register
router.post("/register", registerValidation, validate, register);

// POST /api/auth/login
router.post("/login", loginLimiter, loginValidation, validate, login);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

// POST /api/auth/logout
router.post("/logout", authMiddleware, logout);

// GET /api/auth/dashboard
router.get("/dashboard", authMiddleware, getDashboard);

module.exports = router;
