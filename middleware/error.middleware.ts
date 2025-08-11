import { Request, Response, NextFunction } from 'express';
import { CustomError, ErrorResponse, ErrorCode } from '../types/error.types';

/**
 * Error Handling Middleware - Centralized error processing
 * This middleware catches and processes all errors thrown in the application,
 * providing consistent error responses and logging
 */

/**
 * Global error handler middleware
 * Processes all errors and returns standardized error responses
 * @param err - Custom error object containing error details
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (unused in error handlers)
 */
const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // ===== SET DEFAULT ERROR VALUES =====
    // Provide fallback values for missing error properties
    const statusCode = err.status || 500;
    const errorCode = err.errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
    const message = err.message || 'An unexpected error occurred';
    const details = err.details || null;
    const color = err.color || 'red';

    // ===== LOG ERROR FOR DEBUGGING =====
    // Log detailed error information in development environment
    if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${errorCode}: ${message}`);
        console.error(err.stack);
    }

    // ===== CONSTRUCT ERROR RESPONSE =====
    // Create standardized error response object
    const errorResponse: ErrorResponse = {
        success: false,
        status: statusCode,
        errorCode,
        message,
        details,
        color,
        timestamp: new Date().toISOString(),
    };

    // ===== SEND ERROR RESPONSE =====
    // Send error response with appropriate HTTP status code
    res.status(statusCode).json(errorResponse);
};

export default errorHandler;
  