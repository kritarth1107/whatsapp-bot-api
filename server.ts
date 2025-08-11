/**
 * Prepay24 Backend API Server - Main Application Entry Point
 * 
 * This file sets up the Express server for the Prepay24 backend API with all necessary middleware,
 * routes, WebSocket support, and error handling. It provides a comprehensive server setup
 * including authentication, rate limiting, CORS, logging, and real-time communication.
 * 
 * Features:
 * - Express server with TypeScript support
 * - Socket.IO for real-time communication
 * - Comprehensive middleware stack (security, logging, parsing)
 * - Route management with authentication
 * - Health check and monitoring endpoints
 * - Error handling and graceful shutdown
 */

// ==================================================
// Core Dependencies
// ==================================================

// Express and HTTP server setup
import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Database connection
import mongoose from 'mongoose';

// ==================================================
// Security and Middleware Dependencies
// ==================================================

// Security middleware for enhanced protection
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// ==================================================
// System Utilities
// ==================================================

// Operating system utilities for metrics
import os from 'os';

// ==================================================
// Application Configuration
// ==================================================

// Main application configuration
import config from "./config/app.config";

// ==================================================
// Custom Middleware
// ==================================================

// Error handling middleware
import errorHandler from './middleware/error.middleware';
// Authentication middleware for user routes
import verifyToken from './middleware/auth.middleware';

// ==================================================
// Type Definitions
// ==================================================

// Server-related TypeScript interfaces
import { ServerMetrics, HealthCheckResponse, RouteInfo } from './types/server.types';

// ==================================================
// Route Imports
// ==================================================

// Authentication routes (login, MFA, password management)
// import { authRouter } from './routes/auth.routes';

// ==================================================
// Server Setup Class
// ==================================================

/**
 * ServerSetup class handles the initialization and configuration
 * of the Express server for the Prepay24 backend API, including middleware,
 * routes, WebSocket support, and error handling.
 * 
 * This class provides a complete server setup with:
 * - Security middleware (helmet, CORS, rate limiting)
 * - Request parsing and logging
 * - Route management with authentication
 * - WebSocket support for real-time features
 * - Health monitoring and metrics
 */
export class ServerSetup {
  // ===== PUBLIC PROPERTIES =====
  
  /**
   * Express application instance
   * Used for middleware setup and route handling
   */
  public app: Express;
  
  // ===== PRIVATE PROPERTIES =====
  
  /**
   * HTTP server instance created from Express app
   * Required for Socket.IO integration
   */
  private httpServer: any;
  
  /**
   * Socket.IO server instance for real-time communication
   * Handles WebSocket connections and events
   */
  private io: Server;
  
  /**
   * Server port number from configuration
   * Defaults to 3000 if not specified in environment
   */
  private readonly PORT: number = config.server.port;

  /**
   * Constructor initializes the Express app, HTTP server, and Socket.IO
   * Sets up the basic server infrastructure with proper configuration
   */
  constructor() {
    // ===== CREATE EXPRESS APPLICATION =====
    // Initialize Express application with default settings
    this.app = express();
    
    // ===== CREATE HTTP SERVER =====
    // Create HTTP server from Express app for Socket.IO integration
    this.httpServer = createServer(this.app);
    
    // ===== INITIALIZE SOCKET.IO =====
    // Set up Socket.IO with CORS configuration for real-time communication
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.server.corsOrigins,        // Allowed origins for WebSocket connections
        methods: ["GET", "POST", "PUT"],          // Allowed HTTP methods
        allowedHeaders: ["Content-Type", "socket-id", "Authorization"], // Allowed headers
      },
    });
  }

  /**
   * Gets the port number for the server
   * @returns The configured port number
   */
  public getPort(): number {
    return this.PORT;
  }

  // ==================================================
  // Middleware Setup
  // ==================================================

  /**
   * Sets up all middleware for the Express application
   * Order is critical: security first, then parsing, then routes
   * 
   * Middleware Stack:
   * 1. Trust proxy (for secure connections)
   * 2. Security headers (helmet)
   * 3. CORS configuration
   * 4. Rate limiting (production only)
   * 5. Logging (development only)
   * 6. Body parsing
   */
  private setupMiddleware(): void {
    // ===== TRUST PROXY =====
    // Trust first proxy for secure connections (important for rate limiting)
    this.app.set('trust proxy', 1);
    
    // ===== SECURITY MIDDLEWARE =====
    // Helmet: Set security headers for protection against common vulnerabilities
    this.app.use(helmet());
    
    // CORS: Configure Cross-Origin Resource Sharing
    this.app.use(cors({ 
      origin: config.server.corsOrigins,  // Allowed origins from configuration
      credentials: true                   // Allow credentials (cookies, authorization headers)
    }));

    // ===== RATE LIMITING =====
    // Apply rate limiting only in production environment
    if (process.env.NODE_ENV === 'production') {
      const limiter = rateLimit({
        windowMs: config.security.rateLimiting.windowMs,  // Time window (15 minutes)
        max: config.security.rateLimiting.max             // Max requests per window per IP
      });
      this.app.use(limiter);
    }

    // ===== LOGGING MIDDLEWARE =====
    // Morgan: HTTP request logging (development environment only)
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));  // Colored development logging
    }

    // ===== BODY PARSER MIDDLEWARE =====
    // Parse JSON payloads with size limit
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded payloads with size limit
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ===== STATIC FILE SERVING =====
    // Serve uploaded files from the uploads directory under admin routes
    this.app.use(`/api/${config.server.apiVersion}/kingdom/uploads`, express.static('uploads'));
  }

  // ==================================================
  // WebSocket Setup
  // ==================================================

  /**
   * Configures Socket.IO for real-time communication
   * Sets up connection handling, event listeners, and disconnection logic
   * 
   * WebSocket Features:
   * - Real-time notifications
   * - Live payment status updates
   * - Admin dashboard updates
   * - User activity monitoring
   */
  private setupWebSocket(): void {
    // ===== CONNECTION EVENT HANDLER =====
    // Handle new WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(`✅ New WebSocket Connection Established: ${socket.id}`);

      // ===== DISCONNECTION EVENT HANDLER =====
      // Handle WebSocket disconnections
      socket.on('disconnect', () => {
        console.log(`❌ WebSocket Connection Terminated: ${socket.id}`);
      });
      
      // ===== CUSTOM EVENT HANDLERS =====
      // Add custom event handlers for specific functionality
      // Example: payment status updates, notifications, etc.
    });
  }

  // ==================================================
  // Route Setup
  // ==================================================

  /**
   * Sets up all routes for the Prepay24 backend API
   * Organizes routes by authentication requirements and functionality
   * 
   * Route Structure:
   * - Public routes (no authentication required)
   * - Protected routes (user authentication required)
   * - Admin routes (admin authentication required)
   * - 404 handler for unmatched routes
   */
  private setupRoutes(): void {
    // ===== API VERSION PREFIX =====
    // Use versioned API endpoints for better API management
    const apiPrefix = `api/${config.server.apiVersion}`;

    // ===== PUBLIC ROUTES =====
    // Routes that don't require authentication
    
    // Health check endpoint for monitoring
    this.app.get('/health', this.healthCheck.bind(this));
    
    // Route listing endpoint for documentation
    this.app.get('/list', this.listRoutes.bind(this));


    // ===== 404 HANDLER =====
    // Handle unmatched routes with proper error response
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        status: 404,
        error: `Endpoint ${req.method} ${req.path} does not exist`
      });
    });
  }

  // ==================================================
  // Utility Methods
  // ==================================================

  /**
   * Measures database latency by pinging the MongoDB database
   * Used for health check monitoring and performance tracking
   * 
   * @returns Promise with latency in milliseconds or null if not connected
   */
  private async measureDbLatency(): Promise<number | null> {
    // ===== CHECK DATABASE CONNECTION =====
    // Ensure database is connected before measuring latency
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return null;  // Database not connected
    }
    
    // ===== MEASURE LATENCY =====
    // Ping database and measure response time
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    return Date.now() - start;  // Return latency in milliseconds
  }

  /**
   * Health check endpoint handler
   * Provides comprehensive server status, database connection, and system metrics
   * 
   * Response includes:
   * - Server status and uptime
   * - Memory and CPU usage
   * - Database connection status and latency
   * - Node.js and application version information
   */
  private async healthCheck(req: Request, res: Response): Promise<void> {
    // ===== DATABASE STATUS =====
    // Check MongoDB connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // ===== SERVER METRICS =====
    // Collect system performance metrics
    const sm: ServerMetrics = {
      uptime: process.uptime(),                                    // Server uptime in seconds
      memoryUsage: process.memoryUsage().rss / (1024 * 1024),     // Memory usage in MB
      cpuUsage: os.loadavg(),                                      // CPU load averages
    };

    // ===== BUILD HEALTH CHECK RESPONSE =====
    // Construct comprehensive health check response
    const response: HealthCheckResponse = {
      success: true,
      message: 'Prepay24 Backend API Server is running',
      environment: config.server.env,
      timestamp: new Date().toISOString(),
      version: config.server.apiVersion,
      server: sm,
      database: {
        database: "MongoDB",
        dbVersion: mongoose.version,
        status: dbStatus,
        latency: await this.measureDbLatency(),  // Database response latency
      },
      node: {
        version: process.version,                                    // Node.js version
        npm_package_version: process.env.npm_package_version || 'unknown', // Package version
      }
    };

    // ===== SEND RESPONSE =====
    // Return health check data as JSON
    res.json(response);
  }

  /**
   * Lists all available API routes
   * Useful for documentation, debugging, and API discovery
   * 
   * Scans the Express router stack to extract route information
   * Returns method, path, and full route details
   */
  private listRoutes(req: Request, res: Response): void {
    const routes: RouteInfo[] = [];

    // ===== SCAN ROUTER STACK =====
    // Iterate through Express router middleware stack
    this.app._router.stack.forEach((middleware: any) => {
      // ===== DIRECT ROUTES =====
      // Handle direct route definitions
      if (middleware.route) {
        const { path } = middleware.route;
        const method = Object.keys(middleware.route.methods)[0].toUpperCase();
        routes.push({ method, path });
      } 
      // ===== ROUTER MIDDLEWARE =====
      // Handle router middleware (grouped routes)
      else if (middleware.name === 'router') {
        // Extract base path from router regex
        const basePath = middleware.regexp
          .toString()
          .replace(/^\/\^\\/, '')
          .replace(/\\\/\?\(\?=\\\/\|\$\)\/\$/, '')
          .replace(/\\/g, '')
          .replace(/\?.*/, '');

        // Scan routes within the router
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const { path } = handler.route;
            const method = Object.keys(handler.route.methods)[0].toUpperCase();
            const fullPath = `${basePath}${path}`.replace('//', '/');
            routes.push({ method, path: fullPath });
          }
        });
      }
    });

    // ===== SEND ROUTE LIST =====
    // Return formatted route information
    res.status(200).json({
      success: true,
      message: 'Available Prepay24 Backend API Routes',
      routes,
      totalRoutes: routes.length
    });
  }

  // ==================================================
  // Server Startup
  // ==================================================

  /**
   * Starts the Prepay24 backend API server with all configured middleware and routes
   * This is the main entry point for the server initialization
   * 
   * Startup Process:
   * 1. Setup middleware stack
   * 2. Configure WebSocket support
   * 3. Setup all routes
   * 4. Configure error handling
   * 5. Start HTTP server
   * 6. Display startup information
   */
  public async start(): Promise<void> {
    try {
      // ===== SETUP SERVER COMPONENTS =====
      // Initialize all server components in proper order
      this.setupMiddleware();    // Security, parsing, logging middleware
      this.setupWebSocket();     // Real-time communication setup
      this.setupRoutes();        // API route configuration

      // ===== ERROR HANDLER MIDDLEWARE =====
      // Global error handler (must be last in middleware stack)
      this.app.use(errorHandler);

      // ===== START HTTP SERVER =====
      // Bind to all network interfaces and start listening
      this.httpServer.listen(this.PORT, '0.0.0.0', () => {
        // ===== DISPLAY STARTUP INFORMATION =====
        // Show comprehensive server startup details
        console.log(`
==================================================
🚀 Prepay24 BACKEND API SERVER STARTED SUCCESSFULLY
==================================================
📡 Environment:  ${config.server.env}
🔌 Port:         ${this.PORT}
🌐 API Version:  ${config.server.apiVersion}
📊 Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
🕒 Uptime:       ${process.uptime().toFixed(2)} seconds
==================================================
        `);
      });
    } catch (error) {
      // ===== ERROR HANDLING =====
      // Log startup errors and exit gracefully
      console.error('❌ Failed to start Prepay24 Backend API server:', 
        error instanceof Error ? error.message : String(error));
      process.exit(1);  // Exit with error code
    }
  }
}

// ==================================================
// Server Instance Creation
// ==================================================

/**
 * Create server instance for export
 * This instance will be used to start the server from the main application
 */
const server = new ServerSetup();

// ==================================================
// Export Server Instance
// ==================================================

export default server;
