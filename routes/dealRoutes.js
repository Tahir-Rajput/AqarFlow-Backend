
import express from "express";
import {
  createDeal,
  getDeals,
  updateDeal,
} from "../controller/dealController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createDeal);
router.get("/", authMiddleware, getDeals);
router.patch("/:dealId", authMiddleware, updateDeal);

export default router;
