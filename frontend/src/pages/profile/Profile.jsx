import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { BiUser, BiEnvelope, BiLock } from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'
import { toast } from 'react-toastify'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    try {
      setLoading(true)
      
      // Only include password if it's provided
      const updateData = {
        name: formData.name,
        email: formData.email
      }
      
      if (formData.password) {
        updateData.password = formData.password
      }
      
      await updateProfile(updateData)
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }))
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
      
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="name"
                name="name"
                label="Name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
                icon={<BiEnvelope className="text-gray-400" />}
                required
              />
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={<BiLock className="text-gray-400" />}
                />
                
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={<BiLock className="text-gray-400" />}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Profile 