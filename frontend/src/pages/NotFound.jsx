import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-8 text-center">
        <h1 className="mb-4 text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
        <h2 className="mb-6 text-3xl font-semibold text-gray-900 dark:text-white">Page Not Found</h2>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button to="/" variant="primary" size="lg">
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default NotFound 