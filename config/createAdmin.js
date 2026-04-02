const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User     = require('../models/User');
const Wallet   = require('../models/Wallet');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin exists
    const existing = await User.findOne({ email: 'admin@farmfund.in' });
    if (existing) {
      console.log('⚠️  Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      name:     'FarmFund Admin',
      email:    'admin@farmfund.in',
      phone:    '9999999999',
      password: 'Admin@123',
      role:     'admin',
      aadhaarVerified: true,
      walletPINSet:    true,
    });

    console.log('✅ Admin created!');
    console.log('📧 Email:    admin@farmfund.in');
    console.log('🔑 Password: Admin@123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();