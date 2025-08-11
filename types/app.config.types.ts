/**
 * Application Configuration Types - TypeScript interfaces for application configuration
 * This file defines the TypeScript interfaces for all configuration settings
 * including server, database, security, and other application parameters
 */

/**
 * Server configuration interface
 * Defines settings for the Express server including port, environment, and CORS
 */
export interface ServerConfig {
    port: number;                    // Server port number
    env: string;                     // Environment (development/production/test)
    apiVersion: string;              // API version string
    corsOrigins: string[];           // Array of allowed CORS origins
    liveFrontendUrl: string;         // Live frontend URL
}

/**
 * JWT configuration interface
 * Defines settings for JSON Web Token authentication
 */
export interface JWTConfig {
    secret: string | undefined;      // JWT signing secret key
    validity: string;                // Token validity period (e.g., "24h")
}

/**
 * Database configuration interface
 * Defines MongoDB connection settings and options
 */
export interface DatabaseConfig {
    uri: string;                     // MongoDB connection URI
    options: {
        useNewUrlParser: boolean;    // Use new URL parser (deprecated but kept for compatibility)
        useUnifiedTopology: boolean; // Use unified topology engine
    };
}


/**
 * Security configuration interface
 * Defines security-related settings including password hashing and rate limiting
 */
export interface SecurityConfig {
    bcryptSaltRounds: number;        // Number of salt rounds for bcrypt password hashing
    rateLimiting: {
        windowMs: number;            // Rate limiting window in milliseconds
        max: number;                 // Maximum requests per window per IP
    };
}

/**
 * Logging configuration interface
 * Defines logging settings and file configuration
 */
export interface LoggingConfig {
    level: string;                   // Logging level (error, warn, info, debug)
    filename: string;                // Log file name
}

/**
 * Whatsapp configuration interface
 * Defines Whatsapp settings and file configuration
 */
export interface WhatsappConfig {
    accessToken: string;                   // Whatsapp access token
    phoneNumberId: string;                // Whatsapp phone number ID
    businessAccountId: string;            // Whatsapp business account ID
    verifyToken:string;                   // Whatsapp verify token
}

/**
 * Encryption configuration interface
 * Defines AES encryption settings for sensitive data
 */
export interface EncryptionConfig {
    secretKey: string | undefined;   // AES encryption secret key
    ivLength: number;                // Initialization vector length
}



/**
 * Main application configuration interface
 * Combines all configuration interfaces into a single configuration object
 * This is the root interface used by the application configuration
 */
export interface AppConfig {
    server: ServerConfig;            // Server configuration settings
    jwt: JWTConfig;                  // JWT authentication settings
    database: DatabaseConfig;        // Database connection settings
    security: SecurityConfig;        // Security and authentication settings
    logging: LoggingConfig;          // Logging configuration
    encryption: EncryptionConfig;    // Encryption settings
    whatsapp: WhatsappConfig;        // Whatsapp settings
}