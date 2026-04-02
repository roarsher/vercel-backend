// In production use UIDAI API or Twilio
// For now using in-memory OTP store

const otpStore = new Map();

// Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (store it)
const sendAadhaarOTP = async (aadhaarNumber, phone) => {
  try {
    const otp     = generateOTP();
    const key     = `otp_${aadhaarNumber}`;
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(key, { otp, expires, phone });

    // In production → send via Twilio SMS
    // const { sendSMS } = require('./smsService');
    // await sendSMS(phone, `Your FarmFund OTP is: ${otp}. Valid for 10 minutes.`);

    // For development → log OTP
    console.log(`🔑 OTP for ${aadhaarNumber}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      // Remove otp from response in production!
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  } catch (err) {
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Verify OTP
const verifyAadhaarOTP = (aadhaarNumber, otp) => {
  const key  = `otp_${aadhaarNumber}`;
  const data = otpStore.get(key);

  if (!data) {
    return { valid: false, message: 'OTP not found or already used' };
  }

  if (Date.now() > data.expires) {
    otpStore.delete(key);
    return { valid: false, message: 'OTP has expired' };
  }

  if (data.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }

  // Delete OTP after successful verify
  otpStore.delete(key);
  return { valid: true, message: 'OTP verified successfully' };
};

module.exports = { sendAadhaarOTP, verifyAadhaarOTP };