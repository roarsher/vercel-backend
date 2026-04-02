 const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── PROTECT ROUTE ──────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password -walletPIN');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Attach user to request
    req.user = user;

    // Call next middleware
    return next();

  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// ── ADMIN ONLY ─────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access only',
  });
};

module.exports = { protect, adminOnly };