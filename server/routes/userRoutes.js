const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  updateProfileValidation,
  changePasswordValidation,
} = require("../validators/authValidators");
const {
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
  getAdminStats,
} = require("../controllers/userController");
const authorize = require("../middleware/authorize");

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// Admin-only endpoints
router.get("/", authorize("admin"), getAllUsers);
router.get("/stats/overview", authorize("admin"), getAdminStats);
router.patch("/:id/status", authorize("admin"), toggleUserStatus);

// GET /api/users/profile
router.get("/profile", getProfile);

// PUT /api/users/profile
router.put("/profile", updateProfileValidation, validate, updateProfile);

// DELETE /api/users/profile
router.delete("/profile", deleteProfile);

// PUT /api/users/change-password
router.put(
  "/change-password",
  changePasswordValidation,
  validate,
  changePassword
);

module.exports = router;
