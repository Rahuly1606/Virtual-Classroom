import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import GradeSubmissionModal from './GradeSubmissionModal';
import { FaDownload, FaGraduationCap, FaArrowLeft, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SubmissionList = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch assignment details
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);

        // Fetch submissions for this assignment
        const submissionsData = await assignmentService.getSubmissions(assignmentId);
        setSubmissions(submissionsData);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignment data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, [assignmentId]);

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
  };

  const handleGradeSubmit = async (submissionId, gradeData) => {
    try {
      const updatedSubmission = await assignmentService.gradeSubmission(submissionId, gradeData);
      
      // Update the submissions list with the graded submission
      setSubmissions(submissions.map(sub => 
        sub._id === updatedSubmission._id ? updatedSubmission : sub
      ));
      
      setIsGradeModalOpen(false);
      toast.success('Submission graded successfully');
    } catch (err) {
      toast.error('Failed to grade submission');
      console.error(err);
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  return (
    <div className="submissions-container">
      <div className="page-header">
        <Link to="/assignments" className="btn-icon btn-secondary flex items-center gap-2">
          <FaArrowLeft /> Back to Assignments
        </Link>
        <h1 className="text-2xl font-bold">{assignment?.title} - Submissions</h1>
      </div>
      
      <div className="assignment-details mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Assignment Details</h2>
            <p className="text-gray-700">{assignment?.description}</p>
          </div>
          <div className="text-right">
            <p className="badge badge-primary">Due: {formatDate(assignment?.deadline)}</p>
            <p className="mt-2">Total Points: {assignment?.totalPoints}</p>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No submissions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Files</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission._id} className={submission.isLate ? 'late-submission' : ''}>
                  <td className="student-info">
                    {submission.student?.profilePicture ? (
                      <img 
                        src={submission.student.profilePicture} 
                        alt={submission.student.name} 
                        className="student-avatar"
                      />
                    ) : (
                      <div className="student-avatar-placeholder">
                        {submission.student?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="student-name">{submission.student?.name}</p>
                      <p className="student-email">{submission.student?.email}</p>
                    </div>
                  </td>
                  <td>
                    <p>{formatDate(submission.submittedAt)}</p>
                    {submission.isLate && (
                      <span className="badge badge-warning">Late</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${submission.status}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="submission-files">
                      {submission.files.map((file, index) => (
                        <a 
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          <FaDownload className="mr-1" />
                          <span className="file-name">{file.originalName}</span>
                        </a>
                      ))}
                    </div>
                  </td>
                  <td>
                    {submission.status === 'graded' ? (
                      <div className="grade-info">
                        <p className="grade-points">
                          {submission.grade.points} / {assignment.totalPoints}
                        </p>
                        <p className="grade-percentage">
                          {Math.round((submission.grade.points / assignment.totalPoints) * 100)}%
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-500">Not graded</span>
                    )}
                  </td>
                  <td>
                    <div className="submission-actions">
                      <Link
                        to={`/submissions/${submission._id}`}
                        className="btn-icon btn-primary"
                        title="View Submission"
                      >
                        <FaEye />
                      </Link>
                      <button
                        onClick={() => handleGradeSubmission(submission)}
                        className="btn-icon btn-secondary"
                        title="Grade Submission"
                      >
                        <FaGraduationCap />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isGradeModalOpen && selectedSubmission && (
        <GradeSubmissionModal
          submission={selectedSubmission}
          assignment={assignment}
          onClose={() => setIsGradeModalOpen(false)}
          onSubmit={handleGradeSubmit}
        />
      )}
    </div>
  );
};

export default SubmissionList; 