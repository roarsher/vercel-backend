const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  // Link to User
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
  },

  // Location
  state:    { type: String, trim: true },
  district: { type: String, trim: true },
  village:  { type: String, trim: true },
  pincode:  { type: String, trim: true },

  // Bank Details (for repayment)
  bankAccount: {
    accountNumber: { type: String },
    ifscCode:      { type: String },
    bankName:      { type: String },
    accountHolder: { type: String },
  },

  // Profile
  profilePhoto: { type: String }, // Cloudinary URL
  dateOfBirth:  { type: Date },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },

  // KYC Documents
  documents: [{
    docType: {
      type: String,
      enum: ['aadhaar', 'land_record', 'kisan_card', 'bank_passbook'],
    },
    url:        { type: String },
    verified:   { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Status
  kycComplete: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);