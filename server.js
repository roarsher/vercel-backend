const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────
 app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://fullfrontend-nine.vercel.app"  // ✅ ADD THIS
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── TEST ROUTE ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌾 FarmFund API is running!',
    version: '1.0.0',
  });
});

// ── API ROUTES ──────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/wallet',       require('./routes/walletRoutes'));
app.use('/api/farm',         require('./routes/farmRoutes'));
app.use('/api/equipment',    require('./routes/equipmentRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/repayment',    require('./routes/repaymentRoutes'));
app.use('/api/advisors',     require('./routes/advisorRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
// ── ERROR HANDLER ───────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── 404 HANDLER ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── START SERVER ────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 FarmFund server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});