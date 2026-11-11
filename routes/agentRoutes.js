import express from "express";

import {
  createAgent,
  getAgents,
  deactivateAgent,
} from "../controller/agentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require an authenticated Admin
router.use(authMiddleware, roleMiddleware("admin"));

router.post("/", createAgent);
router.get("/", getAgents);
router.patch("/:agentId/deactivate", deactivateAgent);

export default router;