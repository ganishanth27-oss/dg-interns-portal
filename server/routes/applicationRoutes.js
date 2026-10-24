
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validate");

const {
  createApplicationValidation,
  updateApplicationStatusValidation,
} = require("../validators/applicationValidators");

const {
  createApplication,
  getMyApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  getRecruiterApplications,
} = require("../controllers/applicationController");
const authorize = require("../middleware/authorize");

const router = express.Router();

// All application routes require authentication
router.use(authMiddleware);

// GET /api/applications/recruiter
// Recruiter or Admin can view applications submitted for their jobs
router.get(
  "/recruiter",
  authorize("admin", "employer"),
  getRecruiterApplications
);

// POST /api/applications
// Upload a PDF resume before validating and creating the application
router.post(
  "/",
  uploadMiddleware,
  createApplicationValidation,
  validate,
  createApplication
);

// GET /api/applications/my
router.get("/my", getMyApplications);

// GET /api/applications/:id
router.get("/:id", getApplication);

// PUT /api/applications/:id/status
router.put(
  "/:id/status",
  updateApplicationStatusValidation,
  validate,
  updateApplicationStatus
);

// DELETE /api/applications/:id
router.delete("/:id", deleteApplication);

module.exports = router;
