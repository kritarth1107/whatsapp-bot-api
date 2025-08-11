import express, { Router } from "express";
import { webHookVerify, getMessageHook } from "../controller/main.controller";


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
 * @route   GET /api/main/hook
 * @desc    Authentication hook for webhook
 * @access  Public
 */
router.get("/hook", webHookVerify);


/**
 * @route   POST /api/main/hook
 * @desc    Receive message from whatsapp
 * @access  Public
 */
router.post("/hook", getMessageHook);


// ==================================================
// Exports
// ==================================================

export { router as mainRouter };
