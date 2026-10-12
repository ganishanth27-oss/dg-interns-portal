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
} = require("../controllers/userController");

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

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
