const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  createJobValidation,
  updateJobValidation,
} = require("../validators/jobValidators");
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

const router = express.Router();

// GET /api/jobs — public (no auth required)
router.get("/", getJobs);

// GET /api/jobs/:id — public
router.get("/:id", getJob);

// POST /api/jobs — admin or employer only
router.post(
  "/",
  authMiddleware,
  authorize("admin", "employer"),
  createJobValidation,
  validate,
  createJob
);

// PUT /api/jobs/:id — admin or employer only
router.put(
  "/:id",
  authMiddleware,
  authorize("admin", "employer"),
  updateJobValidation,
  validate,
  updateJob
);

// DELETE /api/jobs/:id — admin or employer only
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin", "employer"),
  deleteJob
);

module.exports = router;
