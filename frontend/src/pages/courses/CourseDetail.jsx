import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  BiEdit, 
  BiTrash, 
  BiPlus, 
  BiVideo, 
  BiTask, 
  BiCalendarCheck, 
  BiUserPlus, 
  BiArrowBack,
  BiSearch
} from 'react-icons/bi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import courseService from '../../services/courseService'
import sessionService from '../../services/sessionService'
import assignmentService from '../../services/assignmentService'
import { toast } from 'react-toastify'
import Input from '../../components/ui/Input'

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
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [yearOptions, setYearOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [availableStudentSearchTerm, setAvailableStudentSearchTerm] = useState('')
  const [availableStudentFilter, setAvailableStudentFilter] = useState('all')
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [availableStudentFilterOptions, setAvailableStudentFilterOptions] = useState({})

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

        // Set student filter options based on enrolled students
        if (courseData.students?.length > 0) {
          // Extract unique sections and years
          const sections = [...new Set(courseData.students
            .map(student => student.section)
            .filter(Boolean))]
          
          const years = [...new Set(courseData.students
            .map(student => student.year)
            .filter(Boolean))]
          
          setSectionOptions(sections)
          setYearOptions(years)
          setFilteredStudents(courseData.students)
        }
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
  
  // Filter students based on search term and filters
  useEffect(() => {
    if (!course?.students) return

    let filtered = [...course.students]
    
    // Apply search filter
    if (studentSearchTerm) {
      const searchLower = studentSearchTerm.toLowerCase()
      filtered = filtered.filter(student => {
        const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`
        return (
          fullName.toLowerCase().includes(searchLower) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
        )
      })
    }
    
    // Apply section/year filter
    if (studentFilter !== 'all') {
      const [filterType, filterValue] = studentFilter.split(':')
      if (filterType === 'section') {
        filtered = filtered.filter(student => student.section === filterValue)
      } else if (filterType === 'year') {
        filtered = filtered.filter(student => student.year === filterValue)
      }
    }
    
    setFilteredStudents(filtered)
  }, [course?.students, studentSearchTerm, studentFilter])

  // Handle fetching available students when modal opens
  useEffect(() => {
    if (showAddStudentModal) {
      const fetchAvailableStudents = async () => {
        try {
          setLoadingAvailableStudents(true)
          
          // Fetch students who are not already enrolled in the course
          const response = await courseService.getAvailableStudents(id)
          setAvailableStudents(response)
          
          // Extract unique sections and years for filtering
          const sections = [...new Set(response
            .map(student => student.section)
            .filter(Boolean))]
          
          const years = [...new Set(response
            .map(student => student.year)
            .filter(Boolean))]
          
          setSectionOptions(prevSections => {
            // Merge with existing options
            return [...new Set([...prevSections, ...sections])]
          })
          
          setYearOptions(prevYears => {
            // Merge with existing options
            return [...new Set([...prevYears, ...years])]
          })
        } catch (error) {
          console.error('Error fetching available students:', error)
          toast.error('Failed to load available students')
        } finally {
          setLoadingAvailableStudents(false)
        }
      }
      
      fetchAvailableStudents()
    }
  }, [id, showAddStudentModal])

  // Filter available students based on search term and filters
  const filteredAvailableStudents = useMemo(() => {
    if (!availableStudents.length) return []
    
    let filtered = [...availableStudents]
    
    // Apply search filter
    if (availableStudentSearchTerm) {
      const searchLower = availableStudentSearchTerm.toLowerCase()
      filtered = filtered.filter(student => {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`
        return (
          fullName.toLowerCase().includes(searchLower) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
        )
      })
    }
    
    // Apply section/year filter
    if (availableStudentFilter !== 'all') {
      const [filterType, filterValue] = availableStudentFilter.split(':')
      if (filterType === 'section') {
        filtered = filtered.filter(student => student.section === filterValue)
      } else if (filterType === 'year') {
        filtered = filtered.filter(student => student.year === filterValue)
      }
    }
    
    return filtered
  }, [availableStudents, availableStudentSearchTerm, availableStudentFilter])

  // Handle adding a student to the course
  const handleAddStudent = async (studentId) => {
    try {
      await courseService.addStudentToCourse(id, studentId)
      
      // Remove from available students list
      setAvailableStudents(prev => prev.filter(s => s._id !== studentId))
      
      // Add to enrolled students list
      const addedStudent = availableStudents.find(s => s._id === studentId)
      if (addedStudent) {
        setCourse(prev => ({
          ...prev,
          students: [...(prev.students || []), addedStudent]
        }))
      }
      
      toast.success('Student added to course successfully')
    } catch (error) {
      console.error('Error adding student to course:', error)
      toast.error('Failed to add student to course')
    }
  }

  // Handle removing a student from the course
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) {
      return
    }
    
    try {
      await courseService.removeStudentFromCourse(id, studentId)
      
      // Remove from enrolled students list
      setCourse(prev => ({
        ...prev,
        students: prev.students.filter(s => s._id !== studentId)
      }))
      
      toast.success('Student removed from course successfully')
    } catch (error) {
      console.error('Error removing student from course:', error)
      toast.error('Failed to remove student from course')
    }
  }
  
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
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
          <span>Subject: {course.subject}</span>
          {course.teacher && (
            <span>Instructor: {course.teacher.name || 'N/A'}</span>
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
            {isTeacher && (
              <div className="flex justify-end">
                <Button 
                  to={`/sessions/create?courseId=${id}`}
                  variant="primary" 
                  icon={<BiPlus className="h-5 w-5" />}
                >
                  Schedule New Session
                </Button>
              </div>
            )}
            
            {sessions.length === 0 ? (
              <Card>
                <Card.Body className="py-6">
                  <div className="text-center">
                    <BiVideo className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Sessions</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isTeacher
                        ? 'Get started by scheduling your first session for this course.'
                        : 'No sessions have been scheduled for this course yet.'}
                    </p>
                    {isTeacher && (
                      <div className="mt-6">
                        <Button 
                          to={`/sessions/create?courseId=${id}`}
                          variant="primary" 
                          icon={<BiPlus className="h-5 w-5" />}
                        >
                          Schedule Session
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Upcoming sessions */}
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    Upcoming Sessions
                  </h3>
                  <div className="space-y-3">
                    {sessions
                      .filter(session => new Date(session.startTime) > new Date())
                      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                      .map(session => (
                        <Card key={session._id} className="hover:shadow-md transition-shadow duration-200">
                          <Link to={`/sessions/${session._id}`} className="block">
                            <Card.Body className="flex flex-col md:flex-row md:items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {session.title}
                                </h4>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>
                                    {new Date(session.startTime).toLocaleDateString()} | {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 md:mt-0 flex space-x-2">
                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Upcoming
                                </span>
                                {isTeacher && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      to={`/sessions/edit/${session._id}`}
                                      variant="ghost" 
                                      size="sm"
                                      icon={<BiEdit className="h-4 w-4" />}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Card.Body>
                          </Link>
                        </Card>
                      ))}
                    {sessions.filter(session => new Date(session.startTime) > new Date()).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming sessions scheduled.</p>
                    )}
                  </div>
                </div>
                
                {/* Past sessions */}
                <div className="mt-6">
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    Past Sessions
                  </h3>
                  <div className="space-y-3">
                    {sessions
                      .filter(session => new Date(session.startTime) <= new Date())
                      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                      .map(session => (
                        <Card key={session._id} className="hover:shadow-md transition-shadow duration-200">
                          <Link to={`/sessions/${session._id}`} className="block">
                            <Card.Body className="flex flex-col md:flex-row md:items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {session.title}
                                </h4>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>
                                    {new Date(session.startTime).toLocaleDateString()} | {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 md:mt-0 flex space-x-2">
                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  Completed
                                </span>
                              </div>
                            </Card.Body>
                          </Link>
                        </Card>
                      ))}
                    {sessions.filter(session => new Date(session.startTime) <= new Date()).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No past sessions.</p>
                    )}
                  </div>
                </div>
              </div>
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
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  icon={<BiUserPlus className="h-5 w-5" />}
                  onClick={() => setShowAddStudentModal(true)}
                >
                  Add Students
                </Button>
                <Button
                  to={`/attendance/stats/${id}`}
                  variant="outline"
                  icon={<BiCalendarCheck className="h-5 w-5" />}
                >
                  View Attendance
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <Input
                id="studentSearch"
                type="text"
                placeholder="Search students..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="max-w-md"
                icon={<BiSearch className="h-5 w-5 text-gray-400" />}
              />
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant={studentFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStudentFilter('all')}
              >
                All
              </Button>
              {sectionOptions.map(section => (
                <Button
                  key={section}
                  variant={studentFilter === `section:${section}` ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStudentFilter(`section:${section}`)}
                >
                  Section {section}
                </Button>
              ))}
              {yearOptions.map(year => (
                <Button
                  key={year}
                  variant={studentFilter === `year:${year}` ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStudentFilter(`year:${year}`)}
                >
                  Year {year}
                </Button>
              ))}
            </div>
            
            {(course.students && filteredStudents.length > 0) ? (
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
                        Section
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                              <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                                {student.name?.[0] || student.firstName?.[0] || 'S'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name || `${student.firstName} ${student.lastName}` || 'Unknown Student'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.section || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.year || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveStudent(student._id)}
                          >
                            Remove
                          </Button>
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
            
            {/* Add Student Modal */}
            {showAddStudentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => setShowAddStudentModal(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Students</h3>
                  
                  <div className="space-y-4">
                    <Input
                      id="studentSearchModal"
                      type="text"
                      placeholder="Search students by name or email..."
                      value={availableStudentSearchTerm}
                      onChange={(e) => setAvailableStudentSearchTerm(e.target.value)}
                      className="w-full"
                    />
                    
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        variant={availableStudentFilter === 'all' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setAvailableStudentFilter('all')}
                      >
                        All
                      </Button>
                      {sectionOptions.map(section => (
                        <Button
                          key={section}
                          variant={availableStudentFilter === `section:${section}` ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setAvailableStudentFilter(`section:${section}`)}
                        >
                          Section {section}
                        </Button>
                      ))}
                      {yearOptions.map(year => (
                        <Button
                          key={year}
                          variant={availableStudentFilter === `year:${year}` ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setAvailableStudentFilter(`year:${year}`)}
                        >
                          Year {year}
                        </Button>
                      ))}
                    </div>
                    
                    {loadingAvailableStudents ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner size="md" />
                      </div>
                    ) : filteredAvailableStudents.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {filteredAvailableStudents.map(student => (
                          <div 
                            key={student._id} 
                            className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                                <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                                  {student.firstName?.[0] || 'S'}
                                </span>
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.email} • Section: {student.section || 'N/A'} • Year: {student.year || 'N/A'}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddStudent(student._id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                        No students found.
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="ghost"
                        onClick={() => setShowAddStudentModal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseDetail 