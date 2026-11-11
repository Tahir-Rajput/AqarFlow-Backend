import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    referenceCode: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    purpose: {
      type: String,
      enum: ["sale", "rent"],
      required: true,
    },

    category: {
      type: String,
      enum: ["house", "apartment", "plot", "commercial", "office"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "PKR",
    },

    area: {
      type: Number,
      required: true,
      min: 0,
    },

    areaUnit: {
      type: String,
      default: "marla",
    },

    bedrooms: {
      type: Number,
      default: 0,
      min: 0,
    },

    bathrooms: {
      type: Number,
      default: 0,
      min: 0,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    locality: {
      type: String,
      trim: true,
    },

    amenities: {
      type: [String],
      default: [],
    },

    furnishing: {
      type: String,
      enum: ["furnished", "unfurnished", "semi-furnished"],
      default: "unfurnished",
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["available", "sold", "rented"],
      default: "available",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ownerName: {
      type: String,
      trim: true,
    },

    ownerPhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// A reference code must be unique within an agency.
propertySchema.index(
  { agencyId: 1, referenceCode: 1 },
  { unique: true }
);

// Helps filter public listings.
propertySchema.index({
  agencyId: 1,
  isPublished: 1,
  status: 1,
});

const Property = mongoose.model("Property", propertySchema);

export default Property;