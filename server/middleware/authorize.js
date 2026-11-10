/**
 * Role-based authorization middleware.
 * Usage: authorize('admin', 'recruiter') or authorize('candidate')
 * Normalizes 'user' <-> 'candidate' and 'employer' <-> 'recruiter'.
 * Must be used AFTER authMiddleware.
 */
const normalizeRole = (role) => {
  if (role === "user") return "candidate";
  if (role === "employer") return "recruiter";
  return role;
};

const authorize = (...roles) => {
  const allowed = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
module.exports.normalizeRole = normalizeRole;
