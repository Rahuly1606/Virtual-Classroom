import React from "react";

const Parental = () => {
  return (
    <div className="bg-gradient-to-r from-yellow-100 via-gray-500 to-white-500 min-h-screen p-8">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">
          Parental Information
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Stay informed about your child's progress and activities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Progress Reports</h2>
            <p className="text-gray-700">
              View detailed progress reports of your child's performance.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Attendance</h2>
            <p className="text-gray-700">
              Monitor your child's attendance and ensure regularity.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Communication</h2>
            <p className="text-gray-700">
              Communicate with teachers and stay updated with school events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parental;
