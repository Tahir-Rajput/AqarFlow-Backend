
import express from "express";

import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  togglePropertyPublish,
} from "../controller/propertyController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { upload, handlePropertyImages } from "../middleware/uploadMiddleware.js";

  const router = express.Router();

// All property-management routes require login
router.use(authMiddleware);

// Admin and Agent can create properties
router.post(
  "/",
  roleMiddleware("admin", "agent"),
  handlePropertyImages,
  createProperty
);

// Admin and Agent can view permitted properties
router.get(
  "/",
  roleMiddleware("admin", "agent"),
  getProperties
  );

// Get one property
router.get(
  "/:propertyId",
  roleMiddleware("admin", "agent"),
  getPropertyById
);

// Update property with optional image uploads
router.patch(
  "/:propertyId",
  roleMiddleware("admin", "agent"),
  handlePropertyImages,
  updateProperty
);

// Delete property
router.delete(
  "/:propertyId",
  roleMiddleware("admin", "agent"),
  deleteProperty
);

// Only Admin can publish or unpublish properties
router.patch(
  "/:propertyId/publish",
  roleMiddleware("admin"),
  togglePropertyPublish
);

export default router;
