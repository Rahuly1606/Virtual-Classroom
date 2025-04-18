import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BiSave, BiArrowBack, BiImage } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import courseService from '../../services/courseService'
import { toast } from 'react-toastify'

const CourseForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    startDate: '',
    endDate: ''
  })
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [errors, setErrors] = useState({})
  
  // Fetch course data if in edit mode
  useEffect(() => {
    const fetchCourseData = async () => {
      if (isEditMode) {
        try {
          setLoading(true)
          const courseData = await courseService.getCourseById(id)
          setFormData({
            title: courseData.title || '',
            subject: courseData.subject || '',
            description: courseData.description || '',
            startDate: courseData.startDate ? new Date(courseData.startDate).toISOString().split('T')[0] : '',
            endDate: courseData.endDate ? new Date(courseData.endDate).toISOString().split('T')[0] : ''
          })
          
          if (courseData.coverImage) {
            setCoverImagePreview(`http://localhost:5000${courseData.coverImage}`);
          }
        } catch (error) {
          console.error('Error fetching course:', error)
          toast.error('Failed to load course data')
          navigate('/courses')
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchCourseData()
  }, [id, isEditMode, navigate])
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverImage(file)
      setCoverImagePreview(URL.createObjectURL(file))
      
      // Clear error if any
      if (errors.coverImage) {
        setErrors(prev => ({
          ...prev,
          coverImage: ''
        }))
      }
    }
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      try {
        setSubmitting(true)
        
        // Create FormData object for file upload
        const formDataToSend = new FormData()
        formDataToSend.append('title', formData.title)
        formDataToSend.append('subject', formData.subject)
        formDataToSend.append('description', formData.description)
        
        if (formData.startDate) {
          formDataToSend.append('startDate', formData.startDate)
        }
        
        if (formData.endDate) {
          formDataToSend.append('endDate', formData.endDate)
        }
        
        // Add cover image if selected
        if (coverImage) {
          formDataToSend.append('coverImage', coverImage)
        }
        
        let result
        if (isEditMode) {
          result = await courseService.updateCourse(id, formDataToSend)
          toast.success('Course updated successfully')
        } else {
          result = await courseService.createCourse(formDataToSend)
          toast.success('Course created successfully')
        }
        
        navigate(`/courses/${isEditMode ? id : result._id}`)
      } catch (error) {
        console.error('Error saving course:', error)
        toast.error(isEditMode ? 'Failed to update course' : 'Failed to create course')
        
        if (error.response?.data?.errors) {
          // Map error array to object with field names as keys
          const errorObj = {}
          error.response.data.errors.forEach(err => {
            errorObj[err.field] = err.message
          })
          setErrors(errorObj)
        }
      } finally {
        setSubmitting(false)
      }
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            to="/courses" 
            variant="ghost" 
            size="sm"
            icon={<BiArrowBack className="h-5 w-5" />}
          >
            Back to Courses
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Course' : 'Create Course'}
          </h1>
        </div>
      </div>
      
      {/* Form */}
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="title"
              name="title"
              label="Course Title"
              placeholder="Introduction to Programming"
              required
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
            />
            
            <Input
              id="subject"
              name="subject"
              label="Subject"
              placeholder="Computer Science"
              value={formData.subject}
              onChange={handleChange}
              error={errors.subject}
            />
            
            <div className="space-y-2">
              <label 
                htmlFor="description" 
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                placeholder="Enter course description here..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                  {errors.description}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                id="startDate"
                name="startDate"
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={handleChange}
                error={errors.startDate}
              />
              
              <Input
                id="endDate"
                name="endDate"
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={handleChange}
                error={errors.endDate}
              />
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="coverImage" 
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                Cover Image
              </label>
              
              {coverImagePreview && (
                <div className="mb-4">
                  <img 
                    src={coverImagePreview} 
                    alt="Cover preview" 
                    className="h-40 w-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="coverImage"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <BiImage className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SVG, PNG, JPG (MAX. 2MB)
                    </p>
                  </div>
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              {errors.coverImage && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                  {errors.coverImage}
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/courses')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<BiSave className="h-5 w-5" />}
                loading={submitting}
              >
                {isEditMode ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default CourseForm 