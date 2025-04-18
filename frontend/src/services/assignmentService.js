import axiosInstance from './axiosConfig'

// Get all assignments for a course
const getAssignmentsByCourse = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/assignments/course/${courseId}`)
    return response.data.data || []
  } catch (error) {
    console.error(`Error fetching assignments for course ${courseId}:`, error)
    throw error
  }
}

// Get a single assignment by ID
const getAssignmentById = async (assignmentId) => {
  try {
    const response = await axiosInstance.get(`/assignments/${assignmentId}`)
    return response.data.data
  } catch (error) {
    console.error(`Error fetching assignment ${assignmentId}:`, error)
    throw error
  }
}

// Get assignments for the logged-in student
const getStudentAssignments = async () => {
  try {
    const response = await axiosInstance.get('/assignments/student')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    throw error
  }
}

// Get assignments created by the logged-in teacher
const getTeacherAssignments = async () => {
  try {
    const response = await axiosInstance.get('/assignments/teacher')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching teacher assignments:', error)
    throw error
  }
}

// Create a new assignment (teacher only)
const createAssignment = async (assignmentData) => {
  try {
    const formData = new FormData()
    
    // Add text fields
    Object.keys(assignmentData).forEach(key => {
      if (key !== 'files' && assignmentData[key] !== undefined) {
        formData.append(key, assignmentData[key])
      }
    })
    
    // Add files if present
    if (assignmentData.files && assignmentData.files.length > 0) {
      for (let i = 0; i < assignmentData.files.length; i++) {
        formData.append('files', assignmentData.files[i])
      }
    }
    
    const response = await axiosInstance.post('/assignments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  } catch (error) {
    console.error('Error creating assignment:', error)
    throw error
  }
}

// Update an assignment (teacher only)
const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    const formData = new FormData()
    
    // Add text fields
    Object.keys(assignmentData).forEach(key => {
      if (key !== 'files' && assignmentData[key] !== undefined) {
        formData.append(key, assignmentData[key])
      }
    })
    
    // Add files if present
    if (assignmentData.files && assignmentData.files.length > 0) {
      for (let i = 0; i < assignmentData.files.length; i++) {
        formData.append('files', assignmentData.files[i])
      }
    }
    
    const response = await axiosInstance.put(`/assignments/${assignmentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  } catch (error) {
    console.error(`Error updating assignment ${assignmentId}:`, error)
    throw error
  }
}

// Delete an assignment (teacher only)
const deleteAssignment = async (assignmentId) => {
  try {
    const response = await axiosInstance.delete(`/assignments/${assignmentId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting assignment ${assignmentId}:`, error)
    throw error
  }
}

// Submit an assignment (student only)
const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const formData = new FormData()
    
    // Add text fields
    if (submissionData.comment) {
      formData.append('comment', submissionData.comment)
    }
    
    // Add files if present
    if (submissionData.files && submissionData.files.length > 0) {
      for (let i = 0; i < submissionData.files.length; i++) {
        formData.append('files', submissionData.files[i])
      }
    }
    
    const response = await axiosInstance.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  } catch (error) {
    console.error(`Error submitting assignment ${assignmentId}:`, error)
    throw error
  }
}

// Get submissions for an assignment (teacher only)
const getSubmissions = async (assignmentId) => {
  try {
    const response = await axiosInstance.get(`/assignments/${assignmentId}/submissions`)
    return response.data.data || []
  } catch (error) {
    console.error(`Error fetching submissions for assignment ${assignmentId}:`, error)
    throw error
  }
}

// Grade a submission (teacher only)
const gradeSubmission = async (submissionId, gradeData) => {
  try {
    const response = await axiosInstance.post(`/assignments/submissions/${submissionId}/grade`, gradeData)
    return response.data.data
  } catch (error) {
    console.error(`Error grading submission ${submissionId}:`, error)
    throw error
  }
}

const assignmentService = {
  getAssignmentsByCourse,
  getAssignmentById,
  getStudentAssignments,
  getTeacherAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
}

export default assignmentService 