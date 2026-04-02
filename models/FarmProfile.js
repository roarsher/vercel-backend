const mongoose = require('mongoose');

const farmProfileSchema = new mongoose.Schema({
  // Link to User
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
  },

  // Land Details
  landSize: {
    type:     Number,
    required: [true, 'Land size is required'],
    min:      [0.1, 'Land size must be at least 0.1 acres'],
  },
  landUnit: {
    type:    String,
    enum:    ['acres', 'hectares', 'bigha'],
    default: 'acres',
  },

  // Crop Details
  cropTypes: [{
    type: String,
    enum: [
      'Wheat', 'Rice', 'Mustard', 'Sugarcane',
      'Cotton', 'Maize', 'Soybean', 'Groundnut',
      'Potato', 'Onion', 'Tomato', 'Other'
    ],
  }],
  season: {
    type: String,
    enum: ['Kharif', 'Rabi', 'Zaid'],
  },

  // Irrigation
  irrigation: {
    type: {
      type: String,
      enum: ['Drip', 'Flood', 'Sprinkler', 'Rainfed'],
    },
    frequency: {
      type: Number, // times per season
      min:  0,
    },
    waterSource: {
      type: String,
      enum: ['Borewell', 'Canal', 'River', 'Pond', 'Rainwater'],
    },
  },

  // Fertilizer
  fertilizer: {
    types:    [{ type: String }],
    quantity: { type: Number, default: 0 }, // bags per season
  },

  // Pesticide
  pesticide: {
    types:    [{ type: String }],
    quantity: { type: Number, default: 0 }, // litres per season
  },

  // Machine Requirements
  machines: {
    tractorDays:   { type: Number, default: 0 },
    harvesterDays: { type: Number, default: 0 },
    seederDays:    { type: Number, default: 0 },
    ploughDays:    { type: Number, default: 0 },
    sprayerDays:   { type: Number, default: 0 },
  },

  // Harvest Details
  harvestMonth: { type: Number, min: 1, max: 12 },
  harvestYear:  { type: Number },

  // Credit
  calculatedCreditLimit: { type: Number, default: 0 },
  lastCalculatedAt:      { type: Date },

  // Verification
  isVerified: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('FarmProfile', farmProfileSchema);