const Transaction = require('../models/Transaction');
const Wallet      = require('../models/Wallet');
const Booking     = require('../models/Booking');
const FarmProfile = require('../models/FarmProfile');
const User        = require('../models/User');

// ── SPENDING BY CATEGORY ───────────────────────────
// GET /api/reports/spending
exports.getSpendingByCategory = async (req, res) => {
  try {
    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'debit',
        }
      },
      {
        $group: {
          _id:   '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, spending });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MONTHLY SPENDING ───────────────────────────────
// GET /api/reports/monthly
exports.getMonthlySpending = async (req, res) => {
  try {
    const monthly = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'debit',
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year:  { $year:  '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Format for chart
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = monthly.map(m => ({
      month:  `${months[m._id.month - 1]} ${m._id.year}`,
      amount: m.total,
      count:  m.count,
    }));

    res.json({ success: true, monthly: formatted });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── FULL REPORT SUMMARY ────────────────────────────
// GET /api/reports/summary
exports.getReportSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get wallet
    const wallet = await Wallet.findOne({ user: userId });

    // Total spent
    const spendingResult = await Transaction.aggregate([
      { $match: { user: userId, type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Total repaid
    const repaidResult = await Transaction.aggregate([
      { $match: { user: userId, type: 'repayment' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Bookings count
    const bookingsCount = await Booking.countDocuments({ user: userId });

    // Spending by category
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { user: userId, type: 'debit' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Monthly spending last 6 months
    const monthly = await Transaction.aggregate([
      { $match: { user: userId, type: 'debit' } },
      {
        $group: {
          _id:   { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyFormatted = monthly.map(m => ({
      month:  `${months[m._id.month - 1]}`,
      amount: m.total,
      count:  m.count,
    }));

    res.json({
      success: true,
      summary: {
        totalSpent:     spendingResult[0]?.total  || 0,
        totalSpentCount:spendingResult[0]?.count  || 0,
        totalRepaid:    repaidResult[0]?.total     || 0,
        bookingsCount,
        walletBalance:  wallet?.balance            || 0,
        creditLimit:    wallet?.creditLimit        || 0,
        usedCredit:     wallet?.usedCredit         || 0,
        interestRate:   wallet?.interestRate       || 2.5,
      },
      categoryBreakdown,
      monthlySpending: monthlyFormatted,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};