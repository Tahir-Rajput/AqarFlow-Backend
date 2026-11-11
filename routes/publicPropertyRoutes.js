
import express from "express";

import {
  getPublicProperties,
  getPublicPropertyById,
} from "../controller/publicPropertyController.js";

const router = express.Router();

router.get("/", getPublicProperties);
router.get("/:propertyId", getPublicPropertyById);

export default router;
