import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TeacherAssignmentList = ({ courseId }) => {
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
          assignmentsData = await assignmentService.getTeacherAssignments();
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

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        await assignmentService.deleteAssignment(id);
        setAssignments(assignments.filter(assignment => assignment._id !== id));
        toast.success('Assignment deleted successfully');
      } catch (err) {
        toast.error('Failed to delete assignment');
        console.error(err);
      }
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2 className="text-xl font-bold">Assignments</h2>
        <Link 
          to={courseId ? `/courses/${courseId}/assignments/new` : "/assignments/new"} 
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus /> Create Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No assignments yet.</p>
          <Link 
            to={courseId ? `/courses/${courseId}/assignments/new` : "/assignments/new"}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create your first assignment
          </Link>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-header">
                <h3 className="assignment-title">{assignment.title}</h3>
                <div className="badge-container">
                  <span className="badge badge-primary">
                    {new Date(assignment.deadline) > new Date() 
                      ? `Due: ${formatDate(assignment.deadline)}` 
                      : 'Past due'}
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
              
              <div className="assignment-stats">
                <div className="stat-item">
                  <span className="stat-label">Points:</span>
                  <span className="stat-value">{assignment.totalPoints}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Submissions:</span>
                  <span className="stat-value">{assignment.submissions?.length || 0}</span>
                </div>
              </div>
              
              <div className="assignment-actions">
                <Link 
                  to={`/assignments/${assignment._id}/submissions`} 
                  className="btn-icon btn-primary"
                  title="View Submissions"
                >
                  <FaEye />
                </Link>
                <Link 
                  to={`/assignments/${assignment._id}/edit`}
                  className="btn-icon btn-secondary"
                  title="Edit Assignment"
                >
                  <FaEdit />
                </Link>
                <button 
                  onClick={() => handleDeleteAssignment(assignment._id)}
                  className="btn-icon btn-danger"
                  title="Delete Assignment"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentList; 