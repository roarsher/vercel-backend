 const Equipment   = require('../models/Equipment');
const Booking     = require('../models/Booking');
const Wallet      = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { notify }  = require('../utils/notificationHelper');

// ── GET ALL EQUIPMENT ──────────────────────────────
exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find({ isActive: true });
    return res.json({
      success:   true,
      count:     equipment.length,
      equipment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET SINGLE EQUIPMENT ───────────────────────────
exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }
    return res.json({ success: true, equipment });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── BOOK EQUIPMENT ─────────────────────────────────
exports.bookEquipment = async (req, res) => {
  try {
    const { equipmentId, days, startDate, bookingType, notes } = req.body;

    if (!equipmentId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID and start date are required',
      });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }
    if (!equipment.available) {
      return res.status(400).json({
        success: false,
        message: 'Equipment is not available right now',
      });
    }

    const rentalDays = days || 1;
    const totalCost  = bookingType === 'buy'
      ? equipment.buyPrice
      : equipment.pricePerDay * rentalDays;

    if (!totalCost || totalCost <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost calculation',
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || !wallet.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not active. Complete farm profile first.',
      });
    }

    const available = wallet.creditLimit - wallet.usedCredit;
    if (totalCost > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${available}`,
      });
    }

    const end = new Date(startDate);
    end.setDate(end.getDate() + rentalDays);

    const booking = await Booking.create({
      user:        req.user._id,
      equipment:   equipmentId,
      bookingType: bookingType || 'rent',
      days:        rentalDays,
      startDate:   new Date(startDate),
      endDate:     end,
      pricePerDay: equipment.pricePerDay,
      totalCost,
      status:      'confirmed',
      notes,
    });

    wallet.usedCredit += totalCost;
    wallet.balance     = wallet.creditLimit - wallet.usedCredit;
    await wallet.save();

    const transaction = await Transaction.create({
      user:           req.user._id,
      wallet:         wallet._id,
      type:           'debit',
      amount:         totalCost,
      category:       'machine_rent',
      description:    `${equipment.name} - ${bookingType || 'rent'} for ${rentalDays} day(s)`,
      reference:      booking._id,
      referenceModel: 'Booking',
      balanceAfter:   wallet.balance,
      status:         'success',
    });

    booking.transaction = transaction._id;
    await booking.save();

    equipment.bookedUnits += 1;
    if (equipment.bookedUnits >= equipment.totalUnits) {
      equipment.available = false;
    }
    await equipment.save();

    // ✅ Notification
    await notify.bookingConfirmed(req.user._id, equipment.name);

    return res.status(201).json({
      success:       true,
      message:       `${equipment.name} booked successfully! 🚜`,
      booking,
      transaction,
      walletBalance: wallet.balance,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET MY BOOKINGS ────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('equipment', 'name category icon pricePerDay')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count:   bookings.length,
      bookings,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── CANCEL BOOKING ─────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking already cancelled',
      });
    }

    const wallet       = await Wallet.findOne({ user: req.user._id });
    wallet.usedCredit -= booking.totalCost;
    wallet.balance     = wallet.creditLimit - wallet.usedCredit;
    await wallet.save();

    await Transaction.create({
      user:         req.user._id,
      wallet:       wallet._id,
      type:         'credit',
      amount:       booking.totalCost,
      category:     'credit_added',
      description:  'Refund for cancelled booking',
      balanceAfter: wallet.balance,
      status:       'success',
    });

    const equipment       = await Equipment.findById(booking.equipment);
    equipment.bookedUnits = Math.max(0, equipment.bookedUnits - 1);
    equipment.available   = true;
    await equipment.save();

    booking.status       = 'cancelled';
    booking.cancelReason = req.body.reason || 'Cancelled by farmer';
    await booking.save();

    // ✅ Notification
    await notify.bookingCancelled(req.user._id, equipment.name);

    return res.json({
      success:       true,
      message:       'Booking cancelled. Amount refunded to wallet ✅',
      refundAmount:  booking.totalCost,
      walletBalance: wallet.balance,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── ADD EQUIPMENT (Admin) ──────────────────────────
exports.addEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    return res.status(201).json({
      success:   true,
      message:   'Equipment added successfully ✅',
      equipment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};