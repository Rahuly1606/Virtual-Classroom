import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BiArrowBack } from 'react-icons/bi';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import AttendanceStatsTable from '../../components/attendance/AttendanceStatsTable';
import attendanceService from '../../services/attendanceService';
import courseService from '../../services/courseService';

const AttendanceStats = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch course details
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);
        
        // Fetch attendance stats for the course
        const statsData = await attendanceService.getCourseAttendanceStats(courseId);
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
        setError(err.message || 'Failed to load attendance statistics');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to={`/courses/${courseId}`}>
          <Button variant="outline" size="sm" className="flex items-center">
            <BiArrowBack className="mr-2" /> Back to Course
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {course ? `${course.title} - Attendance Statistics` : 'Attendance Statistics'}
        </h1>
        {course && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View attendance records for all students enrolled in this course
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="p-4 text-red-700 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && stats.length === 0 && (
        <Card>
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2 font-semibold">No attendance data available</p>
            <p>No students have attendance records for this course yet.</p>
          </div>
        </Card>
      )}

      {/* Stats Table */}
      {!loading && !error && stats.length > 0 && (
        <Card>
          <div className="p-6">
            <AttendanceStatsTable stats={stats} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendanceStats; 