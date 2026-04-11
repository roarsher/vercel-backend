 const express = require('express');
const router  = express.Router();
const {
  saveFarmProfile,
  getFarmProfile,
  calculateCredit,
  updateFarmProfile,
} = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.post('/',                 protect, saveFarmProfile);
router.get('/',                  protect, getFarmProfile);
router.put('/',                  protect, updateFarmProfile);
router.post('/calculate-credit', protect, calculateCredit);

module.exports = router;