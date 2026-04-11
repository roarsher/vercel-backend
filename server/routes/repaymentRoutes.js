 const express = require('express');
const router  = express.Router();
const {
  getRepaymentSummary,
  makeRepayment,
  getRepaymentHistory,
} = require('../controllers/repaymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getRepaymentSummary);
router.post('/pay',    protect, makeRepayment);
router.get('/history', protect, getRepaymentHistory);

module.exports = router;