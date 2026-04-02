 const express = require('express');
const router  = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  getTransactionSummary,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All protected
router.get('/summary', protect, getTransactionSummary);
router.get('/',        protect, getAllTransactions);
router.get('/:id',     protect, getTransactionById);

module.exports = router;