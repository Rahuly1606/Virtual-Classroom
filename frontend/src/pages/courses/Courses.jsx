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
              <Card key={course._id} hover className="flex flex-col overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400 p-4 text-white">
                  <h3 className="text-xl font-bold">{course.name || 'Untitled Course'}</h3>
                  <p className="mt-1 text-sm opacity-80">{course.code || 'No code'}</p>
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {course.description || 'No description available.'}
                  </p>
                  <div className="mt-auto flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEnroll(course._id)}
                    >
                      Enroll
                    </Button>
                  </div>
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
              <Card key={course._id} hover className="flex flex-col overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400 p-4 text-white">
                  <h3 className="text-xl font-bold">{course.name || 'Untitled Course'}</h3>
                  <p className="mt-1 text-sm opacity-80">{course.code || 'No code'}</p>
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {course.description || 'No description available.'}
                  </p>
                  <div className="mt-auto pt-4">
                    <Link
                      to={`/courses/${course._id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      View course
                    </Link>
                  </div>
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