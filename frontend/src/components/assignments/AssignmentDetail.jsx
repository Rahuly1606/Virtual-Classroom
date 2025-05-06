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
  FaSave
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
        icon: <FaCheckCircle />,
        label: 'Graded',
        class: 'status-graded',
        late: isLate
      };
    } else {
      return {
        icon: <FaCheckCircle />,
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
        class: 'status-overdue'
      };
    } else {
      const diffTime = Math.abs(deadline - now);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        return {
          icon: <FaClock />,
          label: 'Due Soon',
          class: 'status-due-soon'
        };
      } else {
        return {
          icon: <FaCalendarAlt />,
          label: 'Upcoming',
          class: 'status-upcoming'
        };
      }
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );
  
  const isTeacher = user.role === 'teacher';
  const deadlineStatus = getDeadlineStatus();
  const submissionStatus = getSubmissionStatus();
  const isPastDeadline = new Date() > new Date(assignment.deadline);
  const canSubmit = !isTeacher && (!isPastDeadline || user.allowLateSubmissions);

  return (
    <div className="assignment-detail-container">
      <div className="page-header">
        <Link to="/assignments" className="btn-icon btn-secondary flex items-center gap-2">
          <FaArrowLeft /> Back to Assignments
        </Link>
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
      </div>
      
      <div className="assignment-content">
        <div className="assignment-info">
          <div className="info-header">
            <div className="course-info">
              <h2 className="text-lg font-semibold">{assignment.course?.name || 'Unknown Course'}</h2>
              <p className="text-gray-600">Teacher: {assignment.teacher?.name || 'Unknown Teacher'}</p>
            </div>
            
            <div className="deadline-info">
              <div className={`deadline-badge ${deadlineStatus.class}`}>
                {deadlineStatus.icon} {deadlineStatus.label}
              </div>
              <p className="deadline">Due: {formatDate(assignment.deadline)}</p>
              <p className="points">Points: {assignment.totalPoints}</p>
            </div>
          </div>
          
          <div className="description-section">
            <h3 className="section-title">Instructions</h3>
            <div className="description-content">
              {assignment.description}
            </div>
          </div>
          
          {assignment.files && assignment.files.length > 0 && (
            <div className="materials-section">
              <h3 className="section-title">Assignment Materials</h3>
              <div className="materials-list">
                {assignment.files.map((file, index) => (
                  <a 
                    key={index} 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="material-link"
                  >
                    <FaFileDownload className="material-icon" />
                    <span className="material-name">{file.originalName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Submission section */}
        <div className="submission-section">
          {submission ? (
            // Show existing submission
            <div className="submission-container">
              <div className="submission-header">
                <h3 className="section-title">Your Submission</h3>
                <div className="submission-status">
                  <span className={`status-badge ${submissionStatus.class}`}>
                    {submissionStatus.icon} {submissionStatus.label}
                  </span>
                  {submissionStatus.late && (
                    <span className="badge badge-warning">Late</span>
                  )}
                </div>
              </div>
              
              <div className="submission-details">
                <p className="submitted-on">
                  Submitted on: {formatDate(submission.submittedAt)}
                </p>
                
                {submission.status === 'graded' && (
                  <div className="grade-details">
                    <h4 className="grade-title">Grade</h4>
                    <div className="grade-info">
                      <p className="grade-score">
                        {submission.grade.points} / {assignment.totalPoints}
                        <span className="grade-percentage">
                          ({Math.round((submission.grade.points / assignment.totalPoints) * 100)}%)
                        </span>
                      </p>
                      {submission.grade.feedback && (
                        <div className="feedback-section">
                          <h5 className="feedback-title">Feedback:</h5>
                          <p className="feedback-content">{submission.grade.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="submitted-files">
                  <h4 className="files-title">Submitted Files</h4>
                  <div className="files-list">
                    {submission.files.map((file, index) => (
                      <a 
                        key={index} 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        <FaFileDownload className="file-icon" />
                        <span className="file-name">{file.originalName}</span>
                      </a>
                    ))}
                  </div>
                </div>
                
                {submission.comment && (
                  <div className="comment-section">
                    <h4 className="comment-title">Your Comment:</h4>
                    <p className="comment-content">{submission.comment}</p>
                  </div>
                )}
              </div>
              
              {/* Resubmit button if allowed */}
              {canSubmit && (
                <div className="resubmit-option">
                  <button 
                    onClick={() => setSubmission(null)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FaUpload /> Resubmit Assignment
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Show submission form
            isTeacher ? (
              <div className="teacher-view">
                <p>As a teacher, you cannot submit to this assignment.</p>
                <Link 
                  to={`/assignments/${assignmentId}/submissions`}
                  className="btn-primary mt-4"
                >
                  View Student Submissions
                </Link>
              </div>
            ) : canSubmit ? (
              <div className="submission-form-container">
                <h3 className="section-title">Submit Your Assignment</h3>
                
                {isPastDeadline && (
                  <div className="late-warning">
                    <FaExclamationCircle className="warning-icon" />
                    <p>The deadline has passed, but late submissions are allowed.</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="submission-form">
                  <div className="form-group">
                    <label className="form-label">
                      Upload Files <span className="text-red-500">*</span>
                    </label>
                    <FileUpload 
                      onFileChange={handleFileChange} 
                      multiple={true}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Supported formats: PDF, Word, Images, ZIP, and Text
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="comment" className="form-label">
                      Comment (Optional)
                    </label>
                    <textarea
                      id="comment"
                      className="form-textarea"
                      rows="3"
                      placeholder="Add a comment to your submission..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary flex items-center gap-2"
                      disabled={submitting || files.length === 0}
                    >
                      {submitting ? (
                        <>
                          <Spinner /> Submitting...
                        </>
                      ) : (
                        <>
                          <FaSave /> Submit Assignment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="submission-closed">
                <div className="closed-message">
                  <FaTimes className="closed-icon" />
                  <h3>Submission Closed</h3>
                  <p>The deadline for this assignment has passed and late submissions are not allowed.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail; 