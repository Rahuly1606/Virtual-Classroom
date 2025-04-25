import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BiCalendarCheck, BiCheckCircle, BiXCircle, BiTimeFive, BiInfoCircle } from 'react-icons/bi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import attendanceService from '../../services/attendanceService'
import courseService from '../../services/courseService'
import { toast } from 'react-toastify'

const AttendancePage = () => {
  const { user, isStudent, isTeacher } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attendanceData, setAttendanceData] = useState({
    courseStats: [],
    recentAttendance: []
  })
  const [teacherCourses, setTeacherCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseAttendance, setCourseAttendance] = useState(null)
  const [courseAttendanceLoading, setCourseAttendanceLoading] = useState(false)

  // Fetch data based on user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        if (isStudent) {
          const response = await attendanceService.getStudentAttendance()
          setAttendanceData(response.data || { courseStats: [], recentAttendance: [] })
        } else if (isTeacher) {
          // For teachers, fetch their courses
          const courses = await courseService.getTeacherCourses()
          setTeacherCourses(courses)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data. Please try again later.')
        toast.error('Error loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isStudent, isTeacher])

  // Fetch course-specific attendance when a course is selected
  useEffect(() => {
    const fetchCourseAttendance = async () => {
      if (!selectedCourse) return

      try {
        setCourseAttendanceLoading(true)
        const response = await attendanceService.getStudentCourseAttendance(selectedCourse)
        setCourseAttendance(response.data || { sessions: [] })
      } catch (error) {
        console.error(`Error fetching attendance for course ${selectedCourse}:`, error)
        toast.error('Error loading course attendance data')
      } finally {
        setCourseAttendanceLoading(false)
      }
    }

    if (selectedCourse && isStudent) {
      fetchCourseAttendance()
    } else {
      setCourseAttendance(null)
    }
  }, [selectedCourse, isStudent])

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId === selectedCourse ? null : courseId)
  }

  // Get status icon based on attendance status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <BiCheckCircle className="text-green-500 h-5 w-5" />
      case 'absent':
        return <BiXCircle className="text-red-500 h-5 w-5" />
      case 'late':
        return <BiTimeFive className="text-yellow-500 h-5 w-5" />
      case 'excused':
        return <BiInfoCircle className="text-blue-500 h-5 w-5" />
      default:
        return null
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get badge color based on percentage
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Render teacher view
  if (isTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Attendance Dashboard</h1>
        </div>
        
        <Card className="p-6">
          <div className="text-center py-6">
            <BiCalendarCheck className="mx-auto h-12 w-12 text-primary-500" />
            <h2 className="mt-4 text-xl font-semibold">Course Attendance Statistics</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please select a course to view detailed attendance statistics for all students.
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherCourses.length > 0 ? (
                teacherCourses.map(course => (
                  <Card key={course._id} hover className="overflow-hidden">
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {course.studentsCount || 0} students enrolled
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t dark:border-gray-700">
                      <Button
                        to={`/attendance/stats/${course._id}`}
                        variant="primary"
                        fullWidth
                      >
                        View Attendance Stats
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center p-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    You don't have any courses yet.
                  </p>
                  <Button
                    to="/courses/create"
                    variant="primary"
                    className="mt-4"
                  >
                    Create a Course
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
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

  // Student view remains the same
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Records</h1>
      </div>

      {/* Overall attendance summary */}
      <Card className="p-6">
        <div className="mb-4 border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Overall Attendance Summary</h2>
          
          {attendanceData.courseStats?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No attendance records found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendanceData.courseStats?.map((course) => (
                <div
                  key={course.courseId}
                  className={`cursor-pointer border p-4 rounded-lg hover:shadow-md transition-shadow ${
                    selectedCourse === course.courseId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handleCourseSelect(course.courseId)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-1">{course.courseName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Code: {course.courseCode}
                      </p>
                    </div>
                    <div className={`${getPercentageColor(course.attendancePercentage)} text-white text-sm font-bold px-2.5 py-1 rounded-full`}>
                      {Math.round(course.attendancePercentage)}%
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <BiCalendarCheck className="mr-1 h-4 w-4 text-gray-400" />
                      <span>Total: {course.totalSessions}</span>
                    </div>
                    <div className="flex items-center">
                      <BiCheckCircle className="mr-1 h-4 w-4 text-green-500" />
                      <span>Present: {course.present}</span>
                    </div>
                    <div className="flex items-center">
                      <BiXCircle className="mr-1 h-4 w-4 text-red-500" />
                      <span>Absent: {course.absent}</span>
                    </div>
                    <div className="flex items-center">
                      <BiTimeFive className="mr-1 h-4 w-4 text-yellow-500" />
                      <span>Late: {course.late}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course-specific attendance details */}
        {selectedCourse && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              {attendanceData.courseStats?.find(c => c.courseId === selectedCourse)?.courseName} - Detailed Attendance
            </h2>
            
            {courseAttendanceLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <>
                {!courseAttendance || courseAttendance.sessions?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No detailed attendance records found for this course.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <th className="px-4 py-2 text-left">Session</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseAttendance.sessions?.map((session) => (
                          <tr key={session._id} className="border-b dark:border-gray-700">
                            <td className="px-4 py-3">{session.title}</td>
                            <td className="px-4 py-3">{formatDate(session.startTime)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {getStatusIcon(session.status)}
                                <span className="ml-2 capitalize">{session.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{session.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Recent attendance records */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Attendance</h2>
          
          {attendanceData.recentAttendance?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No recent attendance records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left">Course</th>
                    <th className="px-4 py-2 text-left">Session</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.recentAttendance?.map((record) => (
                    <tr key={record._id} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3">{record.session.course.title}</td>
                      <td className="px-4 py-3">{record.session.title}</td>
                      <td className="px-4 py-3">{formatDate(record.session.startTime)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className="ml-2 capitalize">{record.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AttendancePage 