const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PUT /api/notifications/mark-all-read
router.put("/mark-all-read", markAllAsRead);

// PUT /api/notifications/:id/read
router.put("/:id/read", markAsRead);

module.exports = router;

