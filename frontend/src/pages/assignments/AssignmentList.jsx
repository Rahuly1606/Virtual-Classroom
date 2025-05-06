import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import TeacherAssignmentList from '../../components/assignments/TeacherAssignmentList';
import StudentAssignmentList from '../../components/assignments/StudentAssignmentList';
import { FaBook, FaCheckCircle, FaClipboardList, FaGraduationCap } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AssignmentList = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 md:mr-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center">
                <FaClipboardList className="mr-4 text-yellow-300" />
                {isTeacher ? 'Manage Assignments' : 'Your Assignments'}
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                {isTeacher 
                  ? 'Create, track, and evaluate assignments. Provide valuable learning experiences to your students.' 
                  : 'View and submit your assigned work. Stay on top of deadlines and track your progress.'}
              </p>
            </div>
            
            {isTeacher && (
              <Link 
                to="/assignments/new" 
                className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow-md hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 flex items-center"
              >
                <FaBook className="mr-2" /> Create New Assignment
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {isTeacher && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'all' 
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="flex items-center justify-center">
                  <FaClipboardList className={`mr-2 ${activeTab === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  All Assignments
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'pending' 
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="flex items-center justify-center">
                  <FaGraduationCap className={`mr-2 ${activeTab === 'pending' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  Needs Grading
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'completed' 
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="flex items-center justify-center">
                  <FaCheckCircle className={`mr-2 ${activeTab === 'completed' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  Completed
                </span>
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search assignments..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {isTeacher ? (
              <TeacherAssignmentList filter={activeTab} />
            ) : (
              <StudentAssignmentList />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentList; 