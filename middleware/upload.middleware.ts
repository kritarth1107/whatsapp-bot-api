import multer from 'multer';
import path from 'path';

/**
 * File Upload Middleware - Handles file uploads with validation and error handling
 * This middleware configures multer for secure file uploads with size limits,
 * file type validation, and comprehensive error handling
 */

// ==================================================
// Multer Configuration
// ==================================================

/**
 * Configure multer storage to use memory storage
 * Files are stored in memory for processing before being saved to disk or cloud storage
 */
const storage = multer.memoryStorage();

/**
 * File filter function to validate uploaded files
 * Checks file MIME types and allows only specific file formats
 * @param req - Express request object
 * @param file - Uploaded file object
 * @param cb - Multer callback function
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // ===== DEFINE ALLOWED FILE TYPES =====
    // List of MIME types that are allowed for upload
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
    
    // ===== VALIDATE FILE TYPE =====
    // Check if the uploaded file's MIME type is in the allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only PDF, PNG, JPG, and JPEG files are allowed.'));
    }
};

/**
 * Configure multer with storage, file filter, and limits
 * Sets up the main multer instance with all necessary configurations
 */
const upload = multer({
    storage: storage,                    // Use memory storage
    fileFilter: fileFilter,              // Apply file type validation
    limits: {
        fileSize: 10 * 1024 * 1024,     // 10MB file size limit
        files: 5                         // Maximum 5 files per request
    }
});

// ==================================================
// Upload Middleware Functions
// ==================================================

/**
 * Single file upload middleware
 * Handles upload of a single file with the field name 'file'
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware
 * Handles upload of up to 5 files with the field name 'files'
 */
export const uploadMultiple = upload.array('files', 5);

// ==================================================
// Error Handling
// ==================================================

/**
 * Error handling middleware for multer upload errors
 * Processes various multer errors and returns appropriate error responses
 * @param error - Multer error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
    // ===== HANDLE MULTER SPECIFIC ERRORS =====
    if (error instanceof multer.MulterError) {
        // Handle file size limit exceeded
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }
        
        // Handle file count limit exceeded
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 5 files allowed.'
            });
        }
        
        // Handle unexpected file field
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }
    
    // ===== HANDLE FILE TYPE VALIDATION ERRORS =====
    // Handle errors from our custom file filter
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    // ===== PASS OTHER ERRORS TO NEXT MIDDLEWARE =====
    // Let other error handlers process non-multer errors
    next(error);
};

export default upload; 