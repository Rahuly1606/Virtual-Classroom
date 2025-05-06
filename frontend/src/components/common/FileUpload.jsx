import React, { useState, useRef } from 'react';
import { FaUpload, FaFileAlt, FaTrash } from 'react-icons/fa';

const FileUpload = ({ onFileChange, multiple = false, accept = '*' }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prevFiles => {
        const newFiles = multiple ? [...prevFiles, ...files] : [...files];
        // Notify parent component
        onFileChange(newFiles);
        return newFiles;
      });
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prevFiles => {
        const newFiles = multiple ? [...prevFiles, ...files] : [...files];
        // Notify parent component
        onFileChange(newFiles);
        return newFiles;
      });
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      updatedFiles.splice(index, 1);
      // Notify parent component
      onFileChange(updatedFiles);
      return updatedFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`dropzone ${dragActive ? 'active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="file-input"
          multiple={multiple}
          accept={accept}
          ref={fileInputRef}
          hidden
        />
        
        <div className="dropzone-content">
          <FaUpload className="upload-icon" />
          <p className="upload-text">
            <span className="upload-bold">Click to upload</span> or drag and drop
          </p>
          <p className="upload-hint">
            {multiple ? 'Upload one or more files' : 'Upload a file'}
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4 className="files-heading">Selected Files</h4>
          <ul className="file-list">
            {selectedFiles.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <FaFileAlt className="file-icon" />
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  aria-label="Remove file"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 