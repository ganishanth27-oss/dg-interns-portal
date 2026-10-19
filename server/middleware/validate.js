const { validationResult } = require("express-validator");

/**
 * Express middleware that checks express-validator results.
 * Use after validator arrays in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DEBUG - VALIDATION ERRORS]", {
        bodyFields: Object.keys(req.body || {}),
        hasFile: Boolean(req.file),
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

module.exports = validate;
