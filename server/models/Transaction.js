const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Link to User & Wallet
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  wallet: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Wallet',
    required: true,
  },

  // Transaction Details
  type: {
    type:     String,
    enum:     ['credit', 'debit', 'repayment'],
    required: true,
  },
  amount: {
    type:     Number,
    required: true,
    min:      [1, 'Amount must be at least 1'],
  },
  category: {
    type: String,
    enum: [
      'fertilizer',
      'pesticide',
      'machine_rent',
      'machine_buy',
      'irrigation',
      'seeding',
      'harvesting',
      'advisor',
      'credit_added',
      'repayment',
      'other',
    ],
  },
  description: { type: String, trim: true },

  // Reference (booking or equipment)
  reference: {
    type:    mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
  },
  referenceModel: {
    type: String,
    enum: ['Booking', 'Equipment'],
  },

  // Balance after transaction
  balanceAfter: { type: Number },

  // Status
  status: {
    type:    String,
    enum:    ['pending', 'success', 'failed'],
    default: 'success',
  },

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);