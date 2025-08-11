/**
 * Response Types - Standardized API response interfaces
 * This file defines TypeScript interfaces for consistent API response formats
 * used across all endpoints in the application
 */

/**
 * Standard API response interface
 * Defines the structure for all successful API responses
 * Ensures consistency in response format across all endpoints
 */
export interface ResponseType {
    success: boolean;                // Indicates if the request was successful
    status: number;                  // HTTP status code
    message: string;                 // Human-readable response message
    data?: any;                      // Response data payload (optional)
    error?: string;                  // Error message (optional, used for partial failures)
}
  