const Transaction = require('../models/Transaction');

// ── GET ALL TRANSACTIONS ───────────────────────────
// GET /api/transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, category, limit = 20, page = 1 } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    if (type)     filter.type     = type;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('reference');

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      count:   transactions.length,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / limit),
      transactions,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET SINGLE TRANSACTION ─────────────────────────
// GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('reference');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check ownership
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      transaction,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET TRANSACTION SUMMARY ────────────────────────
// GET /api/transactions/summary
exports.getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total spent by category
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
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
      { $sort: { total: -1 } }
    ]);

    // Monthly spending
    const monthlySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'debit',
        }
      },
      {
        $group: {
          _id: {
            month: { $month:  '$createdAt' },
            year:  { $year:   '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    // Total debit & credit
    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id:          '$type',
          totalAmount:  { $sum: '$amount' },
          count:        { $sum: 1 },
        }
      }
    ]);

    // Format totals
    const summary = { debit: 0, credit: 0, repayment: 0 };
    totals.forEach(t => { summary[t._id] = t.totalAmount; });

    res.json({
      success: true,
      summary,
      categoryBreakdown,
      monthlySpending,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};