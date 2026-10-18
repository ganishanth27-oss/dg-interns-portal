const Application = require("../models/Application");
const Job = require("../models/Job");

// ========================================
// POST /api/applications
// Submit a new application
// ========================================
const createApplication = async (req, res, next) => {
  try {
    const {
      jobTitle,
      company,
      location,
      category,
      fullName,
      email,
      phone,
      resumeUrl,
      coverLetter,
      job,
    } = req.body;

    // If a job ID is provided, verify it exists
    if (job) {
      const jobExists = await Job.findById(job);
      if (!jobExists) {
        return res.status(404).json({
          success: false,
          message: "The referenced job does not exist.",
        });
      }

      // Check for duplicate application by job reference
      const duplicateByJob = await Application.findOne({
        user: req.user.id,
        job: job,
      });

      if (duplicateByJob) {
        return res.status(409).json({
          success: false,
          message: "You have already applied for this job.",
        });
      }
    }

    // Prevent duplicate applications for the same internship (legacy: by title+company)
    const existing = await Application.findOne({
      user: req.user.id,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this internship.",
      });
    }

    const application = await Application.create({
      user: req.user.id,
      job: job || null,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      location: location.trim(),
      category: category.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      resumeUrl: resumeUrl.trim(),
      coverLetter: coverLetter || "",
    });

    return res.status(201).json({
      success: true,
      message: "Your application was submitted successfully!",
      application: {
        id: application._id,
        jobTitle: application.jobTitle,
        company: application.company,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("[CREATE APPLICATION] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save your application. Please try again.",
    });
  }
};

// ========================================
// GET /api/applications/my
// Get all applications for the logged-in user
// ========================================


const getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const skip = (pageNum - 1) * limitNum;
    const filter = { user: req.user.id };

    // Fetch the current page, total applications, and all status counts.
    const [
      applications,
      totalCount,
      pendingCount,
      reviewedCount,
      acceptedCount,
      rejectedCount,
    ] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("job", "title company type location"),

      Application.countDocuments(filter),
      Application.countDocuments({ ...filter, status: "Pending" }),
      Application.countDocuments({ ...filter, status: "Reviewed" }),
      Application.countDocuments({ ...filter, status: "Accepted" }),
      Application.countDocuments({ ...filter, status: "Rejected" }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      count: applications.length,

      stats: {
        total: totalCount,
        pending: pendingCount,
        reviewed: reviewedCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
      },

      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },

      applications,
    });
  } catch (error) {
    console.error("[GET MY APPLICATIONS] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET /api/applications/:id
// Get a single application by ID
// ========================================
const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job", "title company type location")
      .populate("user", "name email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Users can only view their own applications.
    // Admins and employers can view any application.
    if (
      application.user._id.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "employer"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this application",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("[GET APPLICATION] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// PUT /api/applications/:id/status
// Update application status (admin or employer only)
// ========================================
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Only admin or employer can change application status
    if (req.user.role !== "admin" && req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only admins or employers can update application status",
      });
    }

    // Applicants must not change their own application status
    if (application.user.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the status of your own application",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application: {
        id: application._id,
        jobTitle: application.jobTitle,
        company: application.company,
        status: application.status,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error) {
    console.error("[UPDATE STATUS] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// DELETE /api/applications/:id
// Delete an application (owner or admin only)
// ========================================
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Only the applicant or an admin can delete
    if (
      application.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this application",
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE APPLICATION] Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
};
