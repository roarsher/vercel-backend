const express = require('express');
const router  = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',              protect, getNotifications);
router.put('/read-all',      protect, markAllAsRead);
router.delete('/clear-all',  protect, clearAll);
router.put('/:id/read',      protect, markAsRead);
router.delete('/:id',        protect, deleteNotification);

module.exports = router;