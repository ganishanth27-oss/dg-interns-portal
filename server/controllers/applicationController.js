
const Application = require("../models/Application");
const Job = require("../models/Job");
const fs = require("fs/promises");

// Remove an uploaded resume if application creation fails.
const removeUploadedResume = async (file) => {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Unable to remove uploaded resume:", error.message);
    }
  }
};

// ========================================
// POST /api/applications
// Submit a new application
// ========================================
const createApplication = async (req, res) => {
  let applicationCreated = false;

  try {
    // Debug only field names and file metadata; do not log personal details.
    if (process.env.NODE_ENV !== "production") {
      console.log("[CREATE APPLICATION] Request received:", {
        contentType: req.headers["content-type"],
        bodyFields: Object.keys(req.body || {}),
        hasUploadedFile: Boolean(req.file),
        uploadedFile: req.file
          ? {
              fieldname: req.file.fieldname,
              filename: req.file.filename,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : null,
      });
    }

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
    } = req.body || {};

    // Verify required fields defensively (coverLetter is optional).
    const requiredFields = {
      jobTitle,
      company,
      location,
      category,
      fullName,
      email,
      phone,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => typeof value !== "string" || !value.trim())
      .map(([field]) => field);

    if (missingFields.length > 0) {
      await removeUploadedResume(req.file);

      return res.status(400).json({
        success: false,
        message: "Please complete all required application fields.",
        missingFields,
      });
    }

    if (!req.file && !(typeof resumeUrl === "string" && resumeUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: "Upload a PDF resume or provide a resume URL.",
      });
    }

    // Verify the referenced job exists when a database ID is provided.
    if (job) {
      const jobExists = await Job.findById(job);

      if (!jobExists) {
        await removeUploadedResume(req.file);

        return res.status(404).json({
          success: false,
          message: "The referenced job does not exist.",
        });
      }

      // Prevent duplicate applications for the same job.
      const duplicateByJob = await Application.findOne({
        user: req.user.id,
        job,
      });

      if (duplicateByJob) {
        await removeUploadedResume(req.file);

        return res.status(409).json({
          success: false,
          message: "You have already applied for this job.",
        });
      }
    }

    // Preserve the legacy duplicate check by job title and company.
    const existing = await Application.findOne({
      user: req.user.id,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
    });

    if (existing) {
      await removeUploadedResume(req.file);

      return res.status(409).json({
        success: false,
        message: "You have already applied for this internship.",
      });
    }

    // Build the resume URL from the uploaded file or a supplied URL.
    const publicBaseUrl = (
      process.env.PUBLIC_BASE_URL ||
      `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");

    const savedResumeUrl = req.file
      ? `${publicBaseUrl}/uploads/resumes/${req.file.filename}`
      : (typeof resumeUrl === "string" ? resumeUrl.trim() : "");

    const finalCoverLetter =
      typeof coverLetter === "string" ? coverLetter.trim() : "";

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
      resumeUrl: savedResumeUrl,
      coverLetter: finalCoverLetter,
    });

    applicationCreated = true;

    if (process.env.NODE_ENV !== "production") {
      console.log("[CREATE APPLICATION] Application saved:", {
        applicationId: application._id.toString(),
        hasResume: Boolean(application.resumeUrl),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Your application was submitted successfully!",
      application: {
        id: application._id,
        jobTitle: application.jobTitle,
        company: application.company,
        status: application.status,
        resumeUrl: application.resumeUrl,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    if (!applicationCreated) {
      await removeUploadedResume(req.file);
    }

    console.error("[CREATE APPLICATION] Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save your application. Please try again.",
    });
  }
};

// ========================================
// GET /api/applications/my
// Get applications for the logged-in user
// ========================================
const getMyApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const filter = { user: req.user.id };

    const [
      applications,
      totalCount,
      pendingCount,
      underReviewCount,
      shortlistedCount,
      interviewCount,
      selectedCount,
      rejectedCount,
    ] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("job", "title company type location skills salary"),

      Application.countDocuments(filter),
      Application.countDocuments({
        ...filter,
        status: { $in: ["Pending", "Applied"] },
      }),
      Application.countDocuments({
        ...filter,
        status: { $in: ["Reviewed", "Under Review"] },
      }),
      Application.countDocuments({
        ...filter,
        status: "Shortlisted",
      }),
      Application.countDocuments({
        ...filter,
        status: "Interview",
      }),
      Application.countDocuments({
        ...filter,
        status: { $in: ["Selected", "Accepted"] },
      }),
      Application.countDocuments({ ...filter, status: "Rejected" }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      count: applications.length,
      stats: {
        total: totalCount,
        pending: pendingCount,
        underReview: underReviewCount,
        shortlisted: shortlistedCount,
        interview: interviewCount,
        selected: selectedCount,
        rejected: rejectedCount,
        reviewed: underReviewCount,
        accepted: selectedCount,
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
const getApplication = async (req, res) => {
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

    const applicantId = application.user?._id?.toString();
    const currentUserId = req.user.id?.toString();

    if (
      applicantId !== currentUserId &&
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
// Update application status
// ========================================
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (req.user.role !== "admin" && req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only admins or employers can update application status",
      });
    }

    if (application.user.toString() === req.user.id.toString()) {
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
// Delete an application
// ========================================
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (
      application.user.toString() !== req.user.id.toString() &&
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

// ========================================
// GET /api/applications/recruiter
// Get all applicants for jobs posted by the recruiter (or all for admin)
// ========================================
const getRecruiterApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, jobId } = req.query;

    let jobFilter = {};
    if (req.user.role === "admin") {
      if (jobId) jobFilter._id = jobId;
    } else {
      jobFilter.postedBy = req.user.id;
      if (jobId) jobFilter._id = jobId;
    }

    const recruiterJobs = await Job.find(jobFilter).select("_id title company location");
    const jobIds = recruiterJobs.map((j) => j._id);

    let appFilter = {
      $or: [
        { job: { $in: jobIds } },
        ...(req.user.role === "admin" ? [] : []),
      ],
    };

    if (req.user.role === "admin" && !jobId) {
      appFilter = {};
    }

    if (status && status !== "All") {
      appFilter.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      appFilter.$and = [
        appFilter.$and || {},
        {
          $or: [
            { fullName: searchRegex },
            { email: searchRegex },
            { jobTitle: searchRegex },
            { company: searchRegex },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [applications, totalCount] = await Promise.all([
      Application.find(appFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("job", "title company type location skills")
        .populate("user", "name email phone skills"),
      Application.countDocuments(appFilter),
    ]);

    const statsFilter = req.user.role === "admin" && !jobId ? {} : { job: { $in: jobIds } };
    const [
      activeJobsCount,
      totalApps,
      shortlistedApps,
      interviewApps,
      selectedApps,
      rejectedApps,
    ] = await Promise.all([
      Job.countDocuments(jobFilter),
      Application.countDocuments(statsFilter),
      Application.countDocuments({ ...statsFilter, status: "Shortlisted" }),
      Application.countDocuments({ ...statsFilter, status: "Interview" }),
      Application.countDocuments({ ...statsFilter, status: { $in: ["Selected", "Accepted"] } }),
      Application.countDocuments({ ...statsFilter, status: "Rejected" }),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      stats: {
        activeJobs: activeJobsCount,
        totalApplications: totalApps,
        shortlisted: shortlistedApps,
        interviews: interviewApps,
        selected: selectedApps,
        rejected: rejectedApps,
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
      },
      applications,
    });
  } catch (error) {
    console.error("[GET RECRUITER APPLICATIONS] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching applicants",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  getRecruiterApplications,
};
