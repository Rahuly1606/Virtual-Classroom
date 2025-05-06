import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../middleware/errorHandler.js';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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

// Set up storage using CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: (req, file) => {
    const folder = `virtual-classroom/${req.uploadPath || 'misc'}`;
    const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    return {
      folder,
      public_id: uniqueFilename.substring(0, uniqueFilename.lastIndexOf('.')) || uniqueFilename,
      resource_type: 'auto'
    };
  }
});

// Set up multer with Cloudinary storage and file filter
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