import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  BiHome, 
  BiBook, 
  BiVideo, 
  BiTask, 
  BiCalendarCheck, 
  BiUser 
} from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, isTeacher } = useAuth()

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <BiHome className="w-5 h-5" />
    },
    {
      name: 'Courses',
      path: '/courses',
      icon: <BiBook className="w-5 h-5" />
    },
    {
      name: 'Sessions',
      path: '/sessions',
      icon: <BiVideo className="w-5 h-5" />
    },
    {
      name: 'Assignments',
      path: '/assignments',
      icon: <BiTask className="w-5 h-5" />
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: <BiCalendarCheck className="w-5 h-5" />,
      roles: ['teacher', 'student']
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <BiUser className="w-5 h-5" />
    }
  ]

  // Filter items based on user role if needed
  const filteredItems = navigationItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  )

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 transform bg-white shadow-lg transition-transform duration-300 dark:bg-gray-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Virtual Classroom
          </h1>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                {user?.name?.[0] || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'Student'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {filteredItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                  end
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-3 right-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close sidebar</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar 