import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { BiSave, BiX, BiArrowBack } from 'react-icons/bi'
import sessionService from '../../services/sessionService'
import courseService from '../../services/courseService'
import { toast } from 'react-toastify'
import useAuth from '../../hooks/useAuth'

const SessionForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [courses, setCourses] = useState([])
  const [courseLoading, setCourseLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    courseId: ''
  })
  
  // Convert Date to datetime-local input format
  const formatDateForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    // Format as YYYY-MM-DDThh:mm
    return d.toISOString().slice(0, 16)
  }
  
  // For initial load - fetch courses and session (if edit mode)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCourseLoading(true)
        console.log('Fetching courses for teacher...')
        
        // Try multiple approaches to get teacher courses
        let teacherCourses = [];
        let error = null;
        
        try {
          // First try /courses/teaching endpoint
          teacherCourses = await courseService.getTeacherCourses();
          console.log('Teacher courses from /teaching endpoint:', teacherCourses);
        } catch (err) {
          error = err;
          console.error('Error with getTeacherCourses:', err);
          
          // If that fails, try the general getCourses method
          try {
            console.log('Trying alternative: getCourses');
            const allCourses = await courseService.getCourses();
            console.log('All courses:', allCourses);
            
            // Filter to only show courses the teacher owns
            teacherCourses = allCourses.filter(course => 
              course.teacher && 
              (typeof course.teacher === 'string' 
                ? course.teacher === user._id
                : course.teacher._id === user._id)
            );
            
            console.log('Filtered teacher courses:', teacherCourses);
          } catch (err2) {
            console.error('Error with getCourses fallback:', err2);
            // Keep the original error if both fail
          }
        }
        
        if (teacherCourses && teacherCourses.length > 0) {
          console.log(`Found ${teacherCourses.length} teacher courses`);
          setCourses(teacherCourses);
        } else {
          console.warn('No courses found for teacher');
          setCourses([]);
          if (error) {
            console.error('Original error:', error);
          }
        }
      } catch (error) {
        console.error('Error in fetchCourses:', error);
        toast.error('Failed to load courses');
      } finally {
        setCourseLoading(false);
      }
    }
    
    const fetchSession = async () => {
      if (!isEditMode) return
      
      try {
        setInitialLoading(true)
        const sessionData = await sessionService.getSessionById(id)
        
        setFormData({
          title: sessionData.title || '',
          description: sessionData.description || '',
          startTime: formatDateForInput(sessionData.startTime),
          endTime: formatDateForInput(sessionData.endTime),
          courseId: sessionData.course?._id || '',
        })
      } catch (error) {
        console.error('Error fetching session data:', error)
        toast.error('Failed to load session details')
        navigate('/sessions')
      } finally {
        setInitialLoading(false)
      }
    }
    
    fetchCourses()
    fetchSession()
  }, [id, isEditMode, navigate, user._id])
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return false
    }
    
    if (!formData.courseId) {
      toast.error('Course is required')
      return false
    }
    
    if (!formData.startTime) {
      toast.error('Start time is required')
      return false
    }
    
    if (!formData.endTime) {
      toast.error('End time is required')
      return false
    }
    
    const startTime = new Date(formData.startTime)
    const endTime = new Date(formData.endTime)
    
    if (endTime <= startTime) {
      toast.error('End time must be after start time')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setLoading(true)
      
      const sessionData = {
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        course: formData.courseId
      }
      
      if (isEditMode) {
        await sessionService.updateSession(id, sessionData)
        toast.success('Session updated successfully')
      } else {
        await sessionService.createSession(sessionData)
        toast.success('Session created successfully')
      }
      
      navigate('/sessions')
    } catch (error) {
      console.error('Error saving session:', error)
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} session`)
    } finally {
      setLoading(false)
    }
  }
  
  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center gap-4">
        <Button
          to="/sessions"
          variant="ghost"
          size="sm"
          icon={<BiArrowBack className="h-5 w-5" />}
        >
          Back to Sessions
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Session' : 'Create New Session'}
        </h1>
      </div>
      
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter session title"
                required
                className="mt-1"
              />
            </div>
            
            {/* Course selection */}
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Course *
              </label>
              {courseLoading ? (
                <div className="mt-1">
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  <select
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => {
                      // Handle different possible course formats
                      const courseName = course.name || course.title || 'Unnamed Course';
                      const courseCode = course.code || course.subject || '';
                      const displayText = courseCode 
                        ? `${courseName} (${courseCode})` 
                        : courseName;
                      
                      return (
                        <option key={course._id} value={course._id}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-1 text-sm text-gray-500">
                    {courses.length} course(s) available
                  </div>
                </>
              )}
              {courses.length === 0 && !courseLoading && (
                <div>
                  <p className="mt-1 text-sm text-red-500">
                    You have no courses available. Please create a course first.
                  </p>
                  <Button 
                    to="/courses/create" 
                    variant="primary" 
                    size="sm"
                    className="mt-2"
                  >
                    Create New Course
                  </Button>
                </div>
              )}
            </div>
            
            {/* Start time */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time *
              </label>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                required
              />
            </div>
            
            {/* End time */}
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time *
              </label>
              <input
                id="endTime"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Enter session description"
              />
            </div>
            
            {/* Form actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/sessions')}
                icon={<BiX className="h-5 w-5" />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<BiSave className="h-5 w-5" />}
              >
                {isEditMode ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default SessionForm 