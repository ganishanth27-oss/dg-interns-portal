const Job = require("../models/Job");

// ========================================
// GET /api/jobs
// List jobs with search, filters, pagination, sorting
// ========================================
const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      type,
      location,
      skill,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const filter = { isActive: true };

    // Text search across title, company, location (uses text index)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by job type
    if (type) {
      filter.type = type;
    }

    // Filter by location (case-insensitive partial match)
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Filter by skill (case-insensitive match in skills array)
    if (skill) {
      filter.skills = { $regex: skill, $options: "i" };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "deadline":
        sortOption = { deadline: 1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, totalCount] = await Promise.all([
      Job.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate("postedBy", "name email"),
      Job.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      jobs,
    });
  } catch (error) {
    console.error("[GET JOBS] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET /api/jobs/:id
// Get a single job by ID
// ========================================
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name email"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[GET JOB] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// POST /api/jobs
// Create a new job (admin or employer only)
// ========================================
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      description,
      location,
      type,
      skills,
      salary,
      deadline,
    } = req.body;

    const job = await Job.create({
      title,
      company,
      description,
      location,
      type,
      skills: skills || [],
      salary: salary || {},
      deadline: deadline || null,
      postedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error("[CREATE JOB] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// PUT /api/jobs/:id
// Update a job (only the poster, or admin)
// ========================================
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only the job poster or an admin can update
    if (
      job.postedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this job",
      });
    }

    const allowedFields = [
      "title",
      "company",
      "description",
      "location",
      "type",
      "skills",
      "salary",
      "deadline",
      "isActive",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    job = await Job.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).populate("postedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("[UPDATE JOB] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// DELETE /api/jobs/:id
// Delete a job (only the poster, or admin)
// ========================================
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only the job poster or an admin can delete
    if (
      job.postedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE JOB] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
};
