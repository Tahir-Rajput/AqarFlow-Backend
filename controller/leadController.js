
import mongoose from "mongoose";
import Lead from "../models/lead.js";
import User from "../models/user.js";

const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Visit Scheduled",
  "Negotiation",
  "Converted",
  "Lost",
];

// Admin sees all agency leads.
// Agent sees only leads assigned to them.
export const getLeads = async (req, res) => {
  try {
    const filter = {
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    const leads = await Lead.find(filter)
      .populate("property", "title referenceCode city price")
      .populate("assignedAgent", "name email")
      .populate("notes.addedBy", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalLeads: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leads.",
    });
  }
};

// Admin assigns a lead to an active Agent in the same agency.
export const assignLead = async (req, res) => {
  try {
    const { agentId } = req.body;
    const { leadId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(leadId) ||
      !mongoose.Types.ObjectId.isValid(agentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID or agent ID.",
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

    const agent = await User.findOne({
      _id: agentId,
      agencyId: req.user.agencyId,
      role: "agent",
      isActive: true,
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Active Agent not found in your agency.",
      });
    }

    lead.assignedAgent = agent._id;
    await lead.save();

    return res.status(200).json({
      success: true,
      message: "Lead assigned successfully.",
      lead,
    });
  } catch (error) {
    console.error("Assign lead error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to assign lead.",
    });
  }
};

// Admin can update any agency lead.
// Agent can update only their assigned leads.
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { leadId } = req.params;

    if (!leadStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead status.",
        allowedStatuses: leadStatuses,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const filter = {
      _id: leadId,
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    const lead = await Lead.findOneAndUpdate(
      filter,
      { status },
      { returnDocument: "after", runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or you are not assigned to it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead status updated successfully.",
      lead,
    });
  } catch (error) {
    console.error("Update lead status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update lead status.",
    });
  }
};

// Admin or assigned Agent can add a follow-up note.
export const addLeadNote = async (req, res) => {
  try {
    const { text } = req.body;
    const { leadId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note text is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const filter = {
      _id: leadId,
      agencyId: req.user.agencyId,
    };

    if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    const lead = await Lead.findOne(filter);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or you are not assigned to it.",
      });
    }

    lead.notes.push({
      text: text.trim(),
      addedBy: req.user._id,
    });

    await lead.save();

    return res.status(201).json({
      success: true,
      message: "Follow-up note added successfully.",
      notes: lead.notes,
    });
  } catch (error) {
    console.error("Add lead note error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add lead note.",
    });
  }
};
