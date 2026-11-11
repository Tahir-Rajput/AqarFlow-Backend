
import express from "express";

import {
  getLeads,
  assignLead,
  updateLeadStatus,
  addLeadNote,
} from "../controller/leadController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Admin and Agent
router.get("/", roleMiddleware("admin", "agent"), getLeads);
router.patch("/:leadId/status", roleMiddleware("admin", "agent"), updateLeadStatus);
router.post("/:leadId/notes", roleMiddleware("admin", "agent"), addLeadNote);

// Admin only
router.patch("/:leadId/assign", roleMiddleware("admin"), assignLead);

export default router;
