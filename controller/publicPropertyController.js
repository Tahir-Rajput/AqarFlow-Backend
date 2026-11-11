
import mongoose from "mongoose";
import Property from "../models/property.js";

// Get all published properties
export const getPublicProperties = async (req, res) => {
  try {
    const {
      purpose,
      category,
      city,
      locality,
      minPrice,
      maxPrice,
      bedrooms,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Public visitors can only see available, published properties
    const filter = {
      isPublished: true,
      status: "available",
    };

    if (purpose) filter.purpose = purpose.toLowerCase();
    if (category) filter.category = category.toLowerCase();
    if (city) filter.city = new RegExp(city, "i");
    if (locality) filter.locality = new RegExp(locality, "i");

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (bedrooms !== undefined) {
      filter.bedrooms = Number(bedrooms);
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { address: searchRegex },
      ];
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageLimit;

    const [properties, totalProperties] = await Promise.all([
      Property.find(filter)
        .select("-agencyId -createdBy -ownerName -ownerPhone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalProperties,
      currentPage,
      totalPages: Math.ceil(totalProperties / pageLimit),
      properties,
    });
  } catch (error) {
    console.error("Get public properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch properties",
    });
  }
};

// Get one published property by ID
export const getPublicPropertyById = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      isPublished: true,
      status: "available",
    }).select("-agencyId -createdBy -ownerName -ownerPhone");

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
    console.error("Get public property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch property",
    });
  }
};
