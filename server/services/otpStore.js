const otpStore = new Map();

/**
 * Stores OTP with expiry of 5 minutes and optional user data
 * @param {string} email 
 * @param {string} otp 
 * @param {object} userData { name, phone }
 */
export function saveOTP(email, otp, userData = {}) {
  const emailKey = email.trim().toLowerCase();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  otpStore.set(emailKey, {
    otp: String(otp), // Ensure it's a string
    expires,
    ...userData
  });
  
  console.log(`✅ OTP saved for ${emailKey}: ${otp} (Expires: ${new Date(expires).toLocaleTimeString()})`);
}

/**
 * Checks if OTP exists, is not expired, and matches
 * @param {string} email 
 * @param {string} otp 
 * @returns {object|null} The record if valid, null otherwise
 */
export function verifyOTP(email, otp) {
  const emailKey = email.trim().toLowerCase();
  
  console.log("--- OTP Verification Debug ---");
  console.log("Email:", emailKey);
  console.log("Incoming OTP:", otp);
  
  const record = otpStore.get(emailKey);
  
  if (!record) {
    console.log(`❌ No OTP record found for ${emailKey}`);
    return { valid: false, error: "OTP expired" }; // Usually missing record means it was deleted after expiry
  }
  
  console.log("Stored OTP:", record.otp);
  
  if (Date.now() > record.expires) {
    console.log(`❌ OTP expired for ${emailKey}`);
    otpStore.delete(emailKey);
    return { valid: false, error: "OTP expired" };
  }
  
  if (record.otp !== String(otp)) {
    console.log(`❌ OTP mismatch for ${emailKey}. Expected: ${record.otp}, Got: ${otp}`);
    return { valid: false, error: "Invalid OTP" };
  }
  
  // If valid, delete OTP and return record
  otpStore.delete(emailKey);
  console.log(`✅ OTP verified and deleted for ${emailKey}`);
  return { valid: true, record };
}
