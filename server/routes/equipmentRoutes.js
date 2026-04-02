 const express = require('express');
const router  = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  bookEquipment,
  getMyBookings,
  cancelBooking,
  addEquipment,
} = require('../controllers/equipmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/',             getAllEquipment);

// ⚠️ SPECIFIC routes BEFORE dynamic /:id route
router.post('/book',        protect, bookEquipment);
router.get('/my-bookings',  protect, getMyBookings);

// Dynamic route LAST
router.get('/:id',          getEquipmentById);
router.put('/cancel/:id',   protect, cancelBooking);

// Admin only
router.post('/', protect, adminOnly, addEquipment);

module.exports = router;