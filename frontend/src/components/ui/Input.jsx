import React, { forwardRef } from 'react'

const Input = forwardRef(({
  id,
  label,
  type = 'text',
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  fullWidth = true,
  icon,
  ...props
}, ref) => {
  const baseInputClasses = `
    block px-4 py-2.5 text-gray-900 bg-gray-50 border rounded-lg focus:ring-2 
    dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
  `
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
    : 'border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-500'
  
  const widthClasses = fullWidth ? 'w-full' : ''
  
  const iconClasses = icon ? 'pl-10' : ''
  
  const inputClasses = `
    ${baseInputClasses}
    ${errorClasses}
    ${widthClasses}
    ${iconClasses}
    ${className}
  `

  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={id}
          type={type}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${id}-helper-text` : undefined}
          {...props}
        />
      </div>
      
      {(error || helperText) && (
        <p 
          id={`${id}-helper-text`} 
          className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input 