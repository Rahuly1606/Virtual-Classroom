import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatDate } from '../../utils/dateUtils';
import Spinner from '../ui/Spinner';
import { FaTimes, FaSave, FaDownload } from 'react-icons/fa';

const GradeSubmissionModal = ({ submission, assignment, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      points: submission.grade?.points || 0,
      feedback: submission.grade?.feedback || ''
    }
  });

  useEffect(() => {
    // Set default values if submission is already graded
    if (submission.grade) {
      setValue('points', submission.grade.points);
      setValue('feedback', submission.grade.feedback);
    }
  }, [submission, setValue]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    await onSubmit(submission._id, data);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="text-xl font-bold">Grade Submission</h2>
          <button 
            onClick={onClose} 
            className="btn-icon"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="submission-details mb-4 p-3 bg-gray-50 rounded">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">Assignment: {assignment.title}</h3>
                <p className="text-sm text-gray-600">
                  Student: {submission.student.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">Submitted: {formatDate(submission.submittedAt)}</p>
                {submission.isLate && (
                  <span className="badge badge-warning">Late</span>
                )}
              </div>
            </div>
          </div>

          <div className="submission-files mb-4">
            <h3 className="font-medium mb-2">Submitted Files:</h3>
            <div className="files-list">
              {submission.files.map((file, index) => (
                <a 
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link-block"
                >
                  <FaDownload className="mr-2" />
                  <span className="file-name">{file.originalName}</span>
                </a>
              ))}
            </div>
          </div>

          {submission.comment && (
            <div className="student-comment mb-4">
              <h3 className="font-medium mb-2">Student Comment:</h3>
              <div className="comment-box">
                {submission.comment}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="form-group mb-4">
              <label htmlFor="points" className="form-label">
                Points <span className="text-red-500">*</span>
              </label>
              <div className="points-input-container">
                <input
                  type="number"
                  id="points"
                  className={`form-input ${errors.points ? 'input-error' : ''}`}
                  min="0"
                  max={assignment.totalPoints}
                  step="0.5"
                  {...register('points', { 
                    required: 'Points are required',
                    min: { 
                      value: 0, 
                      message: `Points cannot be negative` 
                    },
                    max: { 
                      value: assignment.totalPoints, 
                      message: `Points cannot exceed ${assignment.totalPoints}` 
                    }
                  })}
                />
                <span className="points-total">/ {assignment.totalPoints}</span>
              </div>
              {errors.points && <p className="error-message">{errors.points.message}</p>}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="feedback" className="form-label">
                Feedback
              </label>
              <textarea
                id="feedback"
                className="form-textarea"
                rows="4"
                placeholder="Provide feedback to the student..."
                {...register('feedback')}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Grade
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissionModal; 