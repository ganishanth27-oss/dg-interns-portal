const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Application = require("../models/Application");

// ========================================
// GET /api/users/profile
// Get the logged-in user's profile
// ========================================
const getProfile = async (req, res, next) => {
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
    console.error("[GET PROFILE] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// PUT /api/users/profile
// Update the logged-in user's profile
// ========================================
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[UPDATE PROFILE] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// DELETE /api/users/profile
// Delete the logged-in user's account
// ========================================
const deleteProfile = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete your account",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Delete user's applications
    await Application.deleteMany({ user: req.user.id });

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE PROFILE] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting account",
    });
  }
};

// ========================================
// PUT /api/users/change-password
// Change the logged-in user's password
// ========================================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("[CHANGE PASSWORD] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
};
