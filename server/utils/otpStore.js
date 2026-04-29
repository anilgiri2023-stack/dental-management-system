const otpStore = new Map();

/**
 * Stores OTP with expiry of 5 minutes
 * @param {string} email 
 * @param {string} otp 
 */
function saveOTP(email, otp) {
  const emailKey = email.trim().toLowerCase();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  otpStore.set(emailKey, {
    otp,
    expiresAt
  });
  
  console.log(`✅ OTP saved for ${emailKey}: ${otp}`);
}

/**
 * Checks if OTP exists, is not expired, and matches
 * @param {string} email 
 * @param {string} otp 
 * @returns {boolean}
 */
function verifyOTP(email, otp) {
  const emailKey = email.trim().toLowerCase();
  const record = otpStore.get(emailKey);
  
  if (!record) {
    console.log(`❌ No OTP record found for ${emailKey}`);
    return false;
  }
  
  const { otp: storedOtp, expiresAt } = record;
  
  if (Date.now() > expiresAt) {
    console.log(`❌ OTP expired for ${emailKey}`);
    otpStore.delete(emailKey);
    return false;
  }
  
  if (storedOtp !== otp) {
    console.log(`❌ OTP mismatch for ${emailKey}. Expected: ${storedOtp}, Got: ${otp}`);
    return false;
  }
  
  // If valid, delete OTP and return true
  otpStore.delete(emailKey);
  console.log(`✅ OTP verified and deleted for ${emailKey}`);
  return true;
}

module.exports = { saveOTP, verifyOTP };
