/**
 * Prepay24 Backend API - Main Application Entry Point
 * 
 * This file serves as the main entry point for the Prepay24 backend API application.
 * It manages the server lifecycle including initialization, startup, graceful shutdown,
 * and process handling. The file orchestrates the connection between the server setup,
 * database configuration, and application configuration.
 * 
 * Features:
 * - Server lifecycle management
 * - Database connection handling
 * - Graceful shutdown procedures
 * - Process signal handling
 * - Configuration validation
 * - Error handling and logging
 */

// ==================================================
// Core Dependencies
// ==================================================

// Server setup and configuration
import { ServerSetup } from './server';
// Database connection management
import { connectDB, closeDB } from "./config/database.config";
// Application configuration and validation
import config, { validateConfig } from "./config/app.config";

// ==================================================
// Server Manager Class
// ==================================================

/**
 * ServerManager class handles the complete lifecycle management
 * of the Prepay24 backend API server, including initialization,
 * startup, graceful shutdown, and process handling.
 * 
 * This class provides:
 * - Server instance management
 * - Process signal handling (SIGTERM, SIGINT)
 * - Graceful shutdown procedures
 * - Database connection lifecycle
 * - Error handling and logging
 * - Configuration validation
 */
class ServerManager {
  // ===== PRIVATE PROPERTIES =====
  
  /**
   * Server setup instance
   * Handles Express server configuration and middleware setup
   */
  private server: ServerSetup;
  
  /**
   * Shutdown flag to prevent multiple shutdown attempts
   * Ensures graceful shutdown happens only once
   */
  private isShuttingDown: boolean = false;

  /**
   * Constructor initializes the server manager
   * Creates a new ServerSetup instance for the application
   */
  constructor() {
    // ===== INITIALIZE SERVER INSTANCE =====
    // Create new server setup instance with all configurations
    this.server = new ServerSetup();
  }

  /**
   * Sets up process handlers for graceful shutdown and error handling
   * Handles various process signals and uncaught exceptions
   * 
   * Process Handlers:
   * - SIGTERM: Termination signal (e.g., from Docker, Kubernetes)
   * - SIGINT: Interrupt signal (e.g., Ctrl+C)
   * - uncaughtException: Unhandled synchronous errors
   * - unhandledRejection: Unhandled promise rejections
   */
  private setupProcessHandlers(): void {
    // ===== GRACEFUL SHUTDOWN FUNCTION =====
    // Centralized shutdown logic to ensure consistent cleanup
    const shutdown = async () => {
      // ===== PREVENT MULTIPLE SHUTDOWNS =====
      // Check if shutdown is already in progress
      if (this.isShuttingDown) {
        console.log('🔄 Shutdown already in progress, skipping...');
        return;
      }
      
      // ===== SET SHUTDOWN FLAG =====
      // Mark shutdown as in progress to prevent duplicate calls
      this.isShuttingDown = true;
      
      // ===== INITIATE SHUTDOWN PROCESS =====
      console.log('🛑 Initiating graceful shutdown...');
      
      try {
        // ===== CLOSE DATABASE CONNECTION =====
        // Properly close MongoDB connection to prevent data corruption
        console.log('📡 Closing MongoDB connection...');
        await closeDB();
        
        // ===== EXIT SUCCESSFULLY =====
        // Exit with success code (0) after clean shutdown
        console.log('✅ Graceful shutdown completed successfully');
        process.exit(0);
        
      } catch (error) {
        // ===== HANDLE SHUTDOWN ERRORS =====
        // Log any errors during shutdown process
        console.error('❌ Error during graceful shutdown:', error);
        
        // ===== FORCE EXIT =====
        // Exit with error code (1) if shutdown fails
        process.exit(1);
      }
    };

    // ===== PROCESS SIGNAL HANDLERS =====
    // Handle termination signals from the operating system
    
    // SIGTERM: Termination signal (graceful shutdown request)
    process.on('SIGTERM', () => {
      console.log('📡 Received SIGTERM signal');
      shutdown();
    });
    
    // SIGINT: Interrupt signal (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('📡 Received SIGINT signal');
      shutdown();
    });
    
    // ===== ERROR HANDLERS =====
    // Handle uncaught errors and unhandled promise rejections
    
    // Uncaught Exception: Synchronous errors that weren't caught
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('🛑 Application will shutdown due to uncaught exception');
      shutdown();
    });
    
    // Unhandled Rejection: Promise rejections that weren't handled
    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled Rejection:', error);
      console.error('🛑 Application will shutdown due to unhandled rejection');
      shutdown();
    });
  }

  /**
   * Starts the Prepay24 backend API server
   * This is the main entry point for the application startup process
   * 
   * Startup Process:
   * 1. Validate application configuration
   * 2. Setup process handlers for graceful shutdown
   * 3. Connect to MongoDB database
   * 4. Start the Express server
   * 5. Handle any startup errors
   */
  public async start(): Promise<void> {
    try {
      // ===== CONFIGURATION VALIDATION =====
      // Validate all required configuration settings before startup
      console.log('🔧 Validating application configuration...');
      validateConfig();
      console.log('✅ Configuration validation completed');

      // ===== PROCESS HANDLER SETUP =====
      // Setup handlers for graceful shutdown and error handling
      console.log('🛡️ Setting up process handlers...');
      this.setupProcessHandlers();
      console.log('✅ Process handlers configured');

      // ===== DATABASE CONNECTION =====
      // Establish connection to MongoDB database
      console.log('📡 Connecting to MongoDB...');
      await connectDB();
      console.log('✅ MongoDB connection established');

      // ===== SERVER STARTUP =====
      // Start the Express server with all middleware and routes
      console.log('🚀 Starting Prepay24 backend API server...');
      await this.server.start();
      console.log('✅ Server startup completed successfully');

    } catch (error) {
      // ===== STARTUP ERROR HANDLING =====
      // Handle any errors during the startup process
      console.error('❌ Failed to start Prepay24 backend API server:', 
        error instanceof Error ? error.message : String(error));
      
      // ===== ERROR DETAILS =====
      // Log additional error details for debugging
      if (error instanceof Error) {
        console.error('📋 Error Stack:', error.stack);
      }
      
      // ===== FORCE EXIT =====
      // Exit with error code if startup fails
      console.error('🛑 Application startup failed, exiting...');
      process.exit(1);
    }
  }
}

// ==================================================
// Application Initialization
// ==================================================

/**
 * Create server manager instance
 * This instance will handle the complete server lifecycle
 */
const serverManager = new ServerManager();

/**
 * Start the Prepay24 backend API application
 * This is the main entry point that begins the server startup process
 */
console.log('🚀 Initializing Prepay24 Backend API Application...');
serverManager.start();

// ==================================================
// Export Server Manager
// ==================================================

/**
 * Export server manager for potential external usage
 * Allows other modules to access the server manager instance
 */
export default serverManager;