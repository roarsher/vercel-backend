 const express = require('express');
const router  = express.Router();
const {
  getWallet,
  spendFromWallet,
  getTransactions,
  getRepaymentSummary,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                  protect, getWallet);
router.post('/spend',            protect, spendFromWallet);
router.get('/transactions',      protect, getTransactions);
router.get('/repayment-summary', protect, getRepaymentSummary);

module.exports = router;
 