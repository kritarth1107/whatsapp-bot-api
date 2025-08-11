/**
 * Server Types - TypeScript interfaces for server-related functionality
 * This file defines TypeScript interfaces for server metrics, health checks,
 * route information, and server instance management
 */

import { Express } from 'express';
import { Server } from 'socket.io';

/**
 * Server metrics interface
 * Defines performance metrics and system information for server monitoring
 * Used for health checks and performance monitoring
 */
export interface ServerMetrics {
    uptime: number;                  // Server uptime in milliseconds
    memoryUsage: number;             // Current memory usage in bytes
    cpuUsage: number[];              // CPU usage percentages for each core
}

/**
 * Health check response interface
 * Defines the structure for server health check responses
 * Provides comprehensive system status information
 */
export interface HealthCheckResponse {
    success: boolean;                // Overall health check status
    message: string;                 // Health check result message
    environment: string;             // Current environment (development/production)
    timestamp: string;               // ISO timestamp of health check
    version: string;                 // Application version
    server: ServerMetrics;           // Server performance metrics
    database: {
        database: string;            // Database name
        dbVersion: string;           // Database version
        status: string;              // Database connection status
        latency: number | null;      // Database response latency in milliseconds
    }
    node: {
        version: string;             // Node.js version
        npm_package_version: string; // NPM package version
    }
}

/**
 * Route information interface
 * Defines structure for API route metadata
 * Used for route documentation and API discovery
 */
export interface RouteInfo {
    method: string;                  // HTTP method (GET, POST, PUT, DELETE)
    path: string;                    // API endpoint path
}

/**
 * Server instance interface
 * Defines the complete server setup including Express app, HTTP server, and Socket.IO
 * Used for server initialization and management
 */
export interface ServerInstance {
    app: Express;                    // Express application instance
    httpServer: any;                 // HTTP server instance
    io: Server;                      // Socket.IO server instance
}