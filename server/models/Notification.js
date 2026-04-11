const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['wallet','booking','repayment','farm','system','advisor'],
    default: 'system',
  },
  icon:   { type: String, default: '🔔' },
  isRead: { type: Boolean, default: false },
  link:   { type: String }, // where to navigate on click
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);