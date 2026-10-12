/**
 * Strip MongoDB query operators (keys starting with $) from an object.
 * Protects against NoSQL injection in req.body / req.query.
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    clean[key] = sanitizeObject(value);
  }
  return clean;
};

module.exports = { sanitizeObject };
