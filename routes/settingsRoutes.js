
import express from "express";

import {
  getSettings,
  updateAccountSettings,
  updateAgencySettings,
} from "../controller/settingsController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// All settings routes require authentication
router.use(authMiddleware);

// Get account and agency settings
router.get("/", getSettings);

// Update personal account information
router.patch("/account", updateAccountSettings);

// Only Admin can update agency information
router.patch(
  "/agency",
  roleMiddleware("admin"),
  updateAgencySettings
);

export default router;
