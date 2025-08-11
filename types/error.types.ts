/**
 * Error Types - Custom error interfaces and standardized error handling
 * This file defines TypeScript interfaces for custom error handling,
 * standardized error responses, and common error codes used throughout the application
 */

/**
 * Custom error interface that extends the base Error type
 * Used for standardized error handling across the application
 * Provides additional properties for HTTP status codes, error codes, and details
 */
export interface CustomError extends Error {
    status?: number;                 // HTTP status code for the error
    errorCode?: string;              // Application-specific error code
    details?: any;                   // Additional error details or context
    color?: string;                  // Color code for error display (frontend)
}

/**
 * Standard error response format
 * Defines the structure for all error responses returned by the API
 * Ensures consistency in error handling across all endpoints
 */
export interface ErrorResponse {
    success: false;                  // Always false for error responses
    status: number;                  // HTTP status code
    errorCode: string;               // Application-specific error code
    message: string;                 // Human-readable error message
    details: any | null;             // Additional error details or null
    color: string;                   // Color code for error display
    timestamp: string;               // ISO timestamp of when error occurred
}

/**
 * Common error codes used throughout the application
 * Provides standardized error codes for consistent error handling
 * Each code represents a specific type of error that can occur
 */
export enum ErrorCode {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',     // Server-side errors (500)
    BAD_REQUEST = 'BAD_REQUEST',                         // Invalid request data (400)
    UNAUTHORIZED = 'UNAUTHORIZED',                       // Authentication required (401)
    FORBIDDEN = 'FORBIDDEN',                             // Access denied (403)
    NOT_FOUND = 'NOT_FOUND',                            // Resource not found (404)
    VALIDATION_ERROR = 'VALIDATION_ERROR',               // Data validation failed (400)
    DATABASE_ERROR = 'DATABASE_ERROR',                   // Database operation failed (500)
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',         // Too many requests (429)
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'          // Service temporarily unavailable (503)
}