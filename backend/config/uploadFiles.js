// uploadfiles.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up the storage destination and filename logic
const storage = multer.diskStorage({
  // The directory where uploaded files will be stored.
  // We use path.join to create a reliable path.
  destination: function (req, file, cb) {
    // Make sure you have an 'uploads' directory in your project root.
    cb(null, path.join(__dirname, 'uploads/'));
  },
  // The filename to be saved on the server.
  filename: function (req, file, cb) {
    // Create a unique filename by appending a timestamp to the original filename.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Multer to handle file uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: function (req, file, cb) {
    // Check if the file is an image or video
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'));
    }
  }
}).array('files', 10); // 'files' is the field name, 10 is the maximum number of files

export default upload;