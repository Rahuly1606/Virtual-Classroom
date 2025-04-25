import React, { useState, useEffect } from 'react';
import { BiEnvelope, BiCheckCircle } from 'react-icons/bi';
import useAuth from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';

const EmailVerification = ({ email, disabled = false, isRegistration = false, insideForm = false }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { 
    sendVerificationOTP, 
    verifyEmail, 
    sendVerificationOTPPublic,
    verifyEmailPublic,
    otpVerificationState,
    resetOtpVerification,
    isEmailVerified,
    isAuthenticated,
    user
  } = useAuth();

  // Use stored email from verification state if provided email is empty
  const emailToUse = email || otpVerificationState.verificationEmail;

  // For debugging
  useEffect(() => {
    console.log('EmailVerification component - user:', user);
    console.log('EmailVerification component - isEmailVerified from context:', isEmailVerified);
    console.log('EmailVerification component - user?.isEmailVerified:', user?.isEmailVerified);
  }, [user, isEmailVerified]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      // Only reset if we are fully unmounting, not on re-renders
      resetOtpVerification();
    };
  }, []); // Empty dependency array, only run on mount/unmount

  const handleSendOTP = async () => {
    try {
      setError('');
      
      // Use different endpoints based on whether user is in registration flow or authenticated
      if (isRegistration || !isAuthenticated) {
        await sendVerificationOTPPublic(emailToUse);
      } else {
        await sendVerificationOTP();
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    try {
      setError('');
      
      // Use different endpoints based on whether user is in registration flow or authenticated
      if (isRegistration || !isAuthenticated) {
        await verifyEmailPublic(emailToUse, otp);
      } else {
        await verifyEmail(otp);
      }
      
      // Clear OTP field after verification
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  // If email is already verified, show verified badge
  if (isEmailVerified || (isAuthenticated && user?.isEmailVerified)) {
    return (
      <div className="flex items-center gap-2 text-green-600 py-2">
        <BiCheckCircle className="h-5 w-5" />
        <span>Email Verified</span>
      </div>
    );
  }

  // If OTP has been sent and we're in verification mode
  if (otpVerificationState.otpSent) {
    // Use a div instead of form when inside a form to avoid nesting
    const FormContainer = insideForm || isRegistration ? 'div' : 'form';
    
    return (
      <div className="mt-4 space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          We've sent a verification code to <strong>{emailToUse}</strong>. Please check your inbox.
        </div>
        <FormContainer 
          onSubmit={insideForm || isRegistration ? null : handleVerifyOTP} 
          className="space-y-4"
        >
          <Input
            id="otp"
            name="otp"
            type="text"
            label="Enter OTP"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            error={error}
            icon={<BiEnvelope className="h-5 w-5 text-gray-400" />}
            disabled={otpVerificationState.isVerifying}
            maxLength={6}
            autoComplete="off"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleVerifyOTP}
              loading={otpVerificationState.isVerifying}
              disabled={!otp || otpVerificationState.isVerifying}
              className="flex-1"
            >
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSendOTP}
              loading={otpVerificationState.isVerifying}
              disabled={otpVerificationState.isVerifying}
            >
              Resend
            </Button>
          </div>
        </FormContainer>
      </div>
    );
  }

  // Default: show Verify button
  return (
    <div className="mt-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleSendOTP}
        loading={otpVerificationState.isVerifying}
        disabled={disabled || otpVerificationState.isVerifying}
      >
        Verify Email
      </Button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default EmailVerification; 