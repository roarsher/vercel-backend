const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // Link to User
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
  },

  // Balance
  balance:     { type: Number, default: 0 },   // available to spend
  creditLimit: { type: Number, default: 0 },   // total credit approved
  usedCredit:  { type: Number, default: 0 },   // amount spent so far

  // Interest
  interestRate:  { type: Number, default: 2.5 }, // % per month
  totalInterest: { type: Number, default: 0 },   // total interest accrued

  // Status
  isActive: {
    type:    Boolean,
    default: false, // activated after farm profile filled
  },
  farmProfileFilled: {
    type:    Boolean,
    default: false,
  },

  // Repayment
  repaymentDue: { type: Date },
  repaymentStatus: {
    type:    String,
    enum:    ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  totalRepaid: { type: Number, default: 0 },

  // Credit history
  creditHistory: [{
    amount:      { type: Number },
    reason:      { type: String },
    creditedAt:  { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// ── VIRTUAL: Available Balance ─────────────────────
walletSchema.virtual('availableBalance').get(function() {
  return this.creditLimit - this.usedCredit;
});

// ── VIRTUAL: Total Due ─────────────────────────────
walletSchema.virtual('totalDue').get(function() {
  return this.usedCredit + this.totalInterest;
});

module.exports = mongoose.model('Wallet', walletSchema);