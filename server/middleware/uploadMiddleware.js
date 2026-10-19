const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "resumes"
);

// Create the upload directory if it does not exist.
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    callback(null, `resume-${uniqueSuffix}.pdf`);
  },
});

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    extension !== ".pdf" ||
    file.mimetype !== "application/pdf"
  ) {
    return callback(new Error("Only PDF resumes are allowed."));
  }

  callback(null, true);
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
    files: 1,
  },
}).single("resume");

module.exports = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  // If the request is not multipart/form-data, pass to next middleware
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return next();
  }

  uploadResume(req, res, (error) => {
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[UPLOAD ERROR]", error.message);
      }

      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Resume must be 5 MB or smaller.",
          });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message:
              "Unexpected file field. Upload your resume using the resume field.",
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message || "Unable to upload the resume. Please check the file.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Invalid resume file.",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG - RESUME UPLOAD]", {
        hasFile: Boolean(req.file),
        file: req.file
          ? {
              filename: req.file.filename,
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : null,
        bodyFieldCount: Object.keys(req.body || {}).length,
      });
    }

    // Multer parsed multipart fields into req.body and file into req.file
    next();
  });
};
