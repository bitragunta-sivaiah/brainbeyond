import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary'; // Use v2 import for clarity
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary with your environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for in-memory storage.
// This is necessary for Cloudinary's upload method using data URIs.
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB (adjust as needed)
    },
    fileFilter: (req, file, cb) => {
        // Only allow images, videos, and PDF documents.
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, videos, and PDF documents are allowed.'), false);
        }
    }
});

const uploadRouter = Router();

// --- Helper function to upload to Cloudinary from a buffer ---
// This function determines the resource_type based on the file's mimetype
const uploadToCloudinary = async (file) => {
    // Determine resource type and folder based on file mimetype
    let resourceType;
    let folderName;
    if (file.mimetype.startsWith('video')) {
        resourceType = 'video';
        folderName = 'videos';
    } else if (file.mimetype.startsWith('image')) {
        resourceType = 'image';
        folderName = 'images';
    } else if (file.mimetype === 'application/pdf') {
        resourceType = 'raw'; // Cloudinary treats PDFs as 'raw' resources
        folderName = 'documents';
    } else {
        // Fallback for any other file types, though the Multer filter should prevent this.
        resourceType = 'raw';
        folderName = 'others';
    }

    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    try {
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: resourceType,
            folder: folderName, // Use the dynamically determined folder name
        });
        return result;
    } catch (err) {
        console.error(`Cloudinary upload failed for file: ${file.originalname}`, err);
        throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
};

// --- Single Upload Route ---
// 'media' is the field name that the client must use in the form data
uploadRouter.post('/upload', upload.single('media'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            // This case might also be caught by Multer's error handler,
            // but it's a clear check for when no file is present.
            return res.status(400).json({
                message: 'No file provided. Please upload a file with the field name "media".',
                error: true,
                success: false
            });
        }

        const uploadResult = await uploadToCloudinary(file);

        if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
            return res.status(500).json({
                message: 'Failed to get complete upload information from Cloudinary.',
                error: true,
                success: false
            });
        }

        return res.json({
            message: 'Upload successful',
            data: {
                fileName: file.originalname,
                fileUrl: uploadResult.secure_url,
                fileType: file.mimetype,
                fileSize: file.size,
                publicId: uploadResult.public_id
            },
            success: true,
            error: false
        });
    } catch (error) {
        console.error('Error during single file upload:', error);
        let errorMessage = 'An unexpected error occurred during upload.';

        // Handle specific Multer errors
        if (error instanceof multer.MulterError) {
            errorMessage = error.code === 'LIMIT_FILE_SIZE'
                ? `File size exceeds the allowed limit (max ${upload.limits.fileSize / (1024 * 1024)}MB).`
                : `File upload error: ${error.message}`;
        } else if (error.message.startsWith('Invalid file type')) {
            errorMessage = error.message;
        } else if (error.message.startsWith('Cloudinary upload failed')) {
            // The specific error from the Cloudinary helper function
            errorMessage = error.message;
        }

        return res.status(500).json({
            message: errorMessage,
            error: true,
            success: false
        });
    }
});


// --- Bulk Upload Route ---
// 'media' is the field name, 10 is the maximum number of files allowed
uploadRouter.post('/bulk-upload', upload.array('media', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                message: 'No files provided for upload. Please upload one or more files with the field name "media".',
                error: true,
                success: false
            });
        }

        const uploadPromises = files.map(file => uploadToCloudinary(file));
        const uploadResults = await Promise.allSettled(uploadPromises);

        const successfulUploads = [];
        const failedUploads = [];

        uploadResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value && result.value.secure_url && result.value.public_id) {
                successfulUploads.push({
                    fileName: files[index].originalname,
                    fileUrl: result.value.secure_url,
                    fileType: files[index].mimetype,
                    fileSize: files[index].size,
                    publicId: result.value.public_id
                });
            } else {
                failedUploads.push({
                    fileName: files[index].originalname,
                    error: result.reason?.message || 'Unknown upload error.'
                });
            }
        });

        if (successfulUploads.length > 0) {
            return res.json({
                message: `${successfulUploads.length} file(s) uploaded successfully.`,
                data: successfulUploads,
                failed: failedUploads.length > 0 ? failedUploads : undefined,
                success: true,
                error: false
            });
        } else {
            return res.status(500).json({
                message: 'No files were successfully uploaded.',
                failed: failedUploads,
                success: false,
                error: true
            });
        }
    } catch (error) {
        console.error('Error during bulk file upload:', error);
        let errorMessage = 'An unexpected error occurred during bulk upload.';

        if (error instanceof multer.MulterError) {
            errorMessage = error.code === 'LIMIT_FILE_SIZE'
                ? `One or more files exceeded the allowed limit (max ${upload.limits.fileSize / (1024 * 1024)}MB).`
                : `File upload error: ${error.message}`;
        }

        return res.status(500).json({
            message: errorMessage,
            error: true,
            success: false
        });
    }
});


// --- Delete Route ---
// Requires the public_id of the asset to be deleted from Cloudinary.
uploadRouter.delete('/delete/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;

        // NOTE: IMPORTANT SECURITY CHECK
        // You MUST implement authorization here. Before allowing a deletion,
        // you should verify if the user making the request is authorized
        // to delete this specific publicId. This is a critical step
        // to prevent unauthorized data removal.

        if (!publicId) {
            return res.status(400).json({
                message: 'Public ID is required for deletion.',
                error: true,
                success: false
            });
        }

        const deleteResult = await cloudinary.uploader.destroy(publicId);

        if (deleteResult.result === 'ok') {
            return res.json({
                message: 'File deleted successfully',
                data: deleteResult,
                success: true,
                error: false
            });
        } else {
            return res.status(404).json({
                message: deleteResult.result === 'not found' ? 'File not found on Cloudinary.' : `Cloudinary deletion failed: ${deleteResult.result}`,
                data: deleteResult,
                error: true,
                success: false
            });
        }
    } catch (error) {
        console.error('Error during file deletion:', error);
        return res.status(500).json({
            message: 'An unexpected error occurred during deletion.',
            error: true,
            success: false
        });
    }
});

export default uploadRouter;