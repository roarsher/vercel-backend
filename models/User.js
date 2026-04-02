//  const mongoose = require('mongoose');
// const bcrypt   = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type:     String,
//     required: [true, 'Name is required'],
//     trim:     true,
//   },
//   email: {
//     type:      String,
//     required:  [true, 'Email is required'],
//     unique:    true,
//     lowercase: true,
//     trim:      true,
//     match:     [/^\S+@\S+\.\S+$/, 'Please enter valid email'],
//   },
//   phone: {
//     type:     String,
//     required: [true, 'Phone number is required'],
//     unique:   true,
//     match:    [/^[6-9]\d{9}$/, 'Please enter valid Indian phone number'],
//   },
//   password: {
//     type:      String,
//     required:  [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters'],
//     select:    false,
//   },
//   aadhaarNumber: {
//     type:   String,
//     unique: true,
//     sparse: true,
//   },
//   aadhaarVerified: {
//     type:    Boolean,
//     default: false,
//   },
//   walletPIN: {
//     type:   String,
//     select: false,
//   },
//   walletPINSet: {
//     type:    Boolean,
//     default: false,
//   },
//   wallet:      { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
//   farmProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmProfile' },
//   role: {
//     type:    String,
//     enum:    ['farmer', 'admin'],
//     default: 'farmer',
//   },
//   isActive: {
//     type:    Boolean,
//     default: true,
//   },
//   resetPasswordToken:  String,
//   resetPasswordExpire: Date,

// }, { timestamps: true });

// // ── SINGLE PRE-SAVE HOOK ───────────────────────────
// userSchema.pre('save', async function() {
//   // Hash password if modified
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 12);
//   }

//   // Hash wallet PIN if modified
//   if (this.isModified('walletPIN') && this.walletPIN) {
//     this.walletPIN = await bcrypt.hash(this.walletPIN, 10);
//   }
// });

// // ── COMPARE PASSWORD ───────────────────────────────
// userSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // ── COMPARE WALLET PIN ─────────────────────────────
// userSchema.methods.matchWalletPIN = async function(enteredPIN) {
//   return await bcrypt.compare(enteredPIN, this.walletPIN);
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
    minlength:[2, 'Name must be at least 2 characters'],
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type:     String,
    required: [true, 'Phone number is required'],
    unique:   true,
    trim:     true,
    // ✅ Fixed — accepts any 10 digit number
    match:    [/^\d{10}$/, 'Phone must be exactly 10 digits'],
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:    false,
  },
  aadhaarNumber: {
    type:   String,
    unique: true,
    sparse: true,
  },
  aadhaarVerified: {
    type:    Boolean,
    default: false,
  },
  walletPIN: {
    type:   String,
    select: false,
  },
  walletPINSet: {
    type:    Boolean,
    default: false,
  },
  wallet:      { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet'      },
  farmProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmProfile' },
  role: {
    type:    String,
    enum:    ['farmer', 'admin'],
    default: 'farmer',
  },
  isActive: {
    type:    Boolean,
    default: true,
  },
  resetPasswordToken:  String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// ── SINGLE PRE-SAVE HOOK ───────────────────────────
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified('walletPIN') && this.walletPIN) {
    this.walletPIN = await bcrypt.hash(this.walletPIN, 10);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchWalletPIN = async function(enteredPIN) {
  return await bcrypt.compare(enteredPIN, this.walletPIN);
};

module.exports = mongoose.model('User', userSchema);
 