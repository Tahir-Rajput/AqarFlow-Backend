
import express from "express";
import {
  createVisit,
  getVisits,
  updateVisit,
} from "../controller/visitController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createVisit);
router.get("/", authMiddleware, getVisits);
router.patch("/:visitId", authMiddleware, updateVisit);

export default router;
