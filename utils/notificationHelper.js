const Notification = require('../models/Notification');

const createNotification = async (userId, data) => {
  try {
    await Notification.create({
      user:    userId,
      title:   data.title,
      message: data.message,
      type:    data.type    || 'system',
      icon:    data.icon    || '🔔',
      link:    data.link    || '/dashboard',
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Pre-built notification templates
const notify = {
  walletSpent: (userId, amount, category) =>
    createNotification(userId, {
      title:   'Wallet Deduction',
      message: `₹${amount} deducted for ${category}`,
      type:    'wallet',
      icon:    '👛',
      link:    '/wallet',
    }),

  bookingConfirmed: (userId, machineName) =>
    createNotification(userId, {
      title:   'Booking Confirmed! 🚜',
      message: `Your ${machineName} booking is confirmed`,
      type:    'booking',
      icon:    '🚜',
      link:    '/bookings',
    }),

  bookingCancelled: (userId, machineName) =>
    createNotification(userId, {
      title:   'Booking Cancelled',
      message: `${machineName} booking cancelled. Amount refunded.`,
      type:    'booking',
      icon:    '❌',
      link:    '/bookings',
    }),

  repaymentDue: (userId, amount) =>
    createNotification(userId, {
      title:   'Repayment Due! 📅',
      message: `₹${amount} repayment due after harvest`,
      type:    'repayment',
      icon:    '📅',
      link:    '/repayment',
    }),

  repaymentDone: (userId, amount) =>
    createNotification(userId, {
      title:   'Repayment Successful ✅',
      message: `₹${amount} repaid successfully`,
      type:    'repayment',
      icon:    '✅',
      link:    '/repayment',
    }),

  farmProfileSaved: (userId, creditLimit) =>
    createNotification(userId, {
      title:   'Farm Profile Saved! 🌾',
      message: `Credit limit set to ₹${creditLimit.toLocaleString()}`,
      type:    'farm',
      icon:    '🌾',
      link:    '/wallet',
    }),

  walletActivated: (userId, creditLimit) =>
    createNotification(userId, {
      title:   'Wallet Activated! 👛',
      message: `Your wallet is active with ₹${creditLimit.toLocaleString()} credit`,
      type:    'wallet',
      icon:    '🎉',
      link:    '/wallet',
    }),
};

module.exports = { createNotification, notify };