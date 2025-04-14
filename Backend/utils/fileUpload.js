import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../middleware/errorHandler.js';

// Check if uploads directory exists, if not create it
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Define storage for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(uploadsDir, req.uploadPath || '');
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueFileName);
  },
});

// File filter to check file types
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = req.allowedFileTypes || [
    'image/jpeg', 
    'image/png', 
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`, 400), false);
  }
};

// Set up multer with storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Middleware to process upload path
export const setUploadPath = (path) => {
  return (req, res, next) => {
    req.uploadPath = path;
    next();
  };
};

// Middleware to set allowed file types
export const setAllowedFileTypes = (types) => {
  return (req, res, next) => {
    req.allowedFileTypes = types;
    next();
  };
};

export default upload; 