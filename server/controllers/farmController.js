 const FarmProfile = require('../models/FarmProfile');
const Wallet      = require('../models/Wallet');
const User        = require('../models/User');
const {
  calculateCreditLimit,
  getCreditBreakdown,
} = require('../utils/creditCalculator');
const { notify } = require('../utils/notificationHelper');

// ── SAVE / UPDATE FARM PROFILE ─────────────────────
exports.saveFarmProfile = async (req, res) => {
  try {
    const {
      landSize, landUnit, cropTypes, season,
      irrigation, fertilizer, pesticide,
      machines, harvestMonth, harvestYear,
    } = req.body;

    if (!landSize || !cropTypes || !season) {
      return res.status(400).json({
        success: false,
        message: 'Land size, crop types and season are required',
      });
    }

    let farmProfile = await FarmProfile.findOne({ user: req.user._id });

    const farmData = {
      user:     req.user._id,
      landSize,
      landUnit: landUnit || 'acres',
      cropTypes,
      season,
      irrigation,
      fertilizer,
      pesticide,
      machines,
      harvestMonth,
      harvestYear,
    };

    if (farmProfile) {
      farmProfile = await FarmProfile.findOneAndUpdate(
        { user: req.user._id },
        farmData,
        { returnDocument: 'after', runValidators: true }
      );
    } else {
      farmProfile = await FarmProfile.create(farmData);
      await User.findByIdAndUpdate(
        req.user._id,
        { farmProfile: farmProfile._id },
        { returnDocument: 'after' }
      );
    }

    const creditLimit = calculateCreditLimit(farmProfile);
    const breakdown   = getCreditBreakdown(farmProfile);

    farmProfile.calculatedCreditLimit = creditLimit;
    farmProfile.lastCalculatedAt      = new Date();
    await farmProfile.save();

    await Wallet.findOneAndUpdate(
      { user: req.user._id },
      {
        creditLimit,
        balance:           creditLimit,
        isActive:          true,
        farmProfileFilled: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // ✅ Notifications
    await notify.farmProfileSaved(req.user._id, creditLimit);
    await notify.walletActivated(req.user._id, creditLimit);

    return res.status(201).json({
      success:     true,
      message:     'Farm profile saved! Wallet credit calculated 🌾',
      farmProfile,
      creditLimit,
      breakdown,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET FARM PROFILE ───────────────────────────────
exports.getFarmProfile = async (req, res) => {
  try {
    const farmProfile = await FarmProfile.findOne({ user: req.user._id });

    if (!farmProfile) {
      return res.status(404).json({
        success: false,
        message: 'Farm profile not found. Please create one.',
      });
    }

    return res.json({
      success: true,
      farmProfile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── CALCULATE CREDIT ONLY ──────────────────────────
exports.calculateCredit = async (req, res) => {
  try {
    const farmData    = req.body;
    const creditLimit = calculateCreditLimit(farmData);
    const breakdown   = getCreditBreakdown(farmData);

    return res.json({
      success: true,
      creditLimit,
      breakdown,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── UPDATE FARM PROFILE ────────────────────────────
exports.updateFarmProfile = async (req, res) => {
  try {
    const farmProfile = await FarmProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!farmProfile) {
      return res.status(404).json({
        success: false,
        message: 'Farm profile not found',
      });
    }

    const creditLimit = calculateCreditLimit(farmProfile);
    const breakdown   = getCreditBreakdown(farmProfile);

    farmProfile.calculatedCreditLimit = creditLimit;
    farmProfile.lastCalculatedAt      = new Date();
    await farmProfile.save();

    await Wallet.findOneAndUpdate(
      { user: req.user._id },
      { creditLimit },
      { returnDocument: 'after' }
    );

    return res.json({
      success:     true,
      message:     'Farm profile updated! Credit recalculated 🌾',
      farmProfile,
      creditLimit,
      breakdown,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};