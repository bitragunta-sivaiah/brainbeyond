// This file provides a middleware for handling file uploads using multer.
// It includes configuration for disk storage, file filtering, and error handling.

import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Define the base directory for all uploads.
const uploadDir = 'uploads';

// Ensure the base upload directory exists, creating it if it doesn't.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer's disk storage engine.
const storage = multer.diskStorage({
  // Set the destination directory for the uploaded files.
  destination: (req, file, cb) => {
    let folder = 'general';
    
    // Determine the specific sub-folder based on the file's field name.
    if (file.fieldname === 'avatar') folder = 'avatars';
    if (file.fieldname === 'coverPhoto') folder = 'coverPhoto';
    if (file.fieldname === 'thumbnail') folder = 'thumbnails';
    if (file.fieldname === 'video') folder = 'videos';
    if (file.fieldname === 'resource') folder = 'resources';
    if (file.fieldname === 'document') folder = 'documents';
    
    // Construct the full destination path.
    const dest = `${uploadDir}/${folder}`;
    
    // Ensure the specific sub-folder exists.
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Pass the destination path to the callback.
    cb(null, dest);
  },
  // Define the filename for the uploaded file.
  filename: (req, file, cb) => {
    // Get the original file extension.
    const ext = path.extname(file.originalname);
    // Create a unique filename using UUID and the original extension.
    const filename = `${uuidv4()}${ext}`;
    // Pass the unique filename to the callback.
    cb(null, filename);
  }
});

// Define a file filter function to validate file types.
const fileFilter = (req, file, cb) => {
  // Define allowed file types using a regex.
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|mov|avi|mp3|zip/;
  
  // Test the file extension against the regex.
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Test the file's MIME type against the regex.
  const mimetype = filetypes.test(file.mimetype);
  
  // If both the extension and MIME type are valid, accept the file.
  if (extname && mimetype) {
    return cb(null, true);
  }
  
  // If not valid, reject the file with an error message.
  cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
};

// Initialize the multer instance with the storage, filter, and file size limits.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware for handling file upload errors that may occur.
const handleUploadErrors = (err, req, res, next) => {
  // Check if the error is a known Multer error.
  if (err instanceof multer.MulterError) {
    // Handle file size limit error specifically.
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 100MB allowed.' });
    }
    // Handle other Multer errors.
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Handle any other general errors.
    return res.status(400).json({ error: err.message });
  }
  // If no error, proceed to the next middleware.
  next();
};

// Export the upload instance and the error handler middleware.
export { upload, handleUploadErrors };
