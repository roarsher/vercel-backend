 const User        = require('../models/User');
const Farmer      = require('../models/Farmer');
const Wallet      = require('../models/Wallet');
const { generateToken } = require('../utils/jwtHelper');
const { sendAadhaarOTP, verifyAadhaarOTP } = require('../utils/aadhaarOTPGenerator');

// ── REGISTER ───────────────────────────────────────
 exports.register = async (req, res) => {
     console.log("🔥 CORRECT REGISTER HIT");
  try {
    const { name, email, phone, password } = req.body;

    // ✅ Check each field individually with clear messages
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name',
      });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }
    if (!phone || phone.trim().length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number',
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() },
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase().trim()
          ? 'This email is already registered'
          : 'This phone number is already registered',
      });
    }

    // Create user
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      phone:    phone.trim(),
      password,
    });

    // Create wallet
    const wallet = await Wallet.create({
      user:     user._id,
      isActive: false,
    });

    // Create farmer
    await Farmer.create({ user: user._id });

    // Link wallet
    user.wallet = wallet._id;
    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! 🌾',
      token,
      farmer: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        phone:           user.phone,
        aadhaarVerified: user.aadhaarVerified,
        walletPINSet:    user.walletPINSet,
        role:            user.role,
      },
    });

  } catch (err) {
    console.error('Register error:', err.message);

    // Handle mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Phone'} already registered`,
      });
    }

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ── LOGIN ──────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({
      $or: [{ email }, { phone: email }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🌾`,
      token,
      farmer: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        phone:           user.phone,
        aadhaarVerified: user.aadhaarVerified,
        walletPINSet:    user.walletPINSet,
        role:            user.role,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── SEND OTP ───────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number is required',
      });
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');

    if (cleanAadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number — must be 12 digits',
      });
    }

    const result = await sendAadhaarOTP(cleanAadhaar, req.user.phone);

    return res.json({
      success: true,
      message: result.message,
      otp:     result.otp,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── VERIFY OTP ─────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    if (!aadhaarNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and OTP are required',
      });
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
    const result       = verifyAadhaarOTP(cleanAadhaar, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      aadhaarNumber:   cleanAadhaar,
      aadhaarVerified: true,
    });

    return res.json({
      success: true,
      message: 'Aadhaar verified successfully! ✅',
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── SET WALLET PIN ─────────────────────────────────
exports.setWalletPIN = async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PIN and confirm PIN are required',
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PINs do not match',
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits',
      });
    }

    const user        = await User.findById(req.user._id);
    user.walletPIN    = pin;
    user.walletPINSet = true;
    await user.save();

    return res.json({
      success: true,
      message: 'Wallet PIN set successfully! 🔐',
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET ME ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wallet')
      .populate('farmProfile');

    return res.json({
      success: true,
      farmer: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        phone:           user.phone,
        aadhaarVerified: user.aadhaarVerified,
        walletPINSet:    user.walletPINSet,
        role:            user.role,
        wallet:          user.wallet,
        farmProfile:     user.farmProfile,
        createdAt:       user.createdAt,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// // ── UPDATE PROFILE ─────────────────────────────────
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, phone } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { name, email, phone },
//       { new: true, runValidators: true }
//     );

//     return res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       farmer: {
//         id:    user._id,
//         name:  user.name,
//         email: user.email,
//         phone: user.phone,
//       },
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// ── UPDATE PROFILE ─────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { returnDocument: 'after', runValidators: true }  // ✅ fixed
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      farmer: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};