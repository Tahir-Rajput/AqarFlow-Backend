
import mongoose from "mongoose";
import Property from "../models/property.js";
import User from "../models/user.js";
import uploadToCloudinary from "../utils/cloudinaryUpload.js";

// Create property
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      referenceCode,
      description,
      purpose,
      category,
      price,
      currency,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      address,
      city,
      locality,
      amenities,
      furnishing,
      images,
      assignedAgent,
      ownerName,
      ownerPhone,
    } = req.body;

    if (
      !title?.trim() ||
      !referenceCode?.trim() ||
      !description?.trim() ||
      !purpose ||
      !category ||
      price === undefined ||
      area === undefined ||
      !address?.trim() ||
      !city?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required property fields",
      });
    }

    if (
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isFinite(Number(area)) ||
      Number(area) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be non-negative and area must be greater than zero",
      });
    }

    let agentId;

    if (assignedAgent) {
      if (!mongoose.isValidObjectId(assignedAgent)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned Agent ID",
        });
      }

      const agent = await User.findOne({
        _id: assignedAgent,
        agencyId: req.user.agencyId,
        role: "agent",
        isActive: true,
      });

      if (!agent) {
        return res.status(400).json({
          success: false,
          message:
            "Assigned Agent does not exist in your agency or is inactive",
        });
      }

      agentId = agent._id;
    }

    // Agents automatically get assigned to their own properties.
    if (req.user.role === "agent") {
      agentId = req.user._id;
    }

    // Upload property images to Cloudinary.
    const uploadedImages = req.files?.length
      ? await Promise.all(
          req.files.map((file) =>
            uploadToCloudinary(file.buffer)
          )
        )
      : [];

    // Use Cloudinary URLs when images are uploaded.
    const propertyImages = uploadedImages.length
      ? uploadedImages.map((image) => image.url)
      : images || [];

    const property = await Property.create({
      agencyId: req.user.agencyId,
      title,
      referenceCode,
      description,
      purpose,
      category,
      price: Number(price),
      currency,
      area: Number(area),
      areaUnit,
      bedrooms,
      bathrooms,
      address,
      city,
      locality,
      amenities,
      furnishing,
      images: propertyImages,
      assignedAgent: agentId,
      createdBy: req.user._id,
      ownerName,
      ownerPhone,
    });

    return res.status(201).json({
      success: true,
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This reference code already exists in your agency",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all properties belonging to the user's agency
export const getProperties = async (req, res) => {
  try {
    const filter = {
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.$or = [
        { assignedAgent: req.user._id },
        { createdBy: req.user._id },
      ];
    }

    const properties = await Property.find(filter)
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalProperties: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Get properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get one property
export const getPropertyById = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const filter = {
      _id: propertyId,
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.$or = [
        { assignedAgent: req.user._id },
        { createdBy: req.user._id },
      ];
    }

    const property = await Property.findOne(filter)
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    return res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Get property error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "purpose",
      "category",
      "price",
      "currency",
      "area",
      "areaUnit",
      "bedrooms",
      "bathrooms",
      "address",
      "city",
      "locality",
      "amenities",
      "furnishing",
      "images",
      "assignedAgent",
      "ownerName",
      "ownerPhone",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Agents cannot reassign properties.
    if (req.user.role === "agent") {
      delete updates.assignedAgent;
    }

    if (Object.keys(updates).length === 0 && !req.files?.length) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one permitted field to update",
      });
    }

    if (
      updates.price !== undefined &&
      (!Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number",
      });
    }

    if (
      updates.area !== undefined &&
      (!Number.isFinite(Number(updates.area)) ||
        Number(updates.area) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Area must be greater than zero",
      });
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.area !== undefined) {
      updates.area = Number(updates.area);
    }

    if (updates.assignedAgent) {
      if (!mongoose.isValidObjectId(updates.assignedAgent)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned Agent ID",
        });
      }

      const agent = await User.findOne({
        _id: updates.assignedAgent,
        agencyId: req.user.agencyId,
        role: "agent",
        isActive: true,
      });

      if (!agent) {
        return res.status(400).json({
          success: false,
          message:
            "Assigned Agent does not exist in your agency or is inactive",
        });
      }
    }

    // Upload new images to Cloudinary when files are provided.
    if (req.files?.length) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer)
        )
      );

      updates.images = uploadedImages.map(
        (image) => image.url
      );
    }

    const filter = {
      _id: propertyId,
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.$or = [
        { assignedAgent: req.user._id },
        { createdBy: req.user._id },
      ];
    }

    const property = await Property.findOneAndUpdate(
      filter,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you cannot access it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const filter = {
      _id: propertyId,
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.$or = [
        { assignedAgent: req.user._id },
        { createdBy: req.user._id },
      ];
    }

    const property = await Property.findOneAndDelete(filter);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you cannot access it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Publish or unpublish property (Admin only)
export const togglePropertyPublish = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be true or false",
      });
    }

    const property = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        agencyId: req.user.agencyId,
      },
      { $set: { isPublished } },
      { new: true, runValidators: true }
    )
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isPublished
        ? "Property published successfully"
        : "Property unpublished successfully",
      property,
    });
  } catch (error) {
    console.error("Publish property error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
