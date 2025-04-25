import otpGenerator from 'otp-generator';

// In-memory OTP storage (in a production app, you'd use Redis or a database)
const otpStorage = new Map();

/**
 * Generate a new OTP for a specific email
 * @param {string} email - The user's email
 * @returns {string} - The generated OTP
 */
export const generateOTP = (email) => {
  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false 
  });
  
  // Store OTP with expiry time (10 minutes)
  otpStorage.set(email, {
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  
  return otp;
};

/**
 * Verify an OTP for a specific email
 * @param {string} email - The user's email
 * @param {string} userOtp - The OTP entered by the user
 * @returns {boolean} - Whether the OTP is valid
 */
export const verifyOTP = (email, userOtp) => {
  const otpData = otpStorage.get(email);
  
  // Check if OTP exists and hasn't expired
  if (!otpData) {
    return false;
  }
  
  if (otpData.expiresAt < new Date()) {
    // OTP has expired, clean up
    otpStorage.delete(email);
    return false;
  }
  
  // Verify OTP
  const isValid = otpData.otp === userOtp;
  
  // If OTP is valid, clean up
  if (isValid) {
    otpStorage.delete(email);
  }
  
  return isValid;
};

export default { generateOTP, verifyOTP }; 