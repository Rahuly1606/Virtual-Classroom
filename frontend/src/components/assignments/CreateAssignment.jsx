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
  FaLightbulb
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
    <div className="flex justify-center items-center h-80">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600 animate-pulse">Loading courses...</p>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="w-full bg-gray-100 rounded-full h-2.5 my-4 dark:bg-gray-700">
        <div 
          className="bg-gradient-to-r from-blue-500 to-violet-500 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${(formStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between">
        <div className={`step-indicator ${formStep >= 1 ? 'active' : ''}`}>
          <div className={`step-circle ${formStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <FaBook className="text-white" />
          </div>
          <span className="text-xs mt-1">Basics</span>
        </div>
        <div className={`step-indicator ${formStep >= 2 ? 'active' : ''}`}>
          <div className={`step-circle ${formStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <FaGraduationCap className="text-white" />
          </div>
          <span className="text-xs mt-1">Details</span>
        </div>
        <div className={`step-indicator ${formStep >= 3 ? 'active' : ''}`}>
          <div className={`step-circle ${formStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <FaTrophy className="text-white" />
          </div>
          <span className="text-xs mt-1">Resources</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 py-6 px-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaLightbulb className="text-yellow-300" />
            <span>Create Inspiring Assignment</span>
          </h2>
          <button 
            onClick={() => navigate(-1)} 
            className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
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

        <div className="px-8 py-6">
          {renderProgressBar()}

          <form onSubmit={handleSubmit(onSubmit)} className="assignment-form space-y-6">
            {formStep === 1 && (
              <div className="space-y-6 transition-opacity duration-500 animate-fadeIn">
                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-blue-500">01</span> Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      className={`mt-2 form-input w-full rounded-lg px-4 py-3 border-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Enter an engaging title for your assignment"
                      {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && <p className="error-message mt-2 text-red-500">{errors.title.message}</p>}
                  </div>

                  <div className="form-group mt-6">
                    <label htmlFor="course" className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-blue-500">02</span> Select Course <span className="text-red-500">*</span>
                    </label>
                    
                    {loadingCourses ? (
                      <div className="mt-2 flex items-center gap-2 text-gray-500">
                        <Spinner size="sm" />
                        <span>Loading your courses...</span>
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex flex-col items-center text-center">
                          <FaLightbulb className="text-yellow-500 text-xl mb-2" />
                          <p className="text-blue-700 dark:text-blue-300 mb-2">You don't have any courses yet!</p>
                          <a href="/courses/new" className="btn-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-1.5 text-sm transition-colors">
                            Create Your First Course
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`mt-2 relative ${!!courseId ? 'opacity-60' : ''}`}>
                          <select
                            id="course"
                            className={`form-select w-full rounded-lg px-4 py-3 border-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none ${errors.course ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                        {errors.course && <p className="error-message mt-2 text-red-500">{errors.course.message}</p>}
                        
                        <div className="mt-1 text-xs text-gray-500">
                          {courses.length} course(s) available for assignment creation
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-6 transition-opacity duration-500 animate-fadeIn">
                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
                  <div className="form-group">
                    <label htmlFor="description" className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-blue-500">03</span> Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      className={`mt-2 form-textarea w-full rounded-lg px-4 py-3 border-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Provide detailed instructions for the assignment"
                      rows="6"
                      {...register('description', { required: 'Description is required' })}
                    ></textarea>
                    {errors.description && <p className="error-message mt-2 text-red-500">{errors.description.message}</p>}
                  </div>

                  <div className="form-row mt-6 flex flex-wrap gap-6">
                    <div className="form-group flex-1 min-w-[240px]">
                      <label htmlFor="deadline" className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" /> Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="deadline"
                        className={`mt-2 form-input w-full rounded-lg px-4 py-3 border-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.deadline ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        {...register('deadline', { required: 'Deadline is required' })}
                      />
                      {errors.deadline && <p className="error-message mt-2 text-red-500">{errors.deadline.message}</p>}
                    </div>

                    <div className="form-group flex-1 min-w-[240px]">
                      <label htmlFor="totalPoints" className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FaTrophy className="text-blue-500" /> Points
                      </label>
                      <input
                        type="number"
                        id="totalPoints"
                        className="mt-2 form-input w-full rounded-lg px-4 py-3 border-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        min="1"
                        max="1000"
                        {...register('totalPoints', { 
                          min: { value: 1, message: 'Points must be at least 1' },
                          max: { value: 1000, message: 'Points cannot exceed 1000' }
                        })}
                      />
                      {errors.totalPoints && <p className="error-message mt-2 text-red-500">{errors.totalPoints.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-6 transition-opacity duration-500 animate-fadeIn">
                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
                  <div className="form-group">
                    <label className="form-label text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FaPaperclip className="text-blue-500" /> Assignment Materials
                    </label>
                    <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <FileUpload 
                        onFileChange={handleFileChange} 
                        multiple={true}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        <span className="block mb-1 font-medium">Supported formats:</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">PDF</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">Word</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">Excel</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">PowerPoint</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">Text</span>
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium mr-1 px-2 py-0.5 rounded">Images</span>
                      </p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Selected Files ({files.length})</h4>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaLightbulb className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Pro Tip</h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        <p>To boost student engagement, consider adding clear examples and rubrics in your assignment materials.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {formStep > 1 ? (
                <button 
                  type="button" 
                  className="btn-secondary flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={prevStep}
                >
                  Back
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn-secondary flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              )}

              {formStep < totalSteps ? (
                <button 
                  type="button" 
                  className={`btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg text-white transition-colors ${
                    (formStep === 1 && !canProceedToStep2) || (formStep === 2 && !canProceedToStep3)
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={nextStep}
                  disabled={(formStep === 1 && !canProceedToStep2) || (formStep === 2 && !canProceedToStep3)}
                >
                  Continue
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-lg text-white transition-all transform hover:scale-105"
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
  );
};

export default CreateAssignment; 