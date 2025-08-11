import express, { Router } from "express";
import { webHookVerify } from "../controller/main.controller";


/**
 * Main Routes
 * 
 * Defines routes for facebook/whatsapp webhooks
 */

// ==================================================
// Route Configuration
// ==================================================

const router: Router = express.Router();

// ==================================================
// Route Definitions
// ==================================================

/**
 * @route   GET /api/auth/hook
 * @desc    Authentication hook for user verification
 * @access  Public
 */
router.get("/hook", webHookVerify);


// ==================================================
// Exports
// ==================================================

export { router as mainRouter };
