 const express = require('express');
const router  = express.Router();
const {
  getSpendingByCategory,
  getMonthlySpending,
  getReportSummary,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary',  protect, getReportSummary);
router.get('/spending', protect, getSpendingByCategory);
router.get('/monthly',  protect, getMonthlySpending);

module.exports = router;