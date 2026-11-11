import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show",
      ],
      default: "Requested",
    },
    notes: String,
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;