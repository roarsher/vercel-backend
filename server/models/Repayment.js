const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  // Relations
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

  // Amounts
  principal:      { type: Number, required: true }, // credit used
  interestAmount: { type: Number, required: true }, // interest charged
  totalAmount:    { type: Number, required: true }, // principal + interest
  paidAmount:     { type: Number, default: 0 },
  remainingAmount:{ type: Number },

  // Dates
  harvestDate:  { type: Date },
  dueDate:      { type: Date },
  paidDate:     { type: Date },

  // Payment Mode
  paymentMode: {
    type: String,
    enum: ['upi', 'bank_transfer', 'cash', 'other'],
  },

  // Status
  status: {
    type:    String,
    enum:    ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
  },

  // Installments
  installments: [{
    amount:    { type: Number },
    paidAt:    { type: Date },
    mode:      { type: String },
    reference: { type: String },
  }],

}, { timestamps: true });

module.exports = mongoose.model('Repayment', repaymentSchema);