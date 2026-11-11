
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
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Handle image upload errors
const handlePropertyImages = (req, res, next) => {
  upload.array("images", 10)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

// All property-management routes require login
router.use(authMiddleware);

// Admin and Agent can create and view permitted properties
router.post(
  "/",
  roleMiddleware("admin", "agent"),
  handlePropertyImages,
  createProperty
);

router.get("/", roleMiddleware("admin", "agent"), getProperties);

router.get(
  "/:propertyId",
  roleMiddleware("admin", "agent"),
  getPropertyById
);

// Admin and Agent can update/delete properties within their permitted scope
router.patch(
  "/:propertyId",
  roleMiddleware("admin", "agent"),
  handlePropertyImages,
  updateProperty
);

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
