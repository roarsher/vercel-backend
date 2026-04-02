 const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  equipment: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Equipment',
    required: true,
  },
  bookingType: {
    type:    String,
    enum:    ['rent', 'buy'],
    default: 'rent',
  },
  days:      { type: Number, default: 1 },
  startDate: { type: Date, required: true },
  endDate:   { type: Date },

  pricePerDay: { type: Number },
  totalCost: {
    type:     Number,
    required: true,
  },

  paidFromWallet: { type: Boolean, default: true },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Transaction',
  },

  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },

  notes:         { type: String },
  cancelReason:  { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);