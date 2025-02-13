import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-black-500 to-green-500 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          Virtual Classroom
        </Link>
        <div className="space-x-4">
          <Link to="/" className="text-white hover:text-indigo-200">
            Home
          </Link>
          <Link to="/login" className="text-white hover:text-indigo-200">
            Login
          </Link>
          <Link to="/signup" className="text-white hover:text-indigo-200">
            Signup
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;