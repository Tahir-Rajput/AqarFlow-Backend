
import mongoose from "mongoose";
import Deal from "../models/deal.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import User from "../models/user.js";

const validDealStages = [
  "Inquiry",
  "Qualified",
  "Visit",
  "Offer",
  "Negotiation",
  "Booking",
  "Documentation",
  "Closed Won",
  "Closed Lost",
];

// Create a new deal
export const createDeal = async (req, res) => {
  try {
    const { leadId, agentId, amount, stage, notes } = req.body;

    if (!leadId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Lead ID and deal amount are required.",
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const dealAmount = Number(amount);

    if (
      amount === "" ||
      !Number.isFinite(dealAmount) ||
      dealAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Deal amount must be a valid non-negative number.",
      });
    }

    if (
      stage !== undefined &&
      !validDealStages.includes(stage)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal stage.",
        validStages: validDealStages,
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string.",
      });
    }

    const lead = await Lead.findOne({
      _id: leadId,
      agencyId: req.user.agencyId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    // Agents can only create deals for their assigned leads
    if (
      req.user.role === "agent" &&
      String(lead.assignedAgent) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create deals for your assigned leads.",
      });
    }

    if (!lead.property) {
      return res.status(400).json({
        success: false,
        message: "This lead is not linked to a property.",
      });
    }

    const property = await Property.findOne({
      _id: lead.property,
      agencyId: req.user.agencyId,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Linked property not found.",
      });
    }

    let selectedAgentId = req.user._id;

    if (req.user.role === "admin") {
      if (!agentId || !mongoose.isValidObjectId(agentId)) {
        return res.status(400).json({
          success: false,
          message: "A valid agent ID is required.",
        });
      }

      const selectedAgent = await User.findOne({
        _id: agentId,
        agencyId: req.user.agencyId,
        role: "agent",
        isActive: true,
      });

      if (!selectedAgent) {
        return res.status(400).json({
          success: false,
          message: "Active Agent not found in your agency.",
        });
      }

      if (
        lead.assignedAgent &&
        String(lead.assignedAgent) !== String(selectedAgent._id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Assign the lead to this Agent before creating the deal.",
        });
      }

      selectedAgentId = selectedAgent._id;
    }

    const deal = await Deal.create({
      agencyId: req.user.agencyId,
      lead: lead._id,
      property: property._id,
      agent: selectedAgentId,
      amount: dealAmount,
      stage: stage || "Inquiry",
      notes: notes?.trim() || "",
    });

    const populatedDeal = await Deal.findById(deal._id)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city price")
      .populate("agent", "name email");

    return res.status(201).json({
      success: true,
      message: "Deal created successfully.",
      deal: populatedDeal,
    });
  } catch (error) {
    console.error("Create deal error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get deals for the logged-in user's agency
export const getDeals = async (req, res) => {
  try {
    const filter = {
      agencyId: req.user.agencyId,
    };

    // Agents can only see their own deals
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const deals = await Deal.find(filter)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city price")
      .populate("agent", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalDeals: deals.length,
      deals,
    });
  } catch (error) {
    console.error("Get deals error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Update deal stage, amount or notes
export const updateDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { stage, amount, notes } = req.body;

    if (!mongoose.isValidObjectId(dealId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal ID.",
      });
    }

    if (
      stage === undefined &&
      amount === undefined &&
      notes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a stage, amount or notes value to update.",
      });
    }

    if (
      stage !== undefined &&
      !validDealStages.includes(stage)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal stage.",
        validStages: validDealStages,
      });
    }

    let dealAmount;

    if (amount !== undefined) {
      dealAmount = Number(amount);

      if (
        amount === "" ||
        !Number.isFinite(dealAmount) ||
        dealAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Deal amount must be a valid non-negative number.",
        });
      }
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string.",
      });
    }

    const filter = {
      _id: dealId,
      agencyId: req.user.agencyId,
    };

    // Agents can only update their own deals
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const deal = await Deal.findOne(filter);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found or you are not authorized to update it.",
      });
    }

    if (stage !== undefined) {
      deal.stage = stage;
    }

    if (amount !== undefined) {
      deal.amount = dealAmount;
    }

    if (notes !== undefined) {
      deal.notes = notes.trim();
    }

    await deal.save();

    const updatedDeal = await Deal.findById(deal._id)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city price")
      .populate("agent", "name email");

    return res.status(200).json({
      success: true,
      message: "Deal updated successfully.",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Update deal error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
