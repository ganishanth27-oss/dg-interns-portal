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
        phone: user.phone || "",
        skills: user.skills || [],
        isActive: user.isActive !== false,
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
    const { name, phone, skills } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

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
        phone: user.phone || "",
        skills: user.skills || [],
        isActive: user.isActive !== false,
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

// ========================================
// ADMIN ENDPOINTS
// ========================================

// GET /api/users
// Admin: Get all users with search, role filter, pagination
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role && role !== "All") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-password"),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
      },
      users,
    });
  } catch (error) {
    console.error("[GET ALL USERS] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};

// PATCH /api/users/:id/status
// Admin: Enable or disable a user
const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent disabling self
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot disable your own admin account",
      });
    }

    user.isActive = typeof isActive === "boolean" ? isActive : !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "enabled" : "disabled"} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("[TOGGLE USER STATUS] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error updating user status",
    });
  }
};

// GET /api/users/stats/overview
// Admin: Overview stats (users, candidates, recruiters, jobs, applications)
const getAdminStats = async (req, res) => {
  try {
    const Job = require("../models/Job");
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalAdmins,
      totalJobs,
      activeJobs,
      totalApplications,
      shortlistedApplications,
      interviewApplications,
      selectedApplications,
      rejectedApplications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "admin" }),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: "Shortlisted" }),
      Application.countDocuments({ status: "Interview" }),
      Application.countDocuments({ status: { $in: ["Selected", "Accepted"] } }),
      Application.countDocuments({ status: "Rejected" }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalAdmins,
        totalJobs,
        activeJobs,
        totalApplications,
        shortlistedApplications,
        interviewApplications,
        selectedApplications,
        rejectedApplications,
      },
    });
  } catch (error) {
    console.error("[GET ADMIN STATS] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin statistics",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
  getAdminStats,
};
