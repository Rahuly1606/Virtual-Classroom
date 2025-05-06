import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import { FaClock, FaCheckCircle, FaHourglassHalf, FaExclamationCircle } from 'react-icons/fa';

const StudentAssignmentList = ({ courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        let assignmentsData;
        if (courseId) {
          assignmentsData = await assignmentService.getAssignmentsByCourse(courseId);
        } else {
          assignmentsData = await assignmentService.getStudentAssignments();
        }
        setAssignments(assignmentsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignments');
        setLoading(false);
        console.error(err);
      }
    };

    fetchAssignments();
  }, [courseId]);

  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const hasSubmission = assignment.submission !== null;
    
    if (hasSubmission) {
      if (assignment.submission.status === 'graded') {
        return {
          icon: <FaCheckCircle className="text-green-500" />,
          label: 'Graded',
          class: 'status-graded'
        };
      } else {
        return {
          icon: <FaHourglassHalf className="text-blue-500" />,
          label: 'Submitted',
          class: 'status-submitted'
        };
      }
    } else if (now > deadline) {
      return {
        icon: <FaExclamationCircle className="text-red-500" />,
        label: 'Missing',
        class: 'status-missing'
      };
    } else {
      return {
        icon: <FaClock className="text-yellow-500" />,
        label: 'Pending',
        class: 'status-pending'
      };
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate - now;
    
    if (timeRemaining < 0) {
      return 'Past due';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  // Sort assignments by status and deadline
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aStatus = getAssignmentStatus(a);
    const bStatus = getAssignmentStatus(b);
    
    // Missing assignments first
    if (aStatus.label === 'Missing' && bStatus.label !== 'Missing') return -1;
    if (aStatus.label !== 'Missing' && bStatus.label === 'Missing') return 1;
    
    // Then pending assignments by deadline (closest first)
    if (aStatus.label === 'Pending' && bStatus.label === 'Pending') {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    
    // Then submitted but not graded
    if (aStatus.label === 'Submitted' && bStatus.label !== 'Submitted') return -1;
    if (aStatus.label !== 'Submitted' && bStatus.label === 'Submitted') return 1;
    
    // Finally graded assignments
    if (aStatus.label === 'Graded' && bStatus.label !== 'Graded') return 1;
    if (aStatus.label !== 'Graded' && bStatus.label === 'Graded') return -1;
    
    // Default to deadline order
    return new Date(a.deadline) - new Date(b.deadline);
  });

  return (
    <div className="assignments-container">
      <h2 className="text-xl font-bold mb-4">Assignments</h2>
      
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No assignments available.</p>
        </div>
      ) : (
        <div className="assignments-grid">
          {sortedAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const timeRemaining = getTimeRemaining(assignment.deadline);
            
            return (
              <div key={assignment._id} className={`assignment-card ${status.class}`}>
                <div className="assignment-header">
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <div className="badge-container">
                    <span className={`status-badge ${status.class}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                </div>
                
                <div className="assignment-body">
                  <p className="assignment-course">
                    {assignment.course?.name || 'Unknown Course'}
                  </p>
                  <p className="assignment-desc">
                    {assignment.description.length > 100 
                      ? `${assignment.description.substring(0, 100)}...` 
                      : assignment.description}
                  </p>
                </div>
                
                <div className="assignment-meta">
                  <div className="deadline-info">
                    <span className="deadline-label">Due:</span>
                    <span className="deadline-value">{formatDate(assignment.deadline)}</span>
                    <span className="time-remaining">{timeRemaining}</span>
                  </div>
                  
                  {assignment.submission?.status === 'graded' && (
                    <div className="grade-info">
                      <span className="grade-label">Grade:</span>
                      <span className="grade-value">
                        {assignment.submission.grade.points} / {assignment.totalPoints}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="assignment-actions">
                  <Link 
                    to={`/assignments/${assignment._id}`} 
                    className={`btn-primary ${status.label === 'Graded' ? 'btn-muted' : ''}`}
                  >
                    {status.label === 'Submitted' || status.label === 'Graded' 
                      ? 'View Submission' 
                      : 'Submit Assignment'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentList; 