
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

// Trust the hosting proxy when deployed behind one.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Configure allowed frontend origins
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (
        !origin ||
        allowedOrigins.includes(origin.replace(/\/+$/, ""))
      ) {
        return callback(null, true);
      }

      console.error("Blocked frontend origin:", origin);
      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

// Limit incoming JSON request size
app.use(express.json({ limit: "10kb" }));

// MongoDB Query Injection Protection
const { sanitizeObject } = require("./utils/sanitize");

app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
});

// Serve uploaded PDF resumes.
// Files are stored in server/uploads/resumes.
app.use(
  "/uploads/resumes",
  express.static(path.join(__dirname, "uploads", "resumes"), {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "attachment");
    },
  })
);

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Apply rate limiter to all API routes
app.use("/api", apiLimiter);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// Backend home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DG Interns Hub Backend is Working!",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start the server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
