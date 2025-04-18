import axiosInstance from './axiosConfig'

// Get all courses
const getCourses = async () => {
  try {
    const response = await axiosInstance.get('/courses')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

// Get a single course by ID
const getCourseById = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/courses/${courseId}`)
    return response.data.data || null
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error)
    throw error
  }
}

// Get courses for the logged-in student
const getEnrolledCourses = async () => {
  try {
    const response = await axiosInstance.get('/courses/enrolled')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching enrolled courses:', error)
    throw error
  }
}

// Get courses created by the logged-in teacher
const getTeacherCourses = async () => {
  try {
    console.log('Calling getTeacherCourses API...')
    const response = await axiosInstance.get('/courses/teaching')
    console.log('Teaching courses API response:', response.data)
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching teacher courses:', error)
    console.error('Error details:', error.response?.data || 'No response data')
    throw error
  }
}

// Create a new course (teacher only)
const createCourse = async (courseData) => {
  try {
    // Check if courseData is already a FormData object
    const isFormData = courseData instanceof FormData
    
    let formDataToSend
    if (isFormData) {
      formDataToSend = courseData
    } else {
      // Convert plain object to FormData
      formDataToSend = new FormData()
      Object.keys(courseData).forEach(key => {
        if (courseData[key] !== undefined && courseData[key] !== null) {
          formDataToSend.append(key, courseData[key])
        }
      })
    }
    
    const response = await axiosInstance.post('/courses', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.data
  } catch (error) {
    console.error('Error creating course:', error)
    throw error
  }
}

// Update a course (teacher only)
const updateCourse = async (courseId, courseData) => {
  try {
    // Check if courseData is already a FormData object
    const isFormData = courseData instanceof FormData
    
    let formDataToSend
    if (isFormData) {
      formDataToSend = courseData
    } else {
      // Convert plain object to FormData
      formDataToSend = new FormData()
      Object.keys(courseData).forEach(key => {
        if (courseData[key] !== undefined && courseData[key] !== null) {
          formDataToSend.append(key, courseData[key])
        }
      })
    }
    
    const response = await axiosInstance.put(`/courses/${courseId}`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.data
  } catch (error) {
    console.error(`Error updating course ${courseId}:`, error)
    throw error
  }
}

// Delete a course (teacher only)
const deleteCourse = async (courseId) => {
  try {
    const response = await axiosInstance.delete(`/courses/${courseId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error)
    throw error
  }
}

// Enroll in a course (student only)
const enrollInCourse = async (courseId) => {
  try {
    const response = await axiosInstance.post(`/courses/${courseId}/enroll`)
    return response.data.data
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error)
    throw error
  }
}

// Unenroll from a course (student only)
const unenrollFromCourse = async (courseId) => {
  try {
    const response = await axiosInstance.delete(`/courses/${courseId}/enroll`)
    return response.data
  } catch (error) {
    console.error(`Error unenrolling from course ${courseId}:`, error)
    throw error
  }
}

const courseService = {
  getCourses,
  getCourseById,
  getEnrolledCourses,
  getTeacherCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse
}

export default courseService 