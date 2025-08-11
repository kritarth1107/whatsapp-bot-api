import { Request, Response, NextFunction } from "express";
import config from "../config/app.config";
// ==================================================
// Main Controller Functions
// ==================================================

/**
 * Authentication hook middleware
 * Verifies user credentials and handles login flow with MFA support
 * @param req - Express request object containing email and password
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const webHookVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { "hub.mode":hub_mode, "hub.challenge":hub_challange, "hub.verify_token":hub_verify_token } = req.query;

        const WHATSAPP_TOKEN = config.whatsapp.verifyToken;
        if(hub_verify_token !== WHATSAPP_TOKEN){
            res.status(403).send("Forbidden");
            return;
        }

        if(hub_mode === "subscribe"){
            res.status(200).send(hub_challange);
            return;
        }

        res.status(403).send("Forbidden");
        return;

    }
    catch(error){
      // Pass error to error handling middleware
      next(error);
    }
  }

  export {webHookVerify}