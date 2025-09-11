// uploadAvatar.js
import multer from 'multer';
import path from 'path';

// Define the storage configuration for avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save avatars to a specific 'avatars' folder inside 'uploads'
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    // Use the user's ID to make the avatar filename unique and easy to find
    // E.g., 'avatar-60d0fe4f7d4e5f0015b6b123.jpg'
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + req.user.id + ext);
  }
});

// Configure Multer for a single file upload named 'avatar'
const uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit avatar size to 2MB
  fileFilter: function (req, file, cb) {
    // Only allow image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars!'));
    }
  }
}).single('avatar'); // 'avatar' should match the input field name in the form

export default uploadAvatar;