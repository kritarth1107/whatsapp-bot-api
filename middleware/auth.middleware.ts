import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/app.config';
import { CustomError, ErrorCode } from '../types/error.types';
import { usersModel } from '../models/users.model';

/**
 * User Authentication Middleware - Handles user token verification
 * This middleware verifies JWT tokens for user authentication and
 * ensures only authorized users can access protected routes
 */

// Extend Express Request type to include user and admin
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with your User interface when available
            admin?: any; // Replace 'any' with your Admin interface when available
        }
    }
}

/**
 * JWT payload interface for user authentication
 * Contains user-specific data extracted from the JWT token
 */
export interface UserJwtPayload {
    email: string;           // User's email address
    userId: string;          // User's unique identifier
    displayName: string;     // User's display name
    kycID: string;           // User's KYC identification
    flag: string;            // User account status flag
    iat: number;             // Token issued at timestamp
    exp: number;             // Token expiration timestamp
    // Add other JWT payload properties as needed
}

/**
 * Verifies user JWT token and authenticates user requests
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // ===== EXTRACT AUTHORIZATION HEADER =====
        const authHeader = req.headers.authorization;

        // ===== VALIDATE AUTHORIZATION HEADER =====
        // Check if authorization header exists and has Bearer token format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error: CustomError = new Error('No Bearer token provided');
            error.status = 403;
            error.errorCode = ErrorCode.UNAUTHORIZED;
            error.color = 'yellow';
            return next(error);
        }

        // ===== EXTRACT TOKEN =====
        // Extract the token from the Bearer header
        const token = authHeader.split(' ')[1];
        const secret = config.jwt.secret;

        // ===== VALIDATE JWT SECRET =====
        // Ensure JWT secret is configured
        if (!secret) {
            const error: CustomError = new Error('JWT secret not configured');
            error.status = 500;
            error.errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
            error.color = 'red';
            return next(error);
        }

        try {
            // ===== VERIFY JWT TOKEN =====
            // Decode and verify the JWT token using the secret
            const decodedData = jwt.verify(token, secret) as UserJwtPayload;
            
            // ===== VALIDATE USER IN DATABASE =====
            // Check if user exists in database and account is not blocked
            const user = await usersModel.findOne({ userId: decodedData.userId, flag: { $ne: 'BLOCKED' } });
            if(!user) {
                const error: CustomError = new Error('Unauthorized');
                error.status = 401;
                error.errorCode = ErrorCode.UNAUTHORIZED;
                error.color = 'red';
                return next(error);
            }
            
            // ===== ATTACH USER TO REQUEST =====
            // Add user object to request for use in subsequent middleware/routes
            req.user = user;
            next();
        } catch (jwtError) {
            // ===== HANDLE JWT VERIFICATION ERRORS =====
            // Handle invalid or expired tokens
            const error: CustomError = new Error('Invalid or expired token');
            error.status = 403;
            error.errorCode = ErrorCode.UNAUTHORIZED;
            error.color = 'red';
            error.details = jwtError instanceof Error ? jwtError.message : undefined;
            return next(error);
        }
    } catch (error) {
        // ===== HANDLE GENERAL ERRORS =====
        // Handle any other errors that occur during authentication
        const customError: CustomError = new Error('Authentication failed');
        customError.status = 500;
        customError.errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        customError.color = 'red';
        customError.details = error instanceof Error ? error.message : undefined;
        return next(customError);
    }
};

export default verifyToken;
