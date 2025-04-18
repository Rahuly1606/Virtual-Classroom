import React from 'react'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'

const Button = ({
  children,
  type = 'button',
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  to,
  icon,
  fullWidth = false,
  rounded = false,
  ...props
}) => {
  const baseClasses = 'font-medium transition-colors duration-200 flex items-center justify-center gap-2'
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg'
  }
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-4 focus:ring-secondary-300 dark:focus:ring-secondary-800',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800',
    info: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-800'
  }
  
  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variants[variant]}
    ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    ${className}
  `

  // If it's a link button
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {icon && <span>{icon}</span>}
        {children}
      </Link>
    )
  }

  // Regular button
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  )
}

export default Button 