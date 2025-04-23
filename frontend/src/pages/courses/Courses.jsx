import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BiPlus, BiSearch, BiFilterAlt } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import courseService from '../../services/courseService'

const Courses = () => {
  const { isTeacher, isStudent } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [availableCourses, setAvailableCourses] = useState([])
  const [showAvailableCourses, setShowAvailableCourses] = useState(false)
  
  // Fetch courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        
        // Fetch user's courses based on role
        const userCourses = isTeacher 
          ? await courseService.getTeacherCourses() 
          : await courseService.getEnrolledCourses()
        
        setCourses(userCourses)
        setFilteredCourses(userCourses)
        
        // If student, also fetch available courses to enroll in
        if (isStudent) {
          const allCourses = await courseService.getCourses()
          // Filter out already enrolled courses
          const available = allCourses.filter(
            course => !userCourses.some(userCourse => userCourse._id === course._id)
          )
          setAvailableCourses(available)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [isTeacher, isStudent])
  
  // Filter courses based on search term
  useEffect(() => {
    const results = courses.filter(
      course => 
        (course.name && course.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.code && course.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredCourses(results)
  }, [searchTerm, courses])
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }
  
  // Toggle between my courses and available courses (for students)
  const toggleCourseView = () => {
    setShowAvailableCourses(!showAvailableCourses)
  }
  
  // Enroll in a course (for students)
  const handleEnroll = async (courseId) => {
    try {
      setLoading(true)
      await courseService.enrollInCourse(courseId)
      
      // Refresh courses after enrollment
      const userCourses = await courseService.getEnrolledCourses()
      setCourses(userCourses)
      setFilteredCourses(userCourses)
      
      // Update available courses
      const allCourses = await courseService.getCourses()
      const available = allCourses.filter(
        course => !userCourses.some(userCourse => userCourse._id === course._id)
      )
      setAvailableCourses(available)
      
      // Switch view to enrolled courses
      setShowAvailableCourses(false)
    } catch (error) {
      console.error('Error enrolling in course:', error)
    } finally {
      setLoading(false)
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
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isTeacher ? 'Manage Courses' : 'My Courses'}
        </h1>
        
        <div className="flex items-center gap-2">
          {isTeacher ? (
            <Button 
              to="/courses/create" 
              variant="primary"
              icon={<BiPlus className="h-5 w-5" />}
            >
              Create Course
            </Button>
          ) : (
            <Button 
              onClick={toggleCourseView} 
              variant="outline"
              icon={<BiFilterAlt className="h-5 w-5" />}
            >
              {showAvailableCourses ? 'Show My Courses' : 'Find Courses'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Search bar */}
      <div className="w-full max-w-md">
        <Input
          id="search"
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={handleSearchChange}
          icon={<BiSearch className="h-5 w-5 text-gray-400" />}
        />
      </div>
      
      {/* Course listing */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isStudent && showAvailableCourses ? (
          // Available courses for enrollment
          availableCourses.length > 0 ? (
            availableCourses.map(course => (
              <Card key={course._id} className="h-full overflow-hidden transition-shadow duration-200 hover:shadow-lg bg-white dark:bg-gray-800">
                <div className="relative h-40 overflow-hidden">
                  {course.coverImage ? (
                    <img 
                      src={`http://localhost:5000${course.coverImage}`} 
                      alt={course.title} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-center text-white">
                      <h3 className="text-xl font-bold">{course.title}</h3>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                  <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    {course.subject ? `Subject: ${course.subject}` : ''}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex border-t border-gray-200 dark:border-gray-700">
                  <Link 
                    to={`/courses/${course._id}`} 
                    className="flex-1 px-4 py-2 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-gray-700 dark:hover:text-primary-300"
                  >
                    View Details
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No available courses found.
                </p>
              </Card>
            </div>
          )
        ) : (
          // User's courses
          filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <Card key={course._id} className="h-full overflow-hidden transition-shadow duration-200 hover:shadow-lg bg-white dark:bg-gray-800">
                <div className="relative h-40 overflow-hidden">
                  {course.coverImage ? (
                    <img 
                      src={`http://localhost:5000${course.coverImage}`} 
                      alt={course.title} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-center text-white">
                      <h3 className="text-xl font-bold">{course.title}</h3>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                  <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    {course.subject ? `Subject: ${course.subject}` : ''}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex border-t border-gray-200 dark:border-gray-700">
                  <Link 
                    to={`/courses/${course._id}`} 
                    className="flex-1 px-4 py-2 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-gray-700 dark:hover:text-primary-300"
                  >
                    View Details
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'No courses match your search.'
                    : isTeacher
                      ? 'You have not created any courses yet.'
                      : 'You are not enrolled in any courses.'
                  }
                </p>
                {isTeacher && !searchTerm && (
                  <Button to="/courses/create" variant="primary" className="mt-4">
                    Create your first course
                  </Button>
                )}
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Courses 