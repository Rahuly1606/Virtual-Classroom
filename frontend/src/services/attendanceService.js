import axiosInstance from './axiosConfig'

// Get attendance for a session (teacher only)
const getSessionAttendance = async (sessionId) => {
  const response = await axiosInstance.get(`/attendance/session/${sessionId}`)
  return response.data
}

// Get student's attendance across all courses/sessions
const getStudentAttendance = async () => {
  const response = await axiosInstance.get('/attendance/student')
  return response.data
}

// Get student's attendance for a specific course
const getStudentCourseAttendance = async (courseId) => {
  const response = await axiosInstance.get(`/attendance/student/course/${courseId}`)
  return response.data
}

// Mark attendance for a session (teacher only)
const markAttendance = async (sessionId, attendanceData) => {
  const response = await axiosInstance.post(`/attendance/${sessionId}`, attendanceData)
  return response.data
}

// Update attendance record (teacher only)
const updateAttendance = async (attendanceId, data) => {
  const response = await axiosInstance.put(`/attendance/${attendanceId}`, data)
  return response.data
}

// Generate attendance report for a course (teacher only)
const getCourseAttendanceReport = async (courseId) => {
  const response = await axiosInstance.get(`/attendance/report/course/${courseId}`)
  return response.data
}

// Get attendance statistics for all students in a course (teacher only)
const getCourseAttendanceStats = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/attendance/stats/course/${courseId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching attendance stats for course ${courseId}:`, error)
    throw error
  }
}

const attendanceService = {
  getSessionAttendance,
  getStudentAttendance,
  getStudentCourseAttendance,
  markAttendance,
  updateAttendance,
  getCourseAttendanceReport,
  getCourseAttendanceStats
}

export default attendanceService 