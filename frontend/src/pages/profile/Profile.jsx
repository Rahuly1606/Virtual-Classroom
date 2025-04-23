import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { BiUser, BiEnvelope, BiLock, BiBookOpen, BiCalendar } from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'
import { toast } from 'react-toastify'

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  
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
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoadingProfile(true)
      
      await updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        section: profileData.section,
        year: profileData.year
      })
      
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
            
            <div>
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
            </div>
            
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
          <h2 className="text-xl font-semibold">Change Password</h2>
        </Card.Header>
        <Card.Body>
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
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={loadingPassword}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Profile 