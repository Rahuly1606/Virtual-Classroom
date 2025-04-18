import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  BiEdit, 
  BiTrash, 
  BiPlus, 
  BiVideo, 
  BiTask, 
  BiCalendarCheck, 
  BiUserPlus, 
  BiArrowBack 
} from 'react-icons/bi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import courseService from '../../services/courseService'
import sessionService from '../../services/sessionService'
import assignmentService from '../../services/assignmentService'
import { toast } from 'react-toastify'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isTeacher } = useAuth()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true)
        
        // Fetch course details
        const courseData = await courseService.getCourseById(id)
        setCourse(courseData)
        
        // Fetch course sessions
        const sessionsData = await sessionService.getSessionsByCourse(id)
        setSessions(sessionsData)
        
        // Fetch course assignments
        const assignmentsData = await assignmentService.getAssignmentsByCourse(id)
        setAssignments(assignmentsData)
      } catch (error) {
        console.error('Error fetching course data:', error)
        toast.error('Failed to load course details')
        navigate('/courses')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [id, navigate])
  
  // Handle course deletion
  const handleDeleteCourse = async () => {
    try {
      setLoading(true)
      await courseService.deleteCourse(id)
      toast.success('Course deleted successfully')
      navigate('/courses')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
      setLoading(false)
    }
  }
  
  // Handle course unenrollment
  const handleUnenroll = async () => {
    try {
      setLoading(true)
      await courseService.unenrollFromCourse(id)
      toast.success('Unenrolled from course successfully')
      navigate('/courses')
    } catch (error) {
      console.error('Error unenrolling from course:', error)
      toast.error('Failed to unenroll from course')
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
  
  if (!course) {
    return (
      <div className="text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Course not found.
        </p>
        <Button to="/courses" variant="primary" className="mt-4">
          Back to Courses
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Navigation and actions bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            to="/courses" 
            variant="ghost" 
            size="sm"
            icon={<BiArrowBack className="h-5 w-5" />}
          >
            Back to Courses
          </Button>
        </div>
        
        {isTeacher ? (
          <div className="flex items-center gap-2">
            <Button 
              to={`/courses/${id}/edit`} 
              variant="outline" 
              icon={<BiEdit className="h-5 w-5" />}
            >
              Edit Course
            </Button>
            {!deleteConfirm ? (
              <Button 
                variant="danger" 
                icon={<BiTrash className="h-5 w-5" />}
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : (
              <>
                <Button 
                  variant="danger" 
                  onClick={handleDeleteCourse}
                >
                  Confirm Delete
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        ) : (
          <Button 
            variant="danger" 
            icon={<BiTrash className="h-5 w-5" />}
            onClick={handleUnenroll}
          >
            Unenroll
          </Button>
        )}
      </div>
      
      {/* Course header */}
      <div className="rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">{course.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
          <span>Code: {course.code}</span>
          {course.instructor && (
            <span>Instructor: {course.instructor.name}</span>
          )}
          <span>Students: {course.studentsCount || 0}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'overview'
                  ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'sessions'
                  ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'assignments'
                  ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('assignments')}
            >
              Assignments
            </button>
          </li>
          {isTeacher && (
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'students'
                    ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('students')}
              >
                Students
              </button>
            </li>
          )}
        </ul>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <Card.Body>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Course Description</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {course.description || 'No description available.'}
                </p>
              </Card.Body>
            </Card>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Sessions summary */}
              <Card hover className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sessions</h3>
                    <BiVideo className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{sessions.length}</p>
                </div>
                <div className="p-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    fullWidth
                    onClick={() => setActiveTab('sessions')}
                  >
                    View Sessions
                  </Button>
                </div>
              </Card>
              
              {/* Assignments summary */}
              <Card hover className="overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Assignments</h3>
                    <BiTask className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{assignments.length}</p>
                </div>
                <div className="p-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    fullWidth
                    onClick={() => setActiveTab('assignments')}
                  >
                    View Assignments
                  </Button>
                </div>
              </Card>
              
              {/* Students summary */}
              <Card hover className="overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Students</h3>
                    <BiUserPlus className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{course.studentsCount || 0}</p>
                </div>
                <div className="p-4">
                  {isTeacher ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      fullWidth
                      onClick={() => setActiveTab('students')}
                    >
                      Manage Students
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      fullWidth
                      disabled
                    >
                      View Only
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
        
        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sessions</h2>
              {isTeacher && (
                <Button
                  to={`/sessions/create?courseId=${id}`}
                  variant="primary"
                  icon={<BiPlus className="h-5 w-5" />}
                >
                  Create Session
                </Button>
              )}
            </div>
            
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map(session => (
                  <Card key={session._id} hover className="overflow-hidden">
                    <div className="flex flex-wrap lg:flex-nowrap gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-full lg:w-3/4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="w-full lg:w-1/4 flex justify-start lg:justify-end items-center">
                        <Button
                          to={`/sessions/${session._id}`}
                          variant="primary"
                          size="sm"
                        >
                          {new Date(session.startTime) > new Date() ? 'View Details' : 'Join Session'}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        {session.description || 'No description available.'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No sessions have been scheduled for this course yet.
                </p>
                {isTeacher && (
                  <Button
                    to={`/sessions/create?courseId=${id}`}
                    variant="primary"
                    className="mt-4"
                  >
                    Schedule Your First Session
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}
        
        {/* Assignments tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assignments</h2>
              {isTeacher && (
                <Button
                  to={`/assignments/create?courseId=${id}`}
                  variant="primary"
                  icon={<BiPlus className="h-5 w-5" />}
                >
                  Create Assignment
                </Button>
              )}
            </div>
            
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <Card key={assignment._id} hover className="overflow-hidden">
                    <div className="flex flex-wrap lg:flex-nowrap gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-full lg:w-3/4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          {new Date(assignment.dueDate) < new Date() && (
                            <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                              Past Due
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-full lg:w-1/4 flex justify-start lg:justify-end items-center">
                        <Button
                          to={`/assignments/${assignment._id}`}
                          variant="primary"
                          size="sm"
                        >
                          {isTeacher ? 'View Submissions' : 'View & Submit'}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        {assignment.description || 'No description available.'}
                      </p>
                      {assignment.totalPoints && (
                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                          Points: {assignment.totalPoints}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No assignments have been created for this course yet.
                </p>
                {isTeacher && (
                  <Button
                    to={`/assignments/create?courseId=${id}`}
                    variant="primary"
                    className="mt-4"
                  >
                    Create Your First Assignment
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}
        
        {/* Students tab (teacher only) */}
        {isTeacher && activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Enrolled Students</h2>
              <Button
                to={`/attendance?courseId=${id}`}
                variant="outline"
                icon={<BiCalendarCheck className="h-5 w-5" />}
              >
                View Attendance
              </Button>
            </div>
            
            {(course.students && course.students.length > 0) ? (
              <Card>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {course.students.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                              <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                                {student.name[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No students are enrolled in this course yet.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseDetail 