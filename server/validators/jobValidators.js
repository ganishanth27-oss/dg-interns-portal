const { body } = require("express-validator");

const createJobValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("company")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ max: 200 })
    .withMessage("Company name cannot exceed 200 characters"),

  body("description")
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required"),

  body("type")
    .notEmpty()
    .withMessage("Job type is required")
    .isIn(["Full-time", "Part-time", "Internship", "Contract", "Remote"])
    .withMessage("Invalid job type"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("skills.*")
    .optional()
    .isString()
    .withMessage("Each skill must be a string"),

  body("salary.min")
    .optional()
    .isNumeric()
    .withMessage("Minimum salary must be a number"),

  body("salary.max")
    .optional()
    .isNumeric()
    .withMessage("Maximum salary must be a number"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
];

const updateJobValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Job title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("company")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Company name cannot exceed 200 characters"),

  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("location")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location cannot be empty"),

  body("type")
    .optional()
    .isIn(["Full-time", "Part-time", "Internship", "Contract", "Remote"])
    .withMessage("Invalid job type"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
];

module.exports = { createJobValidation, updateJobValidation };
