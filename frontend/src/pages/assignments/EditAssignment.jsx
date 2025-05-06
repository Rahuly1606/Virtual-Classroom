import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import assignmentService from '../../services/assignmentService';
import FileUpload from '../../components/common/FileUpload';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaPaperclip, FaSave, FaTimes, FaTrash } from 'react-icons/fa';

const EditAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(data);
        
        // Set form values
        setValue('title', data.title);
        setValue('description', data.description);
        setValue('deadline', new Date(data.deadline).toISOString().slice(0, 16));
        setValue('totalPoints', data.totalPoints);
        
        // Handle existing files
        if (data.files && data.files.length > 0) {
          setExistingFiles(data.files);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignment');
        setLoading(false);
        console.error(err);
      }
    };

    fetchAssignment();
  }, [assignmentId, setValue]);

  // Check if user is authorized (is a teacher and created this assignment)
  const isAuthorized = () => {
    if (!user || !assignment) return false;
    return user.role === 'teacher' && assignment.teacher?._id === user.id;
  };

  const handleFileChange = (uploadedFiles) => {
    setFiles(uploadedFiles);
  };

  const handleDeleteExistingFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await assignmentService.deleteAssignmentFile(assignmentId, fileId);
        setExistingFiles(existingFiles.filter(file => file.cloudinaryId !== fileId));
        toast.success('File deleted successfully');
      } catch (err) {
        toast.error('Failed to delete file');
        console.error(err);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      // Add files to the form data
      const assignmentData = {
        ...data,
        files
      };

      await assignmentService.updateAssignment(assignmentId, assignmentData);
      toast.success('Assignment updated successfully');
      navigate(`/assignments/${assignmentId}`);
    } catch (err) {
      setError('Failed to update assignment. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );
  if (!isAuthorized()) return <Navigate to="/assignments" />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="create-assignment-container">
        <div className="form-header">
          <h2 className="text-2xl font-bold">Edit Assignment</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-icon btn-secondary"
            aria-label="Cancel"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="assignment-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Assignment Title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="error-message">{errors.title.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Detailed instructions for the assignment"
              rows="5"
              {...register('description', { required: 'Description is required' })}
            ></textarea>
            {errors.description && <p className="error-message">{errors.description.message}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deadline" className="form-label flex items-center gap-2">
                <FaCalendarAlt /> Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="deadline"
                className={`form-input ${errors.deadline ? 'input-error' : ''}`}
                {...register('deadline', { required: 'Deadline is required' })}
              />
              {errors.deadline && <p className="error-message">{errors.deadline.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="totalPoints" className="form-label">
                Total Points
              </label>
              <input
                type="number"
                id="totalPoints"
                className="form-input"
                min="1"
                max="1000"
                {...register('totalPoints', { 
                  min: { value: 1, message: 'Points must be at least 1' },
                  max: { value: 1000, message: 'Points cannot exceed 1000' }
                })}
              />
              {errors.totalPoints && <p className="error-message">{errors.totalPoints.message}</p>}
            </div>
          </div>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="form-group">
              <label className="form-label">Current Files</label>
              <div className="existing-files">
                {existingFiles.map((file, index) => (
                  <div key={index} className="existing-file">
                    <div className="file-info">
                      <FaFileAlt className="file-icon" />
                      <span className="file-name">{file.originalName}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteExistingFile(file.cloudinaryId)}
                      aria-label="Delete file"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Files */}
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <FaPaperclip /> Add Files
            </label>
            <FileUpload 
              onFileChange={handleFileChange} 
              multiple={true}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <p className="text-sm text-gray-600 mt-1">
              Supported formats: PDF, Word, Excel, PowerPoint, Text, and Images
            </p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" /> Updating...
                </>
              ) : (
                <>
                  <FaSave /> Update Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssignment; 