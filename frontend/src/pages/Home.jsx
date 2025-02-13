import React from "react";

const Home = () => {
  return (
    <div className="bg-gradient-to-r from-blue-100 via-grey-500 to-white-500 min-h-screen p-8">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold text-yellow-700 mb-4">
          Welcome to the Virtual Classroom
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Join your classes, submit assignments, and track your progress seamlessly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">Live Classes</h2>
            <p className="text-gray-700">
              Attend live sessions with your teachers and classmates in real-time.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">Assignments</h2>
            <p className="text-gray-700">
              Submit your assignments online and get feedback from your instructors.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">Attendance</h2>
            <p className="text-gray-700">
              Track your attendance and stay updated with your class schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;