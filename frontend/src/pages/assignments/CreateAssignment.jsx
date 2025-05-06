import React from 'react';
import CreateAssignmentComponent from '../../components/assignments/CreateAssignment';
import useAuth from '../../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaLightbulb, FaBook } from 'react-icons/fa';

const CreateAssignment = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  if (!isTeacher) {
    return <Navigate to="/assignments" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      {/* Header Section */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link 
              to="/assignments" 
              className="mr-4 p-2 rounded-full bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                <FaBook className="mr-3 text-blue-600 dark:text-blue-400" />
                Create New Assignment
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create a new learning opportunity for your students
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg max-w-xs animate-pulse">
            <div className="flex items-start">
              <FaLightbulb className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Well-structured assignments help students develop critical thinking skills
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <CreateAssignmentComponent />
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment; 