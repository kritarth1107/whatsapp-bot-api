// config/app.config.ts
import dotenv from "dotenv";
import { AppConfig } from "../types/app.config.types";

/**
 * Application Configuration - Centralized configuration management
 * This file manages all application configuration including server settings,
 * database connections, security parameters, and environment-specific settings
 */

// ==================================================
// Environment Configuration
// ==================================================

/**
 * Load environment variables from .env file
 * This must be called before accessing any environment variables
 */
dotenv.config();

/**
 * Main application configuration object
 * Contains all configuration settings organized by category
 */
const config: AppConfig = {
    // ==================================================
    // Server Configuration
    // ==================================================
    server: {
        port: Number(process.env.PORT) || 3000,                    // Server port (default: 3000)
        env: process.env.NODE_ENV || "development",                // Environment (dev/prod/test)
        apiVersion: process.env.API_VERSION || "v1.0.0",           // API version for versioning
        corsOrigins: process.env.CORS_ORIGINS?.split(",") || [     // Allowed CORS origins
            "http://localhost:3000",
        ],
        liveFrontendUrl: process.env.LIVE_FRONTEND_URL || "http://localhost:3000", // Live frontend URL
    },

    // ==================================================
    // JWT Configuration
    // ==================================================
    jwt: {
        secret: process.env.JWT_SECRET,                            // Secret key for JWT signing
        validity: process.env.JWT_VALIDITY || "24h",               // JWT token validity period
    },

    // ==================================================
    // Database Configuration
    // ==================================================
    database: {
        uri: process.env.MONGODB_URI || "mongodb://localhost:27017/your_db", // MongoDB connection URI
        options: {
            useNewUrlParser: true,                                 // Use new URL parser
            useUnifiedTopology: true,                              // Use unified topology engine
        },
    },

    // ==================================================
    // Security Configuration
    // ==================================================
    security: {
        bcryptSaltRounds: 10,                                      // Number of salt rounds for bcrypt
        rateLimiting: {
            windowMs: 15 * 60 * 1000,                             // Rate limiting window (15 minutes)
            max: 100,                                              // Max requests per window per IP
        },
    },

    // ==================================================
    // Logging Configuration
    // ==================================================
    logging: {
        level: process.env.LOG_LEVEL || "info",                    // Logging level (error, warn, info, debug)
        filename: "app.log",                                       // Log file name
    },

    // ==================================================
    // Encryption Configuration
    // ==================================================
    encryption: {
        secretKey: process.env.AES_SECRET,                         // AES encryption secret key
        ivLength: 16,                                              // Initialization vector length
    },

    // ==================================================
    // Whatsapp Configuration
    // ==================================================
    whatsapp: {
        accessToken: process.env.ACCESS_TOKEN || "N/A",                     // Whatsapp access token
        phoneNumberId: process.env.PHONE_NUMBER_ID || "N/A",                // Whatsapp phone number ID
        businessAccountId: process.env.BUSINESS_ACCOUNT_ID || "N/A",        // Whatsapp business account ID
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "N/A",                     // Whatsapp verify token
    },
};

// ==================================================
// Configuration Validation
// ==================================================

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 * This ensures the application has all necessary configuration
 */
export const validateConfig = (): void => {
    // ===== DEFINE REQUIRED ENVIRONMENT VARIABLES =====
    // List of environment variables that must be set for the application to function
    const requiredEnvVars = [
        "API_VERSION",          // Required for JWT token signing
        "NODE_ENV",         // Required for database connection
        "LOG_LEVEL",          // Required for encryption/decryption
        "PORT",                // Required for server port
        "MONGODB_URI",            // Required for environment-specific behavior
        "JWT_SECRET",        // Required for CORS configuration
        "AES_SECRET",           // Required for logging configuration
        "ACCESS_TOKEN",           // Required for logging configuration
        "PHONE_NUMBER_ID",           // Required for logging configuration
        "BUSINESS_ACCOUNT_ID",           // Required for logging configuration
    ];

    // ===== CHECK FOR MISSING VARIABLES =====
    // Filter out any environment variables that are not set
    const missingEnvVars = requiredEnvVars.filter(
        (envVar) => !process.env[envVar],
    );

    // ===== THROW ERROR IF VARIABLES ARE MISSING =====
    // If any required variables are missing, throw an error with details
    if (missingEnvVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingEnvVars.join(", ")}`,
        );
    }
    
    // ===== LOG SUCCESS =====
    // Log successful configuration validation
    console.log('✅ Configuration validated successfully');
};

// ==================================================
// Export Configuration
// ==================================================

/**
 * Export frozen configuration object
 * Object.freeze prevents accidental modification of configuration
 * This ensures configuration integrity throughout the application
 */
export default Object.freeze(config);