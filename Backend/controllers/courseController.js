import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private/Teacher
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, subject, startDate, endDate } = req.body;

    // Set teacher to the logged-in user
    const teacher = req.user._id;

    // Handle cover image if uploaded
    let coverImage = '';
    if (req.file) {
      coverImage = `/uploads/courses/${req.file.filename}`;
    }

    const course = await Course.create({
      title,
      description,
      teacher,
      subject,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      coverImage,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all courses (with filters)
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = async (req, res, next) => {
  try {
    const filter = {};

    // Filter by teacher if specified
    if (req.query.teacher) {
      filter.teacher = req.query.teacher;
    }

    // Filter by subject if specified
    if (req.query.subject) {
      filter.subject = { $regex: req.query.subject, $options: 'i' };
    }

    // Search by title or description
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Get courses with populated teacher info
    const courses = await Course.find(filter)
      .populate('teacher', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses taught by the logged-in teacher
 * @route   GET /api/courses/my-courses
 * @access  Private/Teacher
 */
export const getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses in which the logged-in student is enrolled
 * @route   GET /api/courses/enrolled
 * @access  Private/Student
 */
export const getEnrolledCourses = async (req, res, next) => {
  try {
    // Find all enrollments for the student
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' });

    // Extract course IDs from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.course);

    // Find all courses with these IDs
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('teacher', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single course by ID
 * @route   GET /api/courses/:id
 * @access  Private
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email profilePicture bio');

    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Get enrollment count
    const enrollmentCount = await Enrollment.countDocuments({ course: course._id, status: 'active' });

    // Find all students enrolled in this course
    const enrollments = await Enrollment.find({
      course: course._id,
      status: 'active',
    }).populate('student', 'name email profilePicture firstName lastName section year');

    // Extract student info
    const students = enrollments.map(enrollment => enrollment.student);

    // Check if the requesting user is enrolled (if student)
    let isEnrolled = false;
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ 
        course: course._id, 
        student: req.user._id,
        status: 'active'
      });
      isEnrolled = !!enrollment;
    }

    // Check if the requesting user is the teacher of this course
    const isTeacher = req.user.role === 'teacher' && 
      course.teacher._id.toString() === req.user._id.toString();

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        enrollmentCount,
        students,
        studentsCount: students.length,
        isEnrolled,
        isTeacher
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private/Teacher
 */
export const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to update this course', 403);
    }

    // Handle cover image if uploaded
    if (req.file) {
      req.body.coverImage = `/uploads/courses/${req.file.filename}`;
    }

    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private/Teacher
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to delete this course', 403);
    }

    // Delete the course
    await course.deleteOne();

    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private/Student
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      course: course._id,
      student: req.user._id,
    });

    if (existingEnrollment) {
      // If dropped, reactivate
      if (existingEnrollment.status === 'dropped') {
        existingEnrollment.status = 'active';
        await existingEnrollment.save();

        return res.status(200).json({
          success: true,
          message: 'Re-enrolled in the course successfully',
          data: existingEnrollment,
        });
      }

      throw new ApiError('Already enrolled in this course', 400);
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      course: course._id,
      student: req.user._id,
      status: 'active',
      enrollmentDate: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled in the course successfully',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Drop a course (unenroll)
 * @route   PUT /api/courses/:id/drop
 * @access  Private/Student
 */
export const dropCourse = async (req, res, next) => {
  try {
    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      course: req.params.id,
      student: req.user._id,
    });

    if (!enrollment) {
      throw new ApiError('Not enrolled in this course', 404);
    }

    // Update status to dropped
    enrollment.status = 'dropped';
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Dropped from the course successfully',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students enrolled in a course
 * @route   GET /api/courses/:id/students
 * @access  Private/Teacher
 */
export const getCourseStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Check if the user is the teacher of this course
    if (course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to access this information', 403);
    }

    // Find all active enrollments for this course
    const enrollments = await Enrollment.find({
      course: course._id,
      status: 'active',
    }).populate('student', 'name email profilePicture');

    // Extract student info
    const students = enrollments.map(enrollment => enrollment.student);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available students for a course
// @route   GET /api/courses/:id/available-students
// @access  Private (teachers only)
export const getAvailableStudents = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check if user is the teacher of this course
  if (course.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view available students for this course');
  }
  
  // Get all students (users with role 'student')
  const allStudents = await User.find({ 
    role: 'student' 
  }).select('_id name email firstName lastName section year');
  
  // Get enrolled students from Enrollment collection
  const enrollments = await Enrollment.find({
    course: course._id,
    status: 'active'
  });
  
  // Extract enrolled student IDs
  const enrolledStudentIds = enrollments.map(enrollment => enrollment.student.toString());
  
  // Filter out already enrolled students
  const availableStudents = allStudents.filter(
    student => !enrolledStudentIds.includes(student._id.toString())
  );
  
  res.status(200).json({
    success: true,
    data: availableStudents
  });
});

// @desc    Add a student to a course
// @route   POST /api/courses/:id/students
// @access  Private (teachers only)
export const addStudentToCourse = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  
  if (!studentId) {
    res.status(400);
    throw new Error('Please provide a student ID');
  }
  
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check if user is the teacher of this course
  if (course.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to add students to this course');
  }
  
  // Check if student exists
  const student = await User.findById(studentId);
  
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  
  // Check if student is already enrolled
  const existingEnrollment = await Enrollment.findOne({
    course: course._id,
    student: studentId
  });
  
  if (existingEnrollment && existingEnrollment.status === 'active') {
    res.status(400);
    throw new Error('Student is already enrolled in this course');
  } else if (existingEnrollment && existingEnrollment.status === 'dropped') {
    // If student previously dropped the course, reactivate enrollment
    existingEnrollment.status = 'active';
    await existingEnrollment.save();
    
    res.status(200).json({
      success: true,
      message: 'Student re-enrolled to course successfully'
    });
    return;
  }
  
  // Create new enrollment
  await Enrollment.create({
    course: course._id,
    student: studentId,
    status: 'active',
    enrollmentDate: Date.now()
  });
  
  res.status(201).json({
    success: true,
    message: 'Student added to course successfully'
  });
});

// @desc    Remove a student from a course
// @route   DELETE /api/courses/:id/students/:studentId
// @access  Private (teachers only)
export const removeStudentFromCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check if user is the teacher of this course
  if (course.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to remove students from this course');
  }
  
  // Check if student exists
  const student = await User.findById(req.params.studentId);
  
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  
  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    course: course._id,
    student: req.params.studentId,
    status: 'active'
  });
  
  if (!enrollment) {
    res.status(400);
    throw new Error('Student is not enrolled in this course');
  }
  
  // Update enrollment status to dropped instead of deleting
  enrollment.status = 'dropped';
  await enrollment.save();
  
  res.status(200).json({
    success: true,
    message: 'Student removed from course successfully'
  });
}); 