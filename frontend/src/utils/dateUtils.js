/**
 * Format a date to display in a user-friendly format
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return 'No date';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleString('en-US', options);
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare with current time
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInMs = dateObj - now;
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  } else if (diffInDays < 0) {
    const absDiffInDays = Math.abs(diffInDays);
    return `${absDiffInDays} day${absDiffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
  } else if (diffInHours < 0) {
    const absDiffInHours = Math.abs(diffInHours);
    return `${absDiffInHours} hour${absDiffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInMins > 0) {
    return `in ${diffInMins} minute${diffInMins !== 1 ? 's' : ''}`;
  } else if (diffInMins < 0) {
    const absDiffInMins = Math.abs(diffInMins);
    return `${absDiffInMins} minute${absDiffInMins !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}; 