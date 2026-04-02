const Notification = require('../models/Notification');

// ── GET ALL NOTIFICATIONS ──────────────────────────
// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user:   req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      count:        notifications.length,
      unreadCount,
      notifications,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK AS READ ───────────────────────────────────
// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { returnDocument: 'after' }
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK ALL AS READ ───────────────────────────────
// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE NOTIFICATION ────────────────────────────
// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CLEAR ALL ──────────────────────────────────────
// DELETE /api/notifications/clear-all
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};