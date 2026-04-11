 const express  = require('express');
const router   = express.Router();
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  setWalletPIN,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login',    login);

// Protected routes
router.post('/send-otp',   protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);
router.post('/set-pin',    protect, setWalletPIN);
router.get('/me',          protect, getMe);
router.put('/profile',     protect, updateProfile);

module.exports = router;