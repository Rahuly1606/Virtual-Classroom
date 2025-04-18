import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BiUser, BiLock, BiEnvelope, BiUserCircle } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import useAuth from '../../hooks/useAuth'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  })
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuth()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      try {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...userData } = formData
        await register(userData)
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