import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Direct email configuration for development
process.env.EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
process.env.EMAIL_PORT = process.env.EMAIL_PORT || 587;
process.env.EMAIL_SECURE = process.env.EMAIL_SECURE || false;
process.env.EMAIL_USER = process.env.EMAIL_USER || 'virtualclassroom.demo@gmail.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS || 'temp_password_123';


// Check if email configuration is complete
const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Create a transporter object or use a mock one based on configuration
let transporter;

if (hasEmailConfig) {
  // Use real email transporter if credentials are available
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add connection timeout and retry settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true, // Use pooled connections
    maxConnections: 5,
    maxTries: 3, // Retry sending 3 times
  });
} else {
  // Use ethereal.email for testing or just log if not available
  console.log('Email configuration not found, using development mode for emails');
  
  // Create a mock transporter that just logs emails
  transporter = {
    sendMail: (mailOptions) => {
      console.log('DEV MODE - Email would be sent:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('OTP Code:', mailOptions.html.match(/span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">(.*?)<\/span>/)?.[1] || 'Unknown');
      
      // Return a mock successful response
      return Promise.resolve({
        messageId: `mock-message-id-${Date.now()}`,
      });
    },
  };
}

/**
 * Send an OTP email to the user
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendOtpEmail = async (to, otp) => {
  console.log(`Sending OTP email to ${to}. OTP: ${otp}`);
  
  if (hasEmailConfig) {
    console.log('Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'not set',
      pass: process.env.EMAIL_PASS ? 'is set' : 'not set'
    });
  } else {
    console.log('Using mock email transport in development mode');
  }

  const mailOptions = {
    from: `"Virtual Classroom" <${process.env.EMAIL_USER || 'noreply@virtualclassroom.com'}>`,
    to,
    subject: 'Email Verification - Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Virtual Classroom</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with Virtual Classroom. Please use the following OTP (One-Time Password) to verify your email address:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. If you didn't request this email, please ignore it.</p>
          <p>Thanks,<br>The Virtual Classroom Team</p>
        </div>
      </div>
    `,
  };

  try {
    // Implement retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
      } catch (error) {
        lastError = error;
        attempts++;
        
        // If this is not the last attempt, wait and retry
        if (attempts < maxAttempts) {
          const backoffTime = 1000 * Math.pow(2, attempts); // Exponential backoff: 2s, 4s, 8s
          console.log(`Email send attempt ${attempts} failed, retrying in ${backoffTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error('All email send attempts failed:', lastError);
    console.error('Email error details:', {
      code: lastError.code,
      response: lastError.response,
      responseCode: lastError.responseCode,
      command: lastError.command
    });
    
    // For Gmail-specific issues, provide more guidance
    if (lastError.code === 'EAUTH' || (lastError.response && lastError.response.includes('authentication'))) {
      console.error('Gmail authentication failed. This could be due to:');
      console.error('1. Incorrect email or password in .env file');
      console.error('2. Less secure app access is disabled for your Gmail account');
      console.error('3. 2FA is enabled but you\'re not using an app password');
      console.error('Please check your Gmail account settings or use a different email service.');
    }
    
    // Don't throw error in development mode, just log it
    if (!hasEmailConfig) {
      console.log('Email error would have occurred in production. Continuing in development mode.');
      return { 
        messageId: `mock-error-handled-${Date.now()}`,
        success: true // Indicate mock success
      };
    }
    
    // In development mode, let's make errors non-fatal for testing purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode - returning mock success despite email error');
      return { 
        messageId: `dev-error-suppressed-${Date.now()}`,
        error: lastError.message,
        success: true // Indicate mock success
      };
    }
    
    throw lastError;
  } catch (error) {
    console.error('Unexpected error in sendOtpEmail:', error);
    
    // Always return success in development mode
    if (process.env.NODE_ENV === 'development' || !hasEmailConfig) {
      console.log('Development mode - returning mock success despite email error');
      return { 
        messageId: `dev-error-suppressed-${Date.now()}`,
        error: error.message,
        success: true // Indicate mock success
      };
    }
    
    throw error;
  }
};

export default { sendOtpEmail };