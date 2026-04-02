const express = require('express');
const router  = express.Router();
const {
  getDashboardStats,
  getAllFarmers,
  getFarmerById,
  toggleFarmerStatus,
  getAllEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  getAllAdvisors,
  addAdvisor,
  updateAdvisor,
  deleteAdvisor,
  getAllTransactions,
  getAllRepayments,
  markRepaymentPaid,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes protected
router.use(protect);
router.use(adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// Farmers
router.get('/farmers',                   getAllFarmers);
router.get('/farmers/:id',               getFarmerById);
router.put('/farmers/:id/toggle-status', toggleFarmerStatus);

// Equipment
router.get('/equipment',     getAllEquipment);
router.post('/equipment',    addEquipment);
router.put('/equipment/:id', updateEquipment);
router.delete('/equipment/:id', deleteEquipment);

// Advisors
router.get('/advisors',     getAllAdvisors);
router.post('/advisors',    addAdvisor);
router.put('/advisors/:id', updateAdvisor);
router.delete('/advisors/:id', deleteAdvisor);

// Transactions
router.get('/transactions', getAllTransactions);

// Repayments
router.get('/repayments',                        getAllRepayments);
router.put('/repayments/:userId/mark-paid',      markRepaymentPaid);

module.exports = router;