import React, { forwardRef } from 'react'

const Select = forwardRef(({
  id,
  label,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  fullWidth = true,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const baseSelectClasses = `
    block px-4 py-2.5 text-gray-900 bg-gray-50 border rounded-lg focus:ring-2 
    dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
  `
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
    : 'border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-500'
  
  const widthClasses = fullWidth ? 'w-full' : ''
  
  const selectClasses = `
    ${baseSelectClasses}
    ${errorClasses}
    ${widthClasses}
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
      
      <select
        ref={ref}
        id={id}
        required={required}
        disabled={disabled}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText ? `${id}-helper-text` : undefined}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
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

Select.displayName = 'Select'

export default Select 