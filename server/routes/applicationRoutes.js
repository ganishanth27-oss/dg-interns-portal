const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
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
} = require("../controllers/applicationController");

const router = express.Router();

// All application routes require authentication
router.use(authMiddleware);

// POST /api/applications
router.post("/", createApplicationValidation, validate, createApplication);

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
