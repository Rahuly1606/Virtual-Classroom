import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { BiUser, BiEnvelope, BiLock, BiBookOpen, BiCalendar, BiCheckCircle } from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'
import { toast } from 'react-toastify'
import EmailVerification from '../../components/auth/EmailVerification'

const Profile = () => {
  const { user, updateProfile, changePassword, isEmailVerified, sendPasswordResetOTP, resetPasswordWithOTP } = useAuth()
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    section: user?.section || '',
    year: user?.year || ''
  })
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  
  // States for forgot password functionality
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState('init') // init, verify, reset
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: ''
  })
  const [loadingReset, setLoadingReset] = useState(false)
  
  // Check if user is a teacher
  const isTeacher = user?.role === 'teacher'
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target
    setResetPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoadingProfile(true)
      
      // For teachers, don't include section and year
      const updateData = {
        name: profileData.name,
        bio: profileData.bio,
      }
      
      // Only include section and year for students
      if (!isTeacher) {
        updateData.section = profileData.section
        updateData.year = profileData.year
      }
      
      await updateProfile(updateData)
      
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (!passwordData.oldPassword) {
      toast.error('Please enter your current password')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    
    try {
      setLoadingPassword(true)
      
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
      
      // Clear password fields after successful update
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setLoadingPassword(false)
    }
  }
  
  const handleForgotPassword = () => {
    setForgotPassword(true)
    setForgotPasswordStep('verify')
  }
  
  const handleSendOTP = async () => {
    try {
      setLoadingReset(true)
      await sendPasswordResetOTP(user.email)
      toast.success(`OTP sent to ${user.email}`)
    } catch (error) {
      console.error('Error sending OTP:', error)
    } finally {
      setLoadingReset(false)
    }
  }
  
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (!resetPasswordData.otp) {
      toast.error('Please enter the OTP')
      return
    }
    
    if (resetPasswordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    
    try {
      setLoadingReset(true)
      
      await resetPasswordWithOTP(
        user.email,
        resetPasswordData.otp,
        resetPasswordData.newPassword
      )
      
      // Reset states and data after successful password reset
      setForgotPassword(false)
      setForgotPasswordStep('init')
      setResetPasswordData({
        newPassword: '',
        confirmPassword: '',
        otp: ''
      })
      
    } catch (error) {
      console.error('Error resetting password:', error)
    } finally {
      setLoadingReset(false)
    }
  }
  
  // Return to normal password change form
  const handleCancelForgotPassword = () => {
    setForgotPassword(false)
    setForgotPasswordStep('init')
    setResetPasswordData({
      newPassword: '',
      confirmPassword: '',
      otp: ''
    })
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
      
      {/* Profile Information */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Basic Information</h2>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Input
                id="name"
                name="name"
                label="Name"
                placeholder="Enter your name"
                value={profileData.name}
                onChange={handleProfileChange}
                icon={<BiUser className="text-gray-400" />}
                required
              />
            </div>
            
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={profileData.email}
                onChange={handleProfileChange}
                icon={<BiEnvelope className="text-gray-400" />}
                disabled
                helpText="Email cannot be changed"
              />
              <div className="absolute right-0 top-7">
                {isEmailVerified ? (
                  <div className="flex items-center gap-2 text-green-600 mt-2.5">
                    <BiCheckCircle className="h-5 w-5" />
                    <span className="text-sm">Verified</span>
                  </div>
                ) : (
                  <EmailVerification 
                    email={profileData.email}
                    isRegistration={false} 
                  />
                )}
              </div>
            </div>
            
            {/* Only show section and year inputs for students */}
            {!isTeacher && (
              <>
                <div>
                  <Input
                    id="section"
                    name="section"
                    label="Section"
                    placeholder="Enter your section (e.g. A, B, C)"
                    value={profileData.section}
                    onChange={handleProfileChange}
                    icon={<BiBookOpen className="text-gray-400" />}
                  />
                </div>
                
                <div>
                  <Input
                    id="year"
                    name="year"
                    label="College Year"
                    placeholder="Enter your current year (e.g. 1, 2, 3, 4)"
                    value={profileData.year}
                    onChange={handleProfileChange}
                    icon={<BiCalendar className="text-gray-400" />}
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Tell us a little about yourself"
                value={profileData.bio}
                onChange={handleProfileChange}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={loadingProfile}
              >
                Update Profile
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
      
      {/* Password Change */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">
            {forgotPassword ? 'Reset Password' : 'Change Password'}
          </h2>
        </Card.Header>
        <Card.Body>
          {!forgotPassword ? (
            <>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Input
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    label="Current Password"
                    placeholder="Enter your current password"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loadingPassword}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              {/* Email Verification Section */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We'll send a verification code to <strong>{user?.email}</strong> to reset your password.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSendOTP}
                    loading={loadingReset}
                    disabled={loadingReset}
                  >
                    Send Verification Code
                  </Button>
                </div>
              </div>
              
              {/* Reset Password Form */}
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    label="Verification Code"
                    placeholder="Enter the 6-digit code"
                    value={resetPasswordData.otp}
                    onChange={handleResetPasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                    maxLength={6}
                  />
                </div>
                
                <div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="Enter new password"
                    value={resetPasswordData.newPassword}
                    onChange={handleResetPasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={resetPasswordData.confirmPassword}
                    onChange={handleResetPasswordChange}
                    icon={<BiLock className="text-gray-400" />}
                    required
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForgotPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loadingReset}
                  >
                    Reset Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default Profile 