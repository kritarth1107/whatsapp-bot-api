import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * KYC Upload Utility - Handles KYC document uploads with validation and storage
 * This utility configures multer specifically for KYC document uploads (PAN and AADHAR cards)
 * with proper validation, file naming, and storage management
 */

// ==================================================
// Directory Setup
// ==================================================

/**
 * Ensure KYC uploads directory exists
 * Creates the KYC uploads directory if it doesn't exist for document storage
 */
const kycUploadsDir = path.join(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(kycUploadsDir)) {
    fs.mkdirSync(kycUploadsDir, { recursive: true });
}

// ==================================================
// Storage Configuration
// ==================================================

/**
 * Configure multer disk storage for KYC documents
 * Sets up file storage on disk with custom destination and filename generation
 */
const storage = multer.diskStorage({
    /**
     * Set destination directory for uploaded KYC files
     * @param req - Express request object
     * @param file - Uploaded file object
     * @param cb - Callback function
     */
    destination: (req, file, cb) => {
        cb(null, kycUploadsDir);
    },
    
    /**
     * Generate unique filename for uploaded KYC files
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
 * File filter function to validate uploaded KYC files
 * Checks both MIME types and file extensions for security
 * @param req - Express request object
 * @param file - Uploaded file object
 * @param cb - Multer callback function
 */
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // ===== DEFINE ALLOWED FILE TYPES =====
    // List of allowed MIME types for KYC documents
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf'
    ];
    
    // ===== DEFINE ALLOWED FILE EXTENSIONS =====
    // List of allowed file extensions for additional validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // ===== VALIDATE FILE TYPE AND EXTENSION =====
    // Check both MIME type and file extension for security
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error(`Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed for KYC documents. Received: ${file.mimetype}`));
    }
};

// ==================================================
// Multer Configuration
// ==================================================

/**
 * Configure multer with storage, validation, and limits for KYC documents
 * Sets up the main multer instance with all necessary configurations
 */
const upload = multer({
    storage: storage,                    // Use disk storage with custom configuration
    fileFilter: fileFilter,              // Apply file type and extension validation
    limits: {
        fileSize: 5 * 1024 * 1024,      // 5MB file size limit for KYC documents
        files: 2                         // Maximum 2 files per request (PAN and AADHAR)
    }
});

// ==================================================
// KYC Upload Middleware Functions
// ==================================================

/**
 * KYC documents upload middleware
 * Handles upload of PAN_CARD and AADHAR_CARD files
 */
export const uploadKycDocuments = upload.fields([
    { name: 'PAN_CARD', maxCount: 1 },
    { name: 'AADHAR_CARD', maxCount: 1 }
]);

export default upload; 