import React from 'react'

const Card = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  clickable = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm'
  
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    primary: 'bg-primary-50 dark:bg-primary-900',
    secondary: 'bg-secondary-50 dark:bg-secondary-900',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-glass',
    outline: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
  }
  
  const hoverClasses = hover 
    ? 'transition-shadow duration-200 hover:shadow-md' 
    : ''
  
  const clickableClasses = clickable 
    ? 'cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700' 
    : ''
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// Card subcomponents
Card.Header = ({ children, className = '', ...props }) => (
  <div
    className={`border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
)

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`p-4 text-gray-800 dark:text-gray-200 ${className}`} {...props}>
    {children}
  </div>
)

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
)

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
    {children}
  </h3>
)

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`} {...props}>
    {children}
  </p>
)

Card.Image = ({ src, alt = '', className = '', ...props }) => (
  <img src={src} alt={alt} className={`w-full ${className}`} {...props} />
)

export default Card 