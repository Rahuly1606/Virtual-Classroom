import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BiBook, BiVideo, BiTask, BiCalendarCheck, BiChart, BiTime, BiRightArrowAlt, BiUser } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import courseService from '../../services/courseService'
import sessionService from '../../services/sessionService'
import assignmentService from '../../services/assignmentService'
import attendanceService from '../../services/attendanceService'
import { toast } from 'react-toastify'

const Dashboard = () => {
  const { user, isTeacher, isStudent } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    courses: [],
    sessions: [],
    assignments: [],
    attendance: null
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Define promises for concurrent API calls
        let coursesPromise, sessionsPromise, assignmentsPromise, attendancePromise

        // Fetch courses based on role
        if (isTeacher) {
          coursesPromise = courseService.getTeacherCourses()
            .catch(err => {
              console.error('Error fetching teacher courses:', err)
              toast.error('Failed to load your courses')
              return []
            })
        } else {
          coursesPromise = courseService.getEnrolledCourses()
            .catch(err => {
              console.error('Error fetching enrolled courses:', err)
              toast.error('Failed to load your courses')
              return []
            })
        }
        
        // Fetch upcoming sessions
        sessionsPromise = sessionService.getUpcomingSessions()
          .catch(err => {
            console.error('Error fetching upcoming sessions:', err)
            return []
          })
        
        // Fetch assignments based on role
        if (isTeacher) {
          assignmentsPromise = assignmentService.getTeacherAssignments()
            .catch(err => {
              console.error('Error fetching teacher assignments:', err)
              return []
            })
        } else {
          assignmentsPromise = assignmentService.getStudentAssignments()
            .catch(err => {
              console.error('Error fetching student assignments:', err)
              return []
            })
        }
        
        // Fetch attendance if student
        if (isStudent) {
          attendancePromise = attendanceService.getStudentAttendance()
            .catch(err => {
              console.error('Error fetching student attendance:', err)
              return null
            })
        } else {
          attendancePromise = Promise.resolve(null)
        }
        
        // Wait for all promises to resolve
        const [courses, sessions, assignments, attendance] = await Promise.all([
          coursesPromise,
          sessionsPromise,
          assignmentsPromise,
          attendancePromise
        ])
        
        setStats({
          courses: Array.isArray(courses) ? courses : [],
          sessions: Array.isArray(sessions) ? sessions : [],
          assignments: Array.isArray(assignments) ? assignments : [],
          attendance
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data. Please try again later.')
        toast.error('Error loading dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [isTeacher, isStudent])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <div className="text-red-500 mb-4 text-lg">
          {error}
        </div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Animated Header Section */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 bg-size-200 animate-gradient-x"></div>
        
        {/* Animated shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white rounded-full mix-blend-overlay animate-float"></div>
          <div className="absolute top-10 right-10 w-16 h-16 bg-secondary-300 rounded-full mix-blend-overlay animate-float-delay"></div>
          <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-primary-300 rounded-full mix-blend-overlay animate-float-slow"></div>
          <div className="absolute -bottom-8 right-1/3 w-28 h-28 bg-white rounded-full mix-blend-overlay animate-float-reverse"></div>
        </div>
        
        <div className="relative z-10 p-8 md:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white animate-fade-in-up">{user?.name ? `Welcome back, ${user.name}` : 'Welcome to Your Dashboard'}</h1>
              <p className="mt-2 text-white/90 text-lg max-w-xl animate-fade-in-up animation-delay-150">
                {isTeacher 
                  ? 'Your virtual classroom is ready. Manage courses, sessions, and track student progress.'
                  : 'Your learning journey continues. Track your courses, assignments, and monitor your progress.'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4 animate-fade-in-up animation-delay-300">
              <div className="hidden md:block p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer">
                <span className="text-white text-sm font-medium">Today's Date:</span>
                <p className="text-white/90 font-bold">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer">
                <span className="text-white text-sm font-medium">{isTeacher ? 'Teaching' : 'Enrolled In'}</span>
                <p className="text-white/90 font-bold">{stats.courses.length} Courses</p>
              </div>
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up animation-delay-450">
            <Button 
              to="/courses" 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-none shadow-md"
              icon={<BiBook className="h-5 w-5" />}
            >
              {isTeacher ? 'Manage Courses' : 'My Courses'}
            </Button>
            <Button 
              to="/sessions" 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-none shadow-md"
              icon={<BiVideo className="h-5 w-5" />}
            >
              Sessions
            </Button>
            <Button 
              to="/attendance" 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-none shadow-md"
              icon={<BiCalendarCheck className="h-5 w-5" />}
            >
              Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Courses card */}
        <Card hover variant="glass" className="overflow-visible">
          <div className="relative p-6">
            <div className="absolute -top-5 -left-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 shadow-lg">
              <BiBook className="h-6 w-6 text-white" />
            </div>
            <div className="ml-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Courses</h3>
              <p className="mt-1 text-3xl font-bold text-primary-600 dark:text-primary-400">
                {stats.courses.length}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isTeacher ? 'Courses you teach' : 'Enrolled courses'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 dark:bg-gray-700/50">
            <Button
              to="/courses"
              variant="ghost"
              size="sm"
              fullWidth
            >
              View all courses
            </Button>
          </div>
        </Card>

        {/* Sessions card */}
        <Card hover variant="glass" className="overflow-visible">
          <div className="relative p-6">
            <div className="absolute -top-5 -left-1 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-500 shadow-lg">
              <BiVideo className="h-6 w-6 text-white" />
            </div>
            <div className="ml-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sessions</h3>
              <p className="mt-1 text-3xl font-bold text-secondary-600 dark:text-secondary-400">
                {stats.sessions.length}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upcoming sessions
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 dark:bg-gray-700/50">
            <Button
              to="/sessions"
              variant="ghost"
              size="sm"
              fullWidth
            >
              View all sessions
            </Button>
          </div>
        </Card>

        {/* Assignments card */}
        <Card hover variant="glass" className="overflow-visible">
          <div className="relative p-6">
            <div className="absolute -top-5 -left-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <BiTask className="h-6 w-6 text-white" />
            </div>
            <div className="ml-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assignments</h3>
              <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.assignments.length}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isTeacher ? 'Created assignments' : 'Pending assignments'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 dark:bg-gray-700/50">
            <Button
              to="/assignments"
              variant="ghost"
              size="sm"
              fullWidth
            >
              View all assignments
            </Button>
          </div>
        </Card>

        {/* Attendance card */}
        <Card hover variant="glass" className="overflow-visible">
          <div className="relative p-6">
            <div className="absolute -top-5 -left-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 shadow-lg">
              <BiCalendarCheck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance</h3>
              {isStudent && stats.attendance ? (
                <>
                  <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(stats.attendance.percentage || 0)}%
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Overall attendance rate
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    --
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Attendance records
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 dark:bg-gray-700/50">
            <Button
              to="/attendance"
              variant="ghost"
              size="sm"
              fullWidth
            >
              View attendance
            </Button>
          </div>
        </Card>
      </div>

      {/* Upcoming sessions section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Upcoming Sessions</h2>
          <Button to="/sessions" variant="outline" size="sm">
            View all
          </Button>
        </div>

        {stats.sessions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No upcoming sessions found.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(stats.sessions) && stats.sessions.slice(0, 3).map((session, index) => (
              <Card 
                key={session._id} 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-0 animate-fade-in-up" 
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Session time indicator */}
                <div className="relative">
                  {/* Gradient background with pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 to-secondary-400 opacity-90"></div>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoLTR2LTJoNHYtNGgydjRoNHYyaC00djR6TTAgMGg0djRIMFYwem0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00ek0xMiAwaDF2NGgtNFYwaC0xeiIvPjwvZz48L3N2Zz4=')]"></div>
                  
                  {/* Time indicator */}
                  <div className="relative z-10 flex items-center justify-between p-4 text-white">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center mt-1 space-x-2">
                        <BiVideo className="h-5 w-5 text-white" />
                        <span className="font-bold">
                          {new Date(session.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Session content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors duration-300 line-clamp-1 mb-2">
                    {session.title}
                  </h3>
                  
                  {/* Course info if available */}
                  {session.course && (
                    <div className="flex items-center mb-3">
                      <BiBook className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {typeof session.course === 'object' ? session.course.title || session.course.name : 'Course Session'}
                      </span>
                    </div>
                  )}
                  
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {session.description || 'No description available.'}
                  </p>
                  
                  {/* Duration */}
                  {session.startTime && session.endTime && (
                    <div className="flex items-center mb-4 text-xs text-gray-500 dark:text-gray-400">
                      <BiTime className="h-4 w-4 mr-1.5" />
                      <span>
                        Duration: {Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60))} mins
                      </span>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.startTime) > new Date() ? 
                        `Starts in ${Math.round((new Date(session.startTime) - new Date()) / (1000 * 60 * 60))} hours` : 
                        'In progress'}
                    </span>
                    <Link
                      to={`/sessions/${session._id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800/30 dark:text-secondary-400 dark:hover:bg-secondary-800/50 transition-colors group-hover:scale-105 transform duration-200"
                    >
                      Join Session
                      <BiRightArrowAlt className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent courses section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isTeacher ? 'Your Courses' : 'Enrolled Courses'}
          </h2>
          <Button to="/courses" variant="outline" size="sm">
            View all
          </Button>
        </div>

        {stats.courses.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {isTeacher 
                ? 'You have not created any courses yet.'
                : 'You are not enrolled in any courses yet.'
              }
            </p>
            {isTeacher && (
              <Button to="/courses" variant="primary" className="mt-4">
                Create a course
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(stats.courses) && stats.courses.slice(0, 3).map((course, index) => (
              <Card 
                key={course._id} 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-0 animate-fade-in-up" 
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative h-44 overflow-hidden">
                  {/* Background layer with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"></div>
                  
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMEMxMy40IDAgMCAxMy40IDAgMzBzMTMuNCAzMCAzMCAzMCAzMC0xMy40IDMwLTMwUzQ2LjYgMCAzMCAwem0wIDUyYy0xMi4yIDAtMjItOS44LTIyLTIyczkuOC0yMiAyMi0yMiAyMiA5LjggMjIgMjItOS44IDIyLTIyIDIyeiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjwvc3ZnPg==')]"></div>
                  
                  {/* Course image if available */}
                  {course.coverImage && (
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={`http://localhost:5000${course.coverImage}`} 
                        alt={course.title || course.name} 
                        className="w-full h-full object-cover opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                      />
                    </div>
                  )}
                  
                  {/* Course badge/indicators */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <BiUser className="h-3.5 w-3.5 text-white mr-1" />
                      <span className="text-xs font-medium text-white">
                        {course.studentsCount || course.enrollmentCount || '0'} Students
                      </span>
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="transform transition-transform duration-300 group-hover:translate-y-[-5px]">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {course.title || course.name}
                      </h3>
                      {course.code && (
                        <div className="inline-flex items-center bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white">
                          {course.code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  {/* Teacher info if available */}
                  {course.teacher && (
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-2">
                        {course.teacher.profilePicture ? (
                          <img 
                            src={`http://localhost:5000${course.teacher.profilePicture}`} 
                            alt={course.teacher.name}
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <span className="font-bold text-sm">
                            {course.teacher.name ? course.teacher.name.charAt(0).toUpperCase() : 'T'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Instructor</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{course.teacher.name || 'Instructor'}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Description */}
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {course.description || 'No description available.'}
                  </p>
                  
                  {/* Subject and dates */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {course.subject && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <BiBook className="h-4 w-4 mr-1.5" />
                        <span>{course.subject}</span>
                      </div>
                    )}
                    {course.startDate && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <BiCalendarCheck className="h-4 w-4 mr-1.5" />
                        <span>{new Date(course.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action link */}
                  <div className="flex justify-end mt-2">
                    <Link
                      to={`/courses/${course._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-800/50 transition-all group-hover:scale-105 transform duration-200"
                    >
                      View Course
                      <BiRightArrowAlt className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 