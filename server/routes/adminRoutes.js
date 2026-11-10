const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  getAdminStats,
  getAllUsers,
  deleteUserById,
  toggleUserStatus,
} = require("../controllers/userController");
const { getJobs, deleteJob } = require("../controllers/jobController");
const {
  getRecruiterApplications,
  deleteApplication,
} = require("../controllers/applicationController");

const router = express.Router();

// Strict Admin-only middleware pipeline
router.use(authMiddleware);
router.use(authorize("admin"));

// GET /api/admin/dashboard (Dashboard statistics & analytics)
router.get("/dashboard", getAdminStats);

// GET /api/admin/users (User management listing with query/pagination)
router.get("/users", getAllUsers);

// DELETE /api/admin/users/:id
router.delete("/users/:id", deleteUserById);

// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", toggleUserStatus);

// GET /api/admin/jobs (All jobs for administrative review)
router.get("/jobs", getJobs);

// DELETE /api/admin/jobs/:id (Administrative job removal)
router.delete("/jobs/:id", deleteJob);

// GET /api/admin/applications (All applications across all jobs)
router.get("/applications", getRecruiterApplications);

// DELETE /api/admin/applications/:id
router.delete("/applications/:id", deleteApplication);

module.exports = router;

