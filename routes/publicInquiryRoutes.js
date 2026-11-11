
import express from "express";
import { createPublicInquiry } from "../controller/publicInquiryController.js";

const router = express.Router();

router.post("/", createPublicInquiry);

export default router;
