import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BiBook, BiVideo, BiTask, BiCalendarCheck, BiChart } from 'react-icons/bi'
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
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 shadow-lg text-white">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
        <p className="mt-2 text-white/80">
          {isTeacher 
            ? 'Manage your courses, sessions, and assignments' 
            : 'Track your courses, sessions, and assignments'
          }
        </p>
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
            {Array.isArray(stats.sessions) && stats.sessions.slice(0, 3).map((session) => (
              <Card key={session._id} hover className="overflow-hidden">
                <div className="bg-gray-100 p-4 dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(session.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {session.description || 'No description available.'}
                  </p>
                  <Link
                    to={`/sessions/${session._id}`}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    View details
                  </Link>
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
            {Array.isArray(stats.courses) && stats.courses.slice(0, 3).map((course) => (
              <Card key={course._id} hover className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400 p-4 text-white">
                  <h3 className="text-xl font-bold">{course.name}</h3>
                  <p className="mt-1 text-sm opacity-80">{course.code}</p>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {course.description || 'No description available.'}
                  </p>
                  <Link
                    to={`/courses/${course._id}`}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    View course
                  </Link>
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