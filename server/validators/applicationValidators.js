const { body, param } = require("express-validator");

const createApplicationValidation = [
  body("jobTitle")
    .trim()
    .notEmpty()
    .withMessage("Job title is required"),

  body("company")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),

  body("resumeUrl")
    .trim()
    .notEmpty()
    .withMessage("Resume URL is required")
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Resume URL must be a valid HTTP/HTTPS URL"),

  body("coverLetter")
    .optional()
    .isString()
    .withMessage("Cover letter must be text"),

  body("job")
    .optional()
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
    .isIn(["Pending", "Reviewed", "Accepted", "Rejected"])
    .withMessage("Status must be Pending, Reviewed, Accepted, or Rejected"),
];

module.exports = {
  createApplicationValidation,
  updateApplicationStatusValidation,
};
