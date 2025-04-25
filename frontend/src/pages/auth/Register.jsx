import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BiUser, BiLock, BiEnvelope, BiUserCircle, BiCheckCircle } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import useAuth from '../../hooks/useAuth'
import EmailVerification from '../../components/auth/EmailVerification'
import { toast } from 'react-toastify'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [isRegistered, setIsRegistered] = useState(false)
  const [localEmailVerified, setLocalEmailVerified] = useState(false)
  const { 
    register, 
    loading, 
    otpVerificationState, 
    isEmailVerified, 
    sendVerificationOTPPublic,
    verifyEmailPublic
  } = useAuth()
  const navigate = useNavigate()

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }

    // Reset email verification if email changes
    if (name === 'email' && localEmailVerified) {
      setLocalEmailVerified(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendOTP = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Email is invalid' }))
      return
    }
    
    try {
      await sendVerificationOTPPublic(formData.email)
    } catch (error) {
      toast.error('Failed to send verification code')
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the verification code')
      return
    }
    
    try {
      await verifyEmailPublic(formData.email, otp)
      toast.success('Email verified successfully')
      setLocalEmailVerified(true)
    } catch (error) {
      toast.error('Invalid or expired verification code')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!localEmailVerified) {
      toast.error('Please verify your email before registering')
      return
    }
    
    if (validateForm()) {
      try {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...userData } = formData
        await register(userData)
        setIsRegistered(true)
        // After a short delay, navigate to login
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } catch (error) {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors)
        }
      }
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Virtual Classroom
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create your account
          </p>
        </div>

        <Card variant="glass" className="px-6 py-8">
          {isRegistered ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Registration Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting you to the login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="name"
                name="name"
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={<BiUser className="h-5 w-5 text-gray-400" />}
              />

              {/* Email verification section */}
              <div className="space-y-4">
                {/* Show email input when not in verification mode */}
                {!otpVerificationState.otpSent && (
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email Address"
                      placeholder="your@email.com"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      icon={<BiEnvelope className="h-5 w-5 text-gray-400" />}
                    />
                    {formData.email && !errors.email && !localEmailVerified && (
                      <div className="absolute right-0 top-7 mt-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleSendOTP}
                          loading={otpVerificationState.isVerifying}
                          disabled={!formData.email || !!errors.email || loading}
                        >
                          Verify Email
                        </Button>
                      </div>
                    )}
                    {localEmailVerified && (
                      <div className="absolute right-0 top-7 flex items-center gap-1 text-green-600 mt-2">
                        <BiCheckCircle className="h-5 w-5" />
                        <span className="text-sm">Verified</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show OTP input when verification is in progress */}
                {otpVerificationState.otpSent && !localEmailVerified && (
                  <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        We've sent a verification code to <strong>{formData.email}</strong>
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Input
                        id="otp"
                        name="otp"
                        type="text"
                        label="Verification Code"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
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
                          Verify Code
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
                    </div>
                  </div>
                )}
              </div>

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<BiLock className="h-5 w-5 text-gray-400" />}
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={<BiLock className="h-5 w-5 text-gray-400" />}
              />
              
              <Select
                id="role"
                name="role"
                label="Role"
                options={roleOptions}
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                required
                placeholder="Select your role"
              />

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register 