import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import SubmissionListComponent from '../../components/assignments/SubmissionList';

const SubmissionList = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  if (!isTeacher) {
    return <Navigate to="/assignments" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <SubmissionListComponent />
    </div>
  );
};

export default SubmissionList; 