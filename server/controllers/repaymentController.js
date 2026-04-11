 const Wallet      = require('../models/Wallet');
const Repayment   = require('../models/Repayment');
const Transaction = require('../models/Transaction');
const FarmProfile = require('../models/FarmProfile');
const {
  calculateInterest,
  calculateMonthsUntilHarvest,
} = require('../utils/creditCalculator');
const { notify } = require('../utils/notificationHelper');

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

    const repayments = await Repayment.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      repayment: {
        principal:    wallet.usedCredit,
        interestRate: wallet.interestRate,
        months,
        interest,
        totalDue,
        totalRepaid:  wallet.totalRepaid || 0,
        remaining:    totalDue - (wallet.totalRepaid || 0),
        status:       wallet.repaymentStatus,
        harvestMonth: farmProfile?.harvestMonth,
        harvestYear:  farmProfile?.harvestYear,
      },
      history: repayments,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── MAKE REPAYMENT ─────────────────────────────────
exports.makeRepayment = async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }
    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode is required (upi/bank_transfer/cash)',
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }
    if (wallet.usedCredit === 0) {
      return res.status(400).json({
        success: false,
        message: 'No outstanding amount to repay',
      });
    }

    const farmProfile = await FarmProfile.findOne({ user: req.user._id });
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

    if (amount > totalDue) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds total due. Total due: ₹${totalDue}`,
      });
    }

    const prevUsedCredit   = wallet.usedCredit;
    wallet.usedCredit      = Math.max(0, wallet.usedCredit - amount);
    wallet.balance         = wallet.creditLimit - wallet.usedCredit;
    wallet.totalRepaid     = (wallet.totalRepaid || 0) + amount;
    wallet.repaymentStatus = wallet.usedCredit === 0 ? 'paid' : 'partial';
    await wallet.save();

    const repayment = await Repayment.create({
      user:            req.user._id,
      wallet:          wallet._id,
      principal:       prevUsedCredit,
      interestAmount:  interest,
      totalAmount:     totalDue,
      paidAmount:      amount,
      remainingAmount: totalDue - amount,
      dueDate: farmProfile?.harvestYear
        ? new Date(farmProfile.harvestYear, (farmProfile.harvestMonth || 4) - 1, 1)
        : new Date(),
      paidDate:     new Date(),
      paymentMode,
      status:       wallet.usedCredit === 0 ? 'paid' : 'partial',
      installments: [{
        amount,
        paidAt:    new Date(),
        mode:      paymentMode,
        reference: `TXN${Date.now()}`,
      }],
    });

    const transaction = await Transaction.create({
      user:         req.user._id,
      wallet:       wallet._id,
      type:         'repayment',
      amount,
      category:     'repayment',
      description:  `Repayment via ${paymentMode}`,
      balanceAfter: wallet.balance,
      status:       'success',
    });

    // ✅ Notification
    await notify.repaymentDone(req.user._id, amount);

    return res.json({
      success: true,
      message: wallet.usedCredit === 0
        ? '🎉 Full repayment done! Wallet reset.'
        : `✅ ₹${amount} repaid successfully!`,
      repayment,
      transaction,
      wallet: {
        balance:         wallet.balance,
        usedCredit:      wallet.usedCredit,
        creditLimit:     wallet.creditLimit,
        repaymentStatus: wallet.repaymentStatus,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET REPAYMENT HISTORY ──────────────────────────
exports.getRepaymentHistory = async (req, res) => {
  try {
    const repayments = await Repayment.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count:   repayments.length,
      repayments,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};