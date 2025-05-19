import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import { FaClock, FaCheckCircle, FaHourglassHalf, FaExclamationCircle, FaFilter, FaSortAmountDown, FaSearch, FaCalendarAlt, FaGraduationCap } from 'react-icons/fa';

const StudentAssignmentList = ({ courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

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
          icon: <FaCheckCircle className="text-green-500" size={16} />,
          label: 'Graded',
          class: 'status-graded bg-green-100 border-l-4 border-green-500'
        };
      } else {
        return {
          icon: <FaHourglassHalf className="text-blue-500" size={16} />,
          label: 'Submitted',
          class: 'status-submitted bg-blue-100 border-l-4 border-blue-500'
        };
      }
    } else if (now > deadline) {
      return {
        icon: <FaExclamationCircle className="text-red-500" size={16} />,
        label: 'Missing',
        class: 'status-missing bg-red-100 border-l-4 border-red-500'
      };
    } else {
      return {
        icon: <FaClock className="text-yellow-500" size={16} />,
        label: 'Pending',
        class: 'status-pending bg-yellow-100 border-l-4 border-yellow-500'
      };
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate - now;
    
    if (timeRemaining < 0) {
      return { text: 'Past due', urgent: true };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 7) {
      return { text: `Due in ${days} days`, urgent: false };
    } else if (days > 0) {
      return { 
        text: `${days} day${days !== 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`, 
        urgent: days <= 2
      };
    } else if (hours > 0) {
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      return { 
        text: `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`, 
        urgent: true
      };
    } else {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      return { 
        text: `${minutes} minute${minutes !== 1 ? 's' : ''}`, 
        urgent: true
      };
    }
  };

  const filterAndSortAssignments = () => {
    let result = [...assignments];
    
    // Filter by status
    if (filter !== 'all') {
      result = result.filter(assignment => {
        const status = getAssignmentStatus(assignment).label.toLowerCase();
        return status === filter.toLowerCase();
      });
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(assignment => 
        assignment.title.toLowerCase().includes(term) || 
        assignment.description.toLowerCase().includes(term) ||
        (assignment.course?.name && assignment.course.name.toLowerCase().includes(term))
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'deadline':
        return result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      case 'title':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'course':
        return result.sort((a, b) => {
          const courseA = a.course?.name || '';
          const courseB = b.course?.name || '';
          return courseA.localeCompare(courseB);
        });
      case 'points':
        return result.sort((a, b) => b.totalPoints - a.totalPoints);
      default:
        return result;
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  // Get filtered and sorted assignments
  const filteredAssignments = filterAndSortAssignments();
  
  // Count assignments by status
  const statusCounts = assignments.reduce((counts, assignment) => {
    const status = getAssignmentStatus(assignment).label.toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in-up">
      <div className="flex flex-col mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Assignments</h2>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg py-2 px-4 flex items-center">
            <FaClock className="mr-2 text-blue-500" />
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-semibold">{assignments.length}</div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg py-2 px-4 flex items-center">
            <FaClock className="mr-2 text-yellow-500" />
            <div>
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-xl font-semibold">{statusCounts.pending || 0}</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg py-2 px-4 flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" />
            <div>
              <div className="text-xs text-gray-500">Graded</div>
              <div className="text-xl font-semibold">{statusCounts.graded || 0}</div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg py-2 px-4 flex items-center">
            <FaExclamationCircle className="mr-2 text-red-500" />
            <div>
              <div className="text-xs text-gray-500">Missing</div>
              <div className="text-xl font-semibold">{statusCounts.missing || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="form-select rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="missing">Missing</option>
            </select>
            
            <select
              className="form-select rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="title">Sort by Title</option>
              <option value="course">Sort by Course</option>
              <option value="points">Sort by Points</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <img 
            src="https://illustrations.popsy.co/amber/taking-notes.svg" 
            alt="No assignments" 
            className="w-40 h-40 mx-auto mb-4 opacity-70"
          />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No assignments found</h3>
          <p className="text-gray-500">
            {searchTerm ? 
              'Try adjusting your search or filters' : 
              'You don\'t have any assignments yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const timeInfo = getTimeRemaining(assignment.deadline);
            
            return (
              <div key={assignment._id} className={`rounded-lg overflow-hidden ${status.class} hover:shadow-md transition-shadow`}>
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      {status.icon}
                      <span className="ml-2 font-medium text-sm text-gray-600">{status.label}</span>
                      {assignment.submission?.status === 'graded' && (
                        <div className="ml-auto flex items-center">
                          <FaGraduationCap className="text-indigo-500 mr-1" />
                          <span className="font-semibold">
                            {assignment.submission.grade.points} / {assignment.totalPoints}
                    </span>
                  </div>
                      )}
                </div>
                
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      <Link to={`/assignments/${assignment._id}`} className="hover:text-blue-600 transition-colors">
                        {assignment.title}
                      </Link>
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">{assignment.course?.name || 'Unknown Course'}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(assignment.deadline)}</span>
                    </p>
                    
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {assignment.description}
                    </p>
                  </div>
                  
                  <div className="sm:w-44 flex flex-row sm:flex-col sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center">
                        <FaCalendarAlt className={`mr-1.5 ${timeInfo.urgent ? 'text-red-500' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${timeInfo.urgent ? 'text-red-600' : 'text-gray-700'}`}>
                          {timeInfo.text}
                      </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Points: {assignment.totalPoints}</div>
                </div>
                
                    <div className="sm:self-end flex-shrink-0">
                  <Link 
                    to={`/assignments/${assignment._id}`} 
                        className={`px-4 py-2 rounded-md text-center block w-full 
                          ${status.label === 'Graded' 
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                            : status.label === 'Missing'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'} 
                          transition-colors text-sm font-medium`}
                      >
                        {status.label === 'Pending' ? 'Submit' : 'View'}
                  </Link>
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

export default StudentAssignmentList; 