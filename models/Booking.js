 const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  // ── RELATIONS ──────────────────────────────────────
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  equipment: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Equipment',
    required: false, // false because advisor bookings have no equipment
  },

  // ── BOOKING TYPE ───────────────────────────────────
  bookingType: {
    type:    String,
    enum:    ['rent', 'buy', 'advisor'],
    default: 'rent',
  },

  // ── DATES ──────────────────────────────────────────
  days:      { type: Number, default: 1 },
  startDate: { type: Date },
  endDate:   { type: Date },

  // ── PRICING ────────────────────────────────────────
  pricePerDay: { type: Number, default: 0 },
  totalCost: {
    type:     Number,
    required: true,
  },

  // ── PAYMENT ────────────────────────────────────────
  paidFromWallet: { type: Boolean, default: true },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Transaction',
  },

  // ── STATUS ─────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },

  // ── EXTRA ──────────────────────────────────────────
  notes:        { type: String },
  cancelReason: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);