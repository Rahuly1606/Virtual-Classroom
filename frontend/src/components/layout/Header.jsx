import React from 'react'
import { BiMenu, BiSun, BiMoon, BiLogOut } from 'react-icons/bi'
import Button from '../ui/Button'
import useAuth from '../../hooks/useAuth'

const Header = ({ toggleSidebar, toggleDarkMode, isDarkMode }) => {
  const { logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 lg:hidden"
              onClick={toggleSidebar}
            >
              <BiMenu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </button>
          </div>

          {/* Right side - User settings */}
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              type="button"
              className="flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <BiSun className="h-5 w-5" />
              ) : (
                <BiMoon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </button>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              icon={<BiLogOut className="h-5 w-5" />}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 