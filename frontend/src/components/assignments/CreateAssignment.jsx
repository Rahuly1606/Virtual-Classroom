import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import assignmentService from '../../services/assignmentService';
import courseService from '../../services/courseService';
import FileUpload from '../common/FileUpload';
import Spinner from '../ui/Spinner';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { 
  FaCalendarAlt, 
  FaPaperclip, 
  FaSave, 
  FaTimes, 
  FaBook, 
  FaGraduationCap, 
  FaTrophy, 
  FaLightbulb,
  FaChevronLeft,
  FaChevronRight,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaInfoCircle
} from 'react-icons/fa';

const CreateAssignment = () => {
  const { courseId: routeParamCourseId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryCourseId = queryParams.get('courseId');
  
  // Use courseId from either route params or query params
  const courseId = routeParamCourseId || queryCourseId;
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [files, setFiles] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 3;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      course: courseId || '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16), // Default to 1 week from now
      totalPoints: 100
    }
  });

  // Watch form values to enable/disable next button
  const watchedValues = watch();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        console.log('Fetching courses for teacher...');
        
        // Try multiple approaches to get teacher courses
        let teacherCourses = [];
        let error = null;
        
        try {
          // First try /courses/teaching endpoint
          teacherCourses = await courseService.getTeacherCourses();
          console.log('Teacher courses from /teaching endpoint:', teacherCourses);
        } catch (err) {
          error = err;
          console.error('Error with getTeacherCourses:', err);
          
          // If that fails, try the general getCourses method
          try {
            console.log('Trying alternative: getCourses');
            const allCourses = await courseService.getCourses();
            console.log('All courses:', allCourses);
            
            // Filter to only show courses the teacher owns
            teacherCourses = allCourses.filter(course => 
              course.teacher && 
              (typeof course.teacher === 'string' 
                ? course.teacher === user?.id || course.teacher === user?._id
                : course.teacher._id === user?.id || course.teacher._id === user?._id)
            );
            
            console.log('Filtered teacher courses:', teacherCourses);
          } catch (err2) {
            console.error('Error with getCourses fallback:', err2);
            // Keep the original error if both fail
          }
        }
        
        if (teacherCourses && teacherCourses.length > 0) {
          console.log(`Found ${teacherCourses.length} teacher courses`);
          setCourses(teacherCourses);
        } else {
          console.warn('No courses found for teacher');
          setCourses([]);
          if (error) {
            console.error('Original error:', error);
          }
        }
      } catch (err) {
        console.error('Failed to load any courses:', err);
        setError('Failed to load courses. Please check your network connection and try again.');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user?.id, user?._id]);

  // Set courseId from params if available
  useEffect(() => {
    if (courseId) {
      setValue('course', courseId);
    }
  }, [courseId, setValue]);

  const handleFileChange = (uploadedFiles) => {
    setFiles(uploadedFiles);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      // Add files to the form data
      const assignmentData = {
        ...data,
        files
      };

      // Ensure the course field has the correct name for the API
      if (data.course) {
        assignmentData.course = data.course;
      }

      console.log('Submitting assignment data:', assignmentData);
      await assignmentService.createAssignment(assignmentData);
      toast.success('Assignment created successfully');
      navigate(courseId ? `/courses/${courseId}` : '/assignments');
    } catch (err) {
      setError('Failed to create assignment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setFormStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setFormStep(prev => Math.max(prev - 1, 1));
  };

  // Determine if we can move to the next step
  const canProceedToStep2 = !!watchedValues.title && !!watchedValues.course;
  const canProceedToStep3 = !!watchedValues.description && !!watchedValues.deadline;

  if (loadingCourses) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-pulse">
          <Spinner size="lg" />
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-xl font-bold">
            Loading your courses...
          </div>
        </div>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          We're preparing everything you need to create an engaging assignment for your students.
        </p>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="mb-10">
      <div className="flex justify-between mb-2">
        <div className="text-xs text-gray-500">Step {formStep} of {totalSteps}</div>
        <div className="text-xs text-blue-600 font-medium">
          {formStep === 1 ? 'Basic Information' : formStep === 2 ? 'Assignment Details' : 'Resources'}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${(formStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between relative mt-2">
        <div className={`step-indicator ${formStep >= 1 ? 'active' : ''}`}>
          <div className={`step-circle transition-all duration-300 ${formStep >= 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-110' : 'bg-gray-300'}`}>
            <FaBook className="text-white" />
          </div>
          <span className={`text-xs mt-1 ${formStep >= 1 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>Basics</span>
        </div>
        <div className={`step-indicator ${formStep >= 2 ? 'active' : ''}`}>
          <div className={`step-circle transition-all duration-300 ${formStep >= 2 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-110' : 'bg-gray-300'}`}>
            <FaGraduationCap className="text-white" />
          </div>
          <span className={`text-xs mt-1 ${formStep >= 2 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>Details</span>
        </div>
        <div className={`step-indicator ${formStep >= 3 ? 'active' : ''}`}>
          <div className={`step-circle transition-all duration-300 ${formStep >= 3 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-110' : 'bg-gray-300'}`}>
            <FaTrophy className="text-white" />
          </div>
          <span className={`text-xs mt-1 ${formStep >= 3 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>Resources</span>
        </div>
        
        {/* Progress line behind the circles */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-8 px-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaLightbulb className="text-yellow-300" />
                <span>Create Assignment</span>
              </h2>
              <p className="text-blue-100 mt-1 max-w-xl">
                Design an engaging learning experience for your students
              </p>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              className="text-white hover:bg-white/20 p-3 rounded-full transition-all"
              aria-label="Cancel"
            >
              <FaTimes />
            </button>
          </div>

          {error && (
            <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded animate-pulse">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-8 py-8">
            {renderProgressBar()}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {formStep === 1 && (
                <div className="transition-opacity duration-500 animate-fadeIn">
                  <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 mr-2 text-xs font-bold">1</span>
                          Assignment Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          className={`mt-1 block w-full rounded-lg px-4 py-3 bg-gray-50 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="Enter an engaging title for your assignment"
                          {...register('title', { required: 'Title is required' })}
                        />
                        {errors.title && <p className="mt-2 text-red-500 text-sm">{errors.title.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="course" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 mr-2 text-xs font-bold">2</span>
                          Select Course <span className="text-red-500">*</span>
                        </label>
                        
                        {loadingCourses ? (
                          <div className="mt-2 flex items-center gap-2 text-gray-500">
                            <Spinner size="sm" />
                            <span>Loading your courses...</span>
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100">
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-blue-100 rounded-full mb-3">
                                <FaLightbulb className="text-blue-600 text-xl" />
                              </div>
                              <h3 className="text-blue-800 font-semibold mb-2">No Courses Available</h3>
                              <p className="text-blue-700 dark:text-blue-300 mb-4 max-w-md">
                                You need to create a course before you can create assignments for your students.
                              </p>
                              <a href="/courses/new" className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
                                <FaChalkboardTeacher className="mr-2" />
                                Create Your First Course
                              </a>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`mt-2 relative ${!!courseId ? 'opacity-80' : ''}`}>
                              <select
                                id="course"
                                className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none ${errors.course ? 'border-red-500' : 'border-gray-200'}`}
                                {...register('course', { required: 'Course is required' })}
                                disabled={!!courseId}
                              >
                                <option value="">Select a course</option>
                                {courses.map(course => {
                                  // Handle different possible course formats
                                  const courseName = course.name || course.title || 'Unnamed Course';
                                  const courseCode = course.code || course.subject || '';
                                  const displayText = courseCode 
                                    ? `${courseName} (${courseCode})` 
                                    : courseName;
                                  
                                  return (
                                    <option key={course._id} value={course._id}>
                                      {displayText}
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </div>
                            </div>
                            {errors.course && <p className="error-message mt-2 text-red-500 text-sm">{errors.course.message}</p>}
                            
                            <div className="mt-1 text-xs text-gray-500 flex items-center">
                              <FaInfoCircle className="mr-1" />
                              {courses.length} course(s) available for assignment creation
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 mt-6 border border-blue-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FaLightbulb className="text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-blue-800">Educator Tip</h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <p>Clear, descriptive titles help students understand the purpose of the assignment at a glance.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="transition-opacity duration-500 animate-fadeIn">
                  <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="description" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 mr-2 text-xs font-bold">3</span>
                          Instructions <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="description"
                          className={`mt-1 block w-full rounded-lg px-4 py-3 bg-gray-50 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.description ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="Provide detailed instructions, requirements, and expectations for this assignment"
                          rows="8"
                          {...register('description', { required: 'Description is required' })}
                        ></textarea>
                        {errors.description && <p className="error-message mt-2 text-red-500 text-sm">{errors.description.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="deadline" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-blue-600 mr-2" /> 
                              Due Date & Time <span className="text-red-500">*</span>
                            </div>
                          </label>
                          <input
                            type="datetime-local"
                            id="deadline"
                            className={`mt-1 block w-full rounded-lg px-4 py-3 bg-gray-50 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.deadline ? 'border-red-500' : 'border-gray-200'}`}
                            {...register('deadline', { required: 'Deadline is required' })}
                          />
                          {errors.deadline && <p className="error-message mt-2 text-red-500 text-sm">{errors.deadline.message}</p>}
                        </div>

                        <div>
                          <label htmlFor="totalPoints" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <div className="flex items-center">
                              <FaTrophy className="text-blue-600 mr-2" /> 
                              Total Points
                            </div>
                          </label>
                          <input
                            type="number"
                            id="totalPoints"
                            className="mt-1 block w-full rounded-lg px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            min="1"
                            max="1000"
                            {...register('totalPoints', { 
                              min: { value: 1, message: 'Points must be at least 1' },
                              max: { value: 1000, message: 'Points cannot exceed 1000' }
                            })}
                          />
                          {errors.totalPoints && <p className="error-message mt-2 text-red-500 text-sm">{errors.totalPoints.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 mt-6 border border-blue-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FaClipboardCheck className="text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-blue-800">Best Practice</h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <p>Include clear grading criteria in your instructions so students understand how they'll be evaluated.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="transition-opacity duration-500 animate-fadeIn">
                  <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        <div className="flex items-center">
                          <FaPaperclip className="text-blue-600 mr-2" /> 
                          Assignment Materials (Optional)
                        </div>
                        <p className="font-normal text-sm text-gray-500 mt-1">
                          Upload any files, resources, or reference materials students will need.
                        </p>
                      </label>
                      <div className="mt-2 p-8 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors">
                        <FileUpload 
                          onFileChange={handleFileChange} 
                          multiple={true}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                        />
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">PDF</span>
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">Word</span>
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">Excel</span>
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">PowerPoint</span>
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">Text</span>
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded">Images</span>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                            <FaPaperclip className="text-blue-500 mr-2" />
                            Selected Files ({files.length})
                          </h4>
                          <ul className="divide-y divide-gray-100">
                            {files.map((file, index) => (
                              <li key={index} className="py-2 flex items-center justify-between">
                                <div className="flex items-center">
                                  <FaFileDownload className="text-blue-500 mr-3" />
                                  <span className="truncate max-w-xs">{file.name}</span>
                                </div>
                                <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-5 mt-6 border border-amber-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="p-2 bg-amber-100 rounded-full">
                          <FaLightbulb className="text-amber-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-amber-800">Pro Tip</h3>
                        <div className="mt-1 text-sm text-amber-700">
                          <p>Including examples of high-quality submissions can help students understand your expectations and produce better work.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                {formStep > 1 ? (
                  <button 
                    type="button" 
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={prevStep}
                  >
                    <FaChevronLeft className="text-xs" /> Back
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(-1)}
                  >
                    <FaTimes className="text-xs" /> Cancel
                  </button>
                )}

                {formStep < totalSteps ? (
                  <button 
                    type="button" 
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg text-white transition-colors ${
                      (formStep === 1 && !canProceedToStep2) || (formStep === 2 && !canProceedToStep3)
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md'
                    }`}
                    onClick={nextStep}
                    disabled={(formStep === 1 && !canProceedToStep2) || (formStep === 2 && !canProceedToStep3)}
                  >
                    Continue <FaChevronRight className="text-xs" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-white transition-all shadow-md transform hover:translate-y-[-2px]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" /> Creating...
                      </>
                    ) : (
                      <>
                        <FaSave /> Create Assignment
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment; 