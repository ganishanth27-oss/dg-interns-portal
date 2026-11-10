const Notification = require("../models/Notification");

// ========================================
// GET /api/notifications
// Get current user's notifications
// ========================================
const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = { recipient: req.user.id };

    if (req.query.unreadOnly === "true") {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email role")
        .populate("job", "title company")
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user.id, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[GET NOTIFICATIONS] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

// ========================================
// GET /api/notifications/unread-count
// Quick counter for navbar/bell icon
// ========================================
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET UNREAD COUNT] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count.",
    });
  }
};

// ========================================
// PUT /api/notifications/:id/read
// Mark single notification as read
// ========================================
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or unauthorized.",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("[MARK NOTIFICATION READ] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
};

// ========================================
// PUT /api/notifications/mark-all-read
// Mark all notifications as read
// ========================================
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("[MARK ALL READ] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

