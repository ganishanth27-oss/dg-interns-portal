const path = require("path");
const { body, param } = require("express-validator");

const createApplicationValidation = [
  body("jobTitle")
    .isString()
    .withMessage("Job title must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Job title is required"),

  body("company")
    .isString()
    .withMessage("Company name must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),

  body("location")
    .isString()
    .withMessage("Location must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Location is required"),

  body("category")
    .isString()
    .withMessage("Category must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("fullName")
    .isString()
    .withMessage("Full name must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isString()
    .withMessage("Email must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .isString()
    .withMessage("Phone number must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .custom((value) => {
      const digits = value.replace(/\D/g, "");

      if (
        !/^[+\d\s().-]+$/.test(value) ||
        digits.length < 10 ||
        digits.length > 15
      ) {
        throw new Error("Enter a valid phone number");
      }

      return true;
    }),

  body("coverLetter")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Cover letter must be text")
    .bail()
    .isLength({ max: 3000 })
    .withMessage("Cover letter must be 3,000 characters or fewer"),

  // Accept a PDF uploaded through Multer (req.file) or a legacy resume URL.
  body("resume").custom((value, { req }) => {
    if (req.file) {
      const ext = path.extname(req.file.originalname || "").toLowerCase();
      if (
        req.file.mimetype !== "application/pdf" ||
        ext !== ".pdf"
      ) {
        throw new Error("Only PDF resumes are allowed");
      }

      return true;
    }

    const legacyUrl = req.body?.resumeUrl;
    if (typeof legacyUrl === "string" && legacyUrl.trim()) {
      try {
        const url = new URL(legacyUrl.trim());

        if (
          (url.protocol === "http:" || url.protocol === "https:") &&
          url.hostname
        ) {
          return true;
        }
      } catch {
        // The URL is invalid.
      }

      throw new Error("Resume URL must be a valid HTTP/HTTPS URL");
    }

    throw new Error(
      "Upload a PDF resume or provide a valid resume URL"
    );
  }),

  body("resumeUrl")
    .optional({ values: "falsy" })
    .trim()
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Resume URL must be a valid HTTP/HTTPS URL"),

  body("job")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid job ID"),
];

const updateApplicationStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid application ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .bail()
    .isIn([
      "Applied",
      "Pending",
      "Under Review",
      "Reviewed",
      "Shortlisted",
      "Interview",
      "Accepted",
      "Selected",
      "Rejected",
    ])
    .withMessage(
      "Status must be Applied, Pending, Under Review, Reviewed, Shortlisted, Interview, Accepted, Selected, or Rejected"
    ),
];

module.exports = {
  createApplicationValidation,
  updateApplicationStatusValidation,
};
