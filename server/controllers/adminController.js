 const User        = require('../models/User');
const Farmer      = require('../models/Farmer');
const FarmProfile = require('../models/FarmProfile');
const Wallet      = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Equipment   = require('../models/Equipment');
const Advisor     = require('../models/Advisor');
const Repayment   = require('../models/Repayment');
const Booking     = require('../models/Booking');

// ── ADMIN DASHBOARD STATS ──────────────────────────
// GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalFarmers,
      totalEquipment,
      totalBookings,
      totalAdvisors,
      totalTransactions,
      activeWallets,
      pendingRepayments,
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Equipment.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Advisor.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Wallet.countDocuments({ isActive: true }),
      Wallet.countDocuments({ repaymentStatus: 'pending', usedCredit: { $gt: 0 } }),
    ]);

    // Total credit disbursed
    const creditStats = await Wallet.aggregate([
      { $group: { _id: null, totalCredit: { $sum: '$usedCredit' }, totalLimit: { $sum: '$creditLimit' } } }
    ]);

    // Monthly registrations
    const monthlyRegistrations = await User.aggregate([
      { $match: { role: 'farmer' } },
      { $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    // Revenue from interest
    const interestRevenue = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$totalInterest' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalFarmers,
        totalEquipment,
        totalBookings,
        totalAdvisors,
        totalTransactions,
        activeWallets,
        pendingRepayments,
        totalCreditDisbursed: creditStats[0]?.totalCredit || 0,
        totalCreditLimit:     creditStats[0]?.totalLimit  || 0,
        interestRevenue:      interestRevenue[0]?.total   || 0,
        monthlyRegistrations,
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL FARMERS ────────────────────────────────
// GET /api/admin/farmers
exports.getAllFarmers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'farmer' };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const farmers = await User.find(filter)
      .select('-password -walletPIN')
      .populate('wallet', 'balance creditLimit usedCredit isActive repaymentStatus')
      .populate('farmProfile', 'landSize cropTypes calculatedCreditLimit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: farmers.length,
      total,
      pages: Math.ceil(total / limit),
      page:  Number(page),
      farmers,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET SINGLE FARMER ──────────────────────────────
// GET /api/admin/farmers/:id
exports.getFarmerById = async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id)
      .select('-password -walletPIN')
      .populate('wallet')
      .populate('farmProfile');

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const transactions = await Transaction.find({ user: farmer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const bookings = await Booking.find({ user: farmer._id })
      .populate('equipment', 'name icon')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      farmer,
      transactions,
      bookings,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TOGGLE FARMER STATUS ───────────────────────────
// PUT /api/admin/farmers/:id/toggle-status
exports.toggleFarmerStatus = async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    farmer.isActive = !farmer.isActive;
    await farmer.save();

    res.json({
      success:  true,
      message:  `Farmer ${farmer.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: farmer.isActive,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL EQUIPMENT ──────────────────────────────
// GET /api/admin/equipment
exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .sort({ createdAt: -1 });

    res.json({
      success:   true,
      count:     equipment.length,
      equipment,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD EQUIPMENT ──────────────────────────────────
// POST /api/admin/equipment
exports.addEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json({
      success:   true,
      message:   'Equipment added successfully ✅',
      equipment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE EQUIPMENT ───────────────────────────────
// PUT /api/admin/equipment/:id
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Equipment updated ✅', equipment });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE EQUIPMENT ───────────────────────────────
// DELETE /api/admin/equipment/:id
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Equipment removed ✅' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL ADVISORS ───────────────────────────────
// GET /api/admin/advisors
exports.getAllAdvisors = async (req, res) => {
  try {
    const advisors = await Advisor.find().sort({ createdAt: -1 });
    res.json({ success: true, count: advisors.length, advisors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD ADVISOR ────────────────────────────────────
// POST /api/admin/advisors
exports.addAdvisor = async (req, res) => {
  try {
    const advisor = await Advisor.create(req.body);
    res.status(201).json({ success: true, message: 'Advisor added ✅', advisor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE ADVISOR ─────────────────────────────────
// PUT /api/admin/advisors/:id
exports.updateAdvisor = async (req, res) => {
  try {
    const advisor = await Advisor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!advisor) {
      return res.status(404).json({ success: false, message: 'Advisor not found' });
    }
    res.json({ success: true, message: 'Advisor updated ✅', advisor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE ADVISOR ─────────────────────────────────
// DELETE /api/admin/advisors/:id
exports.deleteAdvisor = async (req, res) => {
  try {
    await Advisor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Advisor removed ✅' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL TRANSACTIONS ───────────────────────────
// GET /api/admin/transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments();

    res.json({
      success: true,
      count:   transactions.length,
      total,
      pages:   Math.ceil(total / limit),
      transactions,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL REPAYMENTS ─────────────────────────────
// GET /api/admin/repayments
exports.getAllRepayments = async (req, res) => {
  try {
    const wallets = await Wallet.find({ usedCredit: { $gt: 0 } })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count:   wallets.length,
      wallets,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK REPAYMENT PAID (Admin Override) ──────────
// PUT /api/admin/repayments/:userId/mark-paid
exports.markRepaymentPaid = async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.params.userId },
      {
        usedCredit:      0,
        balance:         0,
        repaymentStatus: 'paid',
        totalRepaid:     0,
      },
      { returnDocument: 'after' }
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    res.json({ success: true, message: 'Repayment marked as paid ✅', wallet });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};