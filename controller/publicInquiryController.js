
import mongoose from "mongoose";
import Property from "../models/property.js";
import Lead from "../models/lead.js";

export const createPublicInquiry = async (req, res) => {
  try {
    const { propertyId, name, email, phone, message } = req.body;

    // Validate required fields
    if (!propertyId || !name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Property ID, name, and phone are required.",
      });
    }

    // Validate property ID
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    // Validate email when provided
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Only accept inquiries for published and available properties
    const property = await Property.findOne({
      _id: propertyId,
      isPublished: true,
      status: "available",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or is no longer available.",
      });
    }

    // Automatically create a CRM lead for this property's agency
    const lead = await Lead.create({
      agencyId: property.agencyId,
      property: property._id,
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone.trim(),
      message: message?.trim() || "",
      source: "website",
      status: "New",
    });

    return res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully.",
      inquiry: {
        id: lead._id,
        property: lead.property,
        name: lead.name,
        status: lead.status,
      },
    });
  } catch (error) {
    console.error("Create public inquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your inquiry.",
    });
  }
};
