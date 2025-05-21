import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import FileUpload from '../common/FileUpload';
import Spinner from '../ui/Spinner';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaFileDownload, 
  FaUpload, 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimes,
  FaClock,
  FaExclamationCircle,
  FaSave,
  FaBookOpen,
  FaPaperclip,
  FaComments,
  FaChalkboardTeacher,
  FaMedal
} from 'react-icons/fa';

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(data);
        
        // If there's a submission, set it in state
        if (data.submission) {
          setSubmission(data.submission);
          setComment(data.submission.comment || '');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignment');
        setLoading(false);
        console.error(err);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleFileChange = (uploadedFiles) => {
    setFiles(uploadedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const submissionData = {
        files,
        comment
      };
      
      const result = await assignmentService.submitAssignment(assignmentId, submissionData);
      setSubmission(result);
      setFiles([]);
      
      toast.success('Assignment submitted successfully');
      setSubmitting(false);
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
      setSubmitting(false);
      console.error(err);
    }
  };

  const getSubmissionStatus = () => {
    if (!submission) return null;
    
    const isLate = submission.isLate;
    
    if (submission.status === 'graded') {
      return {
        icon: <FaMedal className="text-yellow-500" />,
        label: 'Graded',
        class: 'status-graded',
        late: isLate
      };
    } else {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        label: 'Submitted',
        class: 'status-submitted',
        late: isLate
      };
    }
  };
  
  const getDeadlineStatus = () => {
    if (!assignment) return null;
    
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (now > deadline) {
      return {
        icon: <FaExclamationCircle />,
        label: 'Past Due',
        class: 'bg-red-100 text-red-700 border-red-200'
      };
    } else {
      const diffTime = Math.abs(deadline - now);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      let timeRemaining = '';
      if (diffDays > 0) {
        timeRemaining = `${diffDays}d ${diffHours}h remaining`;
      } else {
        timeRemaining = `${diffHours}h remaining`;
      }
      
      if (diffDays <= 1) {
        return {
          icon: <FaClock />,
          label: 'Due Soon',
          timeRemaining,
          class: 'bg-amber-100 text-amber-700 border-amber-200'
        };
      } else {
        return {
          icon: <FaCalendarAlt />,
          label: 'Upcoming',
          timeRemaining,
          class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500 animate-pulse">Loading assignment details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 shadow-md">
        <div className="flex items-center">
          <FaExclamationCircle className="mr-3" />
          <p>{error}</p>
        </div>
        <div className="mt-3 text-center">
          <button 
            onClick={() => navigate('/assignments')} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Assignments
          </button>
        </div>
      </div>
    </div>
  );
  
  const isTeacher = user.role === 'teacher';
  const deadlineStatus = getDeadlineStatus();
  const submissionStatus = getSubmissionStatus();
  const isPastDeadline = new Date() > new Date(assignment.deadline);
  const canSubmit = !isTeacher && (!isPastDeadline || user.allowLateSubmissions);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-6 px-4 md:px-8 shadow-lg animate-gradient-x bg-size-200">
        <div className="max-w-6xl mx-auto">
          <Link to="/assignments" className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-4 group">
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            <span>Back to Assignments</span>
        </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold mb-1">{assignment.title}</h1>
              <p className="text-blue-100 flex items-center">
                <FaChalkboardTeacher className="mr-2" />
                <span>{assignment.course?.name || 'Unknown Course'}</span>
                <span className="mx-2">•</span>
                <span>{assignment.teacher?.name || 'Unknown Teacher'}</span>
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className={`rounded-lg px-4 py-2 flex items-center ${deadlineStatus.class} border text-sm font-medium shadow-sm animate-fadeIn`}>
                {deadlineStatus.icon}
                <div className="ml-2">
                  <div className="font-semibold">{deadlineStatus.label}</div>
                  {deadlineStatus.timeRemaining && (
                    <div className="text-xs">{deadlineStatus.timeRemaining}</div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                <div className="text-blue-100">Due: {formatDate(assignment.deadline)}</div>
                <div className="text-blue-100 flex justify-end items-center mt-1">
                  <FaMedal className="mr-1" />
                  <span>Points: {assignment.totalPoints}</span>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
          
      <div className="max-w-6xl mx-auto px-4 mt-8 grid gap-8 md:grid-cols-3">
        {/* Left sidebar with assignment details */}
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaBookOpen className="text-blue-500 mr-3" />
              Assignment Instructions
            </h2>
            <div className="prose max-w-none">
              {assignment.description}
          </div>
          
          {assignment.files && assignment.files.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FaPaperclip className="text-blue-500 mr-2" />
                  Assignment Materials
                </h3>
                <div className="grid gap-2">
                {assignment.files.map((file, index) => (
                  <a 
                    key={index} 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                      className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                        <FaFileDownload className="text-blue-600" />
                      </div>
                      <span className="font-medium flex-1">{file.originalName}</span>
                      <span className="text-blue-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Download
                      </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Submission section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-fadeIn animation-delay-150">
            <h2 className="text-xl font-semibold mb-4">
              {submission ? 'Your Submission' : 'Submit Your Work'}
            </h2>
            
          {submission ? (
            // Show existing submission
              <div>
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                  <div className="flex items-center">
                    <div className={`mr-3 rounded-full p-2 ${submissionStatus.class === 'status-graded' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                      {submissionStatus.icon}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {submissionStatus.label}
                  {submissionStatus.late && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full">Late</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted on {formatDate(submission.submittedAt)}
                      </div>
                    </div>
                  </div>
                  
                  {canSubmit && (
                    <button 
                      onClick={() => setSubmission(null)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center transition-colors"
                    >
                      <FaUpload className="mr-2" /> Resubmit
                    </button>
                  )}
                </div>
                
                {submission.status === 'graded' && (
                  <div className="mb-6 p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-200">
                    <h3 className="font-semibold text-lg mb-2 flex items-center text-yellow-800">
                      <FaMedal className="text-yellow-500 mr-2" /> Grade
                    </h3>
                    <div className="flex items-center mb-2">
                      <div className="text-3xl font-bold text-yellow-700">
                        {submission.grade.points}
                        <span className="text-base font-normal text-gray-500">/{assignment.totalPoints}</span>
                      </div>
                      <div className="ml-3 px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-sm">
                        {Math.round((submission.grade.points / assignment.totalPoints) * 100)}%
                      </div>
                    </div>
                    
                      {submission.grade.feedback && (
                      <div className="mt-4 pt-4 border-t border-yellow-200">
                        <h4 className="text-sm font-semibold mb-1 flex items-center text-gray-700">
                          <FaComments className="text-yellow-600 mr-2" /> Feedback from instructor:
                        </h4>
                        <div className="p-3 bg-white rounded-lg text-gray-700 border border-yellow-100">
                          {submission.grade.feedback}
                        </div>
                        </div>
                      )}
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <FaFileDownload className="text-blue-500 mr-2" /> Submitted Files
                  </h3>
                  <div className="space-y-2">
                    {submission.files.map((file, index) => (
                      <a 
                        key={index} 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FaFileDownload className="text-blue-600 mr-3" />
                        <span className="text-gray-700">{file.originalName}</span>
                      </a>
                    ))}
                  </div>
                </div>
                
                {submission.comment && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FaComments className="text-blue-500 mr-2" /> Your Comment
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg text-gray-700 border border-gray-200">
                      {submission.comment}
                    </div>
                </div>
              )}
            </div>
          ) : (
            // Show submission form
            isTeacher ? (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
                  <FaChalkboardTeacher className="mx-auto text-blue-500 text-4xl mb-4" />
                  <p className="text-gray-700 mb-4">As an instructor, you can view and grade student submissions.</p>
                <Link 
                  to={`/assignments/${assignmentId}/submissions`}
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  View Student Submissions
                </Link>
              </div>
            ) : canSubmit ? (
                <div>
                {isPastDeadline && (
                    <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 rounded-r-lg">
                      <div className="flex">
                        <FaExclamationCircle className="mr-3 mt-0.5" />
                        <div>
                          <p className="font-semibold">The deadline has passed</p>
                          <p className="text-sm">Late submissions are allowed, but may affect your grade.</p>
                        </div>
                      </div>
                  </div>
                )}
                
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                      Upload Files <span className="text-red-500">*</span>
                    </label>
                      <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    <FileUpload 
                      onFileChange={handleFileChange} 
                      multiple={true}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
                    />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 flex flex-wrap gap-1">
                        <span className="mr-1">Supported formats:</span>
                        <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">PDF</span>
                        <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">Word</span>
                        <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">Images</span>
                        <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">ZIP</span>
                        <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">Text</span>
                    </p>
                  </div>
                  
                    <div>
                      <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                        Add Comments (Optional)
                    </label>
                    <textarea
                      id="comment"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        rows="4"
                        placeholder="Any notes or comments to include with your submission..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                  
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                      type="submit" 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                      disabled={submitting || files.length === 0}
                    >
                      {submitting ? (
                        <>
                            <Spinner /> 
                            <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        <>
                            <FaSave className="mr-2" /> 
                            <span>Submit Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
                <div className="text-center py-10 px-4">
                  <div className="inline-flex items-center justify-center p-4 bg-red-100 text-red-600 rounded-full mb-4">
                    <FaTimes className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-red-600">Submission Closed</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    The deadline for this assignment has passed and late submissions are not allowed.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Right sidebar with assignment summary and key details */}
        <div className="md:col-span-1 order-1 md:order-2">
          <div className="sticky top-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b border-gray-100 pb-2">Assignment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-md bg-blue-50 text-blue-600 mr-3">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{formatDate(assignment.deadline)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 rounded-md bg-purple-50 text-purple-600 mr-3">
                    <FaMedal />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Points</p>
                    <p className="font-medium">{assignment.totalPoints}</p>
                  </div>
                </div>
                
                {submission && (
                  <div className="flex items-start">
                    <div className={`p-2 rounded-md ${
                      submission.status === 'graded' 
                        ? 'bg-yellow-50 text-yellow-600' 
                        : 'bg-green-50 text-green-600'
                    } mr-3`}>
                      {submission.status === 'graded' ? <FaMedal /> : <FaCheckCircle />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium flex items-center">
                        {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                        {submission.isLate && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                            Late
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {assignment.course && (
                  <div className="flex items-start">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 mr-3">
                      <FaChalkboardTeacher />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-medium">{assignment.course.name}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {isTeacher && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link 
                    to={`/assignments/${assignmentId}/edit`}
                    className="block text-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit Assignment
                  </Link>
                </div>
              )}
            </div>
            
            {submission && submission.status === 'graded' && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm p-5 border border-yellow-200 animate-fadeIn animation-delay-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <FaMedal className="text-yellow-500 text-xl" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-amber-800 font-semibold">Your Grade</p>
                  <div className="mt-2 text-3xl font-bold text-amber-700">
                    {Math.round((submission.grade.points / assignment.totalPoints) * 100)}%
                  </div>
                  <p className="mt-1 text-amber-700">
                    {submission.grade.points} out of {assignment.totalPoints} points
                  </p>
                </div>
              </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail; 