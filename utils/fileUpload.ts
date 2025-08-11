import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * File Upload Utility - Handles secure file uploads with validation and storage
 * This utility configures multer for disk-based file uploads with UUID-based naming,
 * file type validation, and size limits for secure file handling
 */

// ==================================================
// Directory Setup
// ==================================================

/**
 * Ensure uploads directory exists
 * Creates the uploads directory if it doesn't exist for file storage
 */
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==================================================
// Storage Configuration
// ==================================================

/**
 * Configure multer disk storage
 * Sets up file storage on disk with custom destination and filename generation
 */
const storage = multer.diskStorage({
    /**
     * Set destination directory for uploaded files
     * @param req - Express request object
     * @param file - Uploaded file object
     * @param cb - Callback function
     */
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    
    /**
     * Generate unique filename for uploaded files
     * Uses UUID to prevent filename conflicts and ensure uniqueness
     * @param req - Express request object
     * @param file - Uploaded file object
     * @param cb - Callback function
     */
    filename: (req, file, cb) => {
        // ===== GENERATE UNIQUE FILENAME =====
        // Create UUID for unique file identification
        const uuid = uuidv4();
        const ext = path.extname(file.originalname);
        
        // Format: fieldname-uuid.extension
        cb(null, file.fieldname + '-' + uuid + ext);
    }
});

// ==================================================
// File Validation
// ==================================================

/**
 * File filter function to validate uploaded files
 * Checks both MIME types and file extensions for security
 * @param req - Express request object
 * @param file - Uploaded file object
 * @param cb - Multer callback function
 */
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // ===== DEFINE ALLOWED FILE TYPES =====
    // List of allowed MIME types for upload
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.ms-excel.template.macroEnabled.12',
        'application/vnd.ms-excel.addin.macroEnabled.12',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.ms-excel.template.macroEnabled.12',
    ];
    
    // ===== DEFINE ALLOWED FILE EXTENSIONS =====
    // List of allowed file extensions for additional validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // ===== VALIDATE FILE TYPE AND EXTENSION =====
    // Check both MIME type and file extension for security
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error(`Invalid file type. Only JPEG, JPG, PNG, PDF, XLSX, and XLS files are allowed. Received: ${file.mimetype}`));
    }
};

// ==================================================
// Multer Configuration
// ==================================================

/**
 * Configure multer with storage, validation, and limits
 * Sets up the main multer instance with all necessary configurations
 */
const upload = multer({
    storage: storage,                    // Use disk storage with custom configuration
    fileFilter: fileFilter,              // Apply file type and extension validation
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

/**
 * Custom upload function for multiple files with configurable parameters
 * @param fieldName - Name of the file field in the form (default: 'files')
 * @param maxCount - Maximum number of files allowed (default: 5)
 * @returns Multer middleware function
 */
export const uploadFiles = (fieldName: string = 'files', maxCount: number = 5) => {
    return upload.array(fieldName, maxCount);
};

export default upload; 