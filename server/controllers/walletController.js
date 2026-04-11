 const Wallet      = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const {
  calculateInterest,
  calculateMonthsUntilHarvest,
} = require('../utils/creditCalculator');
const FarmProfile = require('../models/FarmProfile');
const { notify }  = require('../utils/notificationHelper');

// ── GET WALLET ─────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    return res.json({
      success: true,
      wallet: {
        id:               wallet._id,
        balance:          wallet.balance,
        creditLimit:      wallet.creditLimit,
        usedCredit:       wallet.usedCredit,
        interestRate:     wallet.interestRate,
        totalInterest:    wallet.totalInterest,
        isActive:         wallet.isActive,
        repaymentStatus:  wallet.repaymentStatus,
        availableBalance: wallet.creditLimit - wallet.usedCredit,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── SPEND FROM WALLET ──────────────────────────────
exports.spendFromWallet = async (req, res) => {
  try {
    const { amount, category, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet || !wallet.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not active. Complete farm profile first.',
      });
    }

    const available = wallet.creditLimit - wallet.usedCredit;
    if (amount > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${available}`,
      });
    }

    // Deduct from wallet
    wallet.usedCredit += amount;
    wallet.balance     = wallet.creditLimit - wallet.usedCredit;
    await wallet.save();

    // Create transaction
    const transaction = await Transaction.create({
      user:         req.user._id,
      wallet:       wallet._id,
      type:         'debit',
      amount,
      category:     category || 'other',
      description:  description || 'Wallet payment',
      balanceAfter: wallet.balance,
      status:       'success',
    });

    // ✅ Notification
    await notify.walletSpent(req.user._id, amount, category || 'other');

    return res.json({
      success: true,
      message: `₹${amount} deducted from wallet ✅`,
      wallet: {
        balance:     wallet.balance,
        usedCredit:  wallet.usedCredit,
        creditLimit: wallet.creditLimit,
      },
      transaction,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET TRANSACTIONS ───────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count:   transactions.length,
      transactions,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET REPAYMENT SUMMARY ──────────────────────────
exports.getRepaymentSummary = async (req, res) => {
  try {
    const wallet      = await Wallet.findOne({ user: req.user._id });
    const farmProfile = await FarmProfile.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    let months = 3;
    if (farmProfile?.harvestMonth && farmProfile?.harvestYear) {
      months = calculateMonthsUntilHarvest(
        farmProfile.harvestMonth,
        farmProfile.harvestYear
      );
    }

    const interest = calculateInterest(
      wallet.usedCredit,
      wallet.interestRate,
      months
    );

    const totalDue = wallet.usedCredit + interest;

    return res.json({
      success: true,
      repayment: {
        usedCredit:   wallet.usedCredit,
        interestRate: wallet.interestRate,
        months,
        interest,
        totalDue,
        harvestMonth: farmProfile?.harvestMonth,
        harvestYear:  farmProfile?.harvestYear,
        status:       wallet.repaymentStatus,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};