 const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Equipment name is required'],
    trim:     true,
  },
  category: {
    type: String,
    enum: ['tractor', 'harvester', 'seeder', 'plough', 'sprayer', 'irrigation', 'other'],
    required: true,
  },
  description: { type: String, trim: true },
  icon:        { type: String, default: '🚜' },
  image:       { type: String },

  // Pricing
  pricePerDay: {
    type:     Number,
    required: [true, 'Price per day is required'],
    min:      0,
  },
  buyPrice: {
    type:    Number,
    default: null,
  },
  canRent: { type: Boolean, default: true  },
  canBuy:  { type: Boolean, default: false },

  // Availability
  available:   { type: Boolean, default: true },
  totalUnits:  { type: Number,  default: 1    },
  bookedUnits: { type: Number,  default: 0    },

  // Specs
  specifications: {
    brand:    { type: String },
    model:    { type: String },
    year:     { type: Number },
    capacity: { type: String },
  },

  // Location
  location: {
    state:    { type: String },
    district: { type: String },
  },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);