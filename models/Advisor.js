const mongoose = require('mongoose');

const advisorSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type:     String,
    required: [true, 'Advisor name is required'],
    trim:     true,
  },
  email:  { type: String, unique: true, lowercase: true },
  phone:  { type: String },
  photo:  { type: String }, // Cloudinary URL

  // Expertise
  speciality: [{
    type: String,
    enum: [
      'Crop Management',
      'Soil Health',
      'Irrigation',
      'Pest Control',
      'Organic Farming',
      'Fertilizers',
      'Weather Advisory',
      'Market Prices',
    ],
  }],
  experience:    { type: Number }, // years
  qualification: { type: String },
  languages:     [{ type: String }],
  bio:           { type: String },

  // Pricing
  pricePerSession: {
    type:     Number,
    required: true,
    min:      0,
  },
  sessionDuration: { type: Number, default: 30 }, // minutes

  // Rating
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // Availability
  available: { type: Boolean, default: true },
  isActive:  { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model('Advisor', advisorSchema);