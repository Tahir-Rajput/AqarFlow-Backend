import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    stage: {
      type: String,
      enum: [
        "Inquiry",
        "Qualified",
        "Visit",
        "Offer",
        "Negotiation",
        "Booking",
        "Documentation",
        "Closed Won",
        "Closed Lost",
      ],
      default: "Inquiry",
    },
    notes: String,
  },
  { timestamps: true }
);

const Deal = mongoose.model("Deal", dealSchema);

export default Deal;