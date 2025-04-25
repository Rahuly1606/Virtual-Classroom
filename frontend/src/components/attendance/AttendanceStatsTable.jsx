import React, { useState } from 'react';
import { BiSortAlt2, BiCheck, BiX, BiTime, BiSearch } from 'react-icons/bi';
import Input from '../ui/Input';
import Card from '../ui/Card';

const AttendanceStatsTable = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  if (!stats || stats.length === 0) {
    return null; // Parent component now handles the empty state
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = [...stats].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.student.name.localeCompare(b.student.name);
    } else if (sortField === 'present') {
      comparison = a.stats.present - b.stats.present;
    } else if (sortField === 'absent') {
      comparison = a.stats.absent - b.stats.absent;
    } else if (sortField === 'late') {
      comparison = a.stats.late - b.stats.late;
    } else if (sortField === 'percentage') {
      comparison = a.stats.percentage - b.stats.percentage;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Filter data based on search term
  const filteredData = sortedData.filter(item => 
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get badge color based on percentage
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="w-64">
          <Input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<BiSearch className="h-5 w-5" />}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Student</span>
                  <BiSortAlt2 className="h-4 w-4" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('present')}
              >
                <div className="flex items-center space-x-1">
                  <span>Present</span>
                  <BiSortAlt2 className="h-4 w-4" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('absent')}
              >
                <div className="flex items-center space-x-1">
                  <span>Absent</span>
                  <BiSortAlt2 className="h-4 w-4" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('late')}
              >
                <div className="flex items-center space-x-1">
                  <span>Late</span>
                  <BiSortAlt2 className="h-4 w-4" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('percentage')}
              >
                <div className="flex items-center space-x-1">
                  <span>Attendance %</span>
                  <BiSortAlt2 className="h-4 w-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {filteredData.map((item) => (
              <tr key={item.student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.student.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BiCheck className="h-5 w-5 text-green-500 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">{item.stats.present}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BiX className="h-5 w-5 text-red-500 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">{item.stats.absent}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BiTime className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">{item.stats.late}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getPercentageColor(item.stats.percentage)}`}>
                    {item.stats.percentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Total students: {stats.length} | Showing: {filteredData.length}
      </div>
    </div>
  );
};

export default AttendanceStatsTable; 