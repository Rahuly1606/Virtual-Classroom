import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import { FaEdit, FaTrash, FaEye, FaPlus, FaFilter, FaCalendarAlt, FaCheck, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TeacherAssignmentList = ({ courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

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

  const filterAssignments = () => {
    const now = new Date();
    
    if (filter === 'active') {
      return assignments.filter(assignment => new Date(assignment.deadline) > now);
    } else if (filter === 'past') {
      return assignments.filter(assignment => new Date(assignment.deadline) < now);
    }
    return assignments;
  };

  const sortAssignments = (filteredAssignments) => {
    switch (sortBy) {
      case 'deadline':
        return [...filteredAssignments].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      case 'title':
        return [...filteredAssignments].sort((a, b) => a.title.localeCompare(b.title));
      case 'submissions':
        return [...filteredAssignments].sort((a, b) => (b.submissions?.length || 0) - (a.submissions?.length || 0));
      default:
        return filteredAssignments;
    }
  };
  
  const getDeadlineStatus = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { 
        icon: <FaClock className="text-red-500" />, 
        text: 'Past due', 
        class: 'bg-red-100 text-red-800'
      };
    } else if (daysRemaining <= 3) {
      return { 
        icon: <FaClock className="text-amber-500" />, 
        text: `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`, 
        class: 'bg-amber-100 text-amber-800'
      };
    } else {
      return { 
        icon: <FaCalendarAlt className="text-green-500" />, 
        text: `Due in ${daysRemaining} days`, 
        class: 'bg-green-100 text-green-800'
      };
    }
  };

  const getCourseName = (course) => {
    if (!course) return 'Unknown Course';
    return course.name || course.title || course.courseName || 'Unknown Course';
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  const filteredAssignments = filterAssignments();
  const sortedAssignments = sortAssignments(filteredAssignments);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Assignments Dashboard
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {assignments.length}
          </span>
        </h2>
        
        <div className="flex gap-4 flex-col sm:flex-row w-full md:w-auto">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 text-sm">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-all ${filter === 'active' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <FaClock className="inline mr-1" />
              Active
            </button>
            <button 
              onClick={() => setFilter('past')}
              className={`px-3 py-1.5 rounded-md transition-all ${filter === 'past' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <FaCheck className="inline mr-1" />
              Past
            </button>
          </div>
          
          <select
            className="form-select rounded-md border border-gray-300 py-1.5 px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline">Sort by: Deadline</option>
            <option value="title">Sort by: Title</option>
            <option value="submissions">Sort by: Submissions</option>
          </select>
          
          <Link 
            to={courseId ? `/courses/${courseId}/assignments/new` : "/assignments/new"} 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-4 rounded-md transition-all font-medium text-sm"
          >
            <FaPlus size={14} /> Create Assignment
          </Link>
        </div>
      </div>

      {sortedAssignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <img 
            src="https://illustrations.popsy.co/amber/student-taking-notes.svg" 
            alt="No assignments" 
            className="w-40 h-40 mx-auto mb-4 opacity-80"
          />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No assignments yet</h3>
          <p className="text-gray-500 mb-4">Create your first assignment to get started</p>
          <Link 
            to={courseId ? `/courses/${courseId}/assignments/new` : "/assignments/new"}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium gap-1"
          >
            <FaPlus size={12} /> Create an Assignment
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedAssignments.map((assignment) => {
            const deadlineStatus = getDeadlineStatus(assignment.deadline);
            const submissionRate = assignment.submissions 
              ? Math.round((assignment.submissions.length / (assignment.totalEnrollments || 1)) * 100)
              : 0;
            
            return (
              <div key={assignment._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-5 flex flex-col h-full">
                  <div className="border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                        <Link to={`/assignments/${assignment._id}`}>
                          {assignment.title}
                        </Link>
                      </h3>
                      <span className={`ml-2 whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${deadlineStatus.class}`}>
                        {deadlineStatus.icon} {deadlineStatus.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {getCourseName(assignment.course)}
                    </p>
                  </div>
                  
                  <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                    {assignment.description || 'No description provided.'}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-500">Points</div>
                        <div className="text-sm font-medium">{assignment.totalPoints}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-500">Submissions</div>
                        <div className="text-sm font-medium">
                          {assignment.submissions?.length || 0}
                          <span className="text-xs text-gray-400 ml-1">
                            ({submissionRate}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Link 
                        to={`/assignments/${assignment._id}/submissions`} 
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FaEye className="mr-1.5" size={14} />
                        View Submissions
                      </Link>
                      <div className="flex gap-2">
                        <Link 
                          to={`/assignments/${assignment._id}/edit`}
                          className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Assignment"
                        >
                          <FaEdit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Assignment"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentList; 