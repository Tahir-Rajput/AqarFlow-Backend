
import mongoose from "mongoose";
import Visit from "../models/visit.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import User from "../models/user.js";

const validVisitStatuses = [
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No-show",
];

// Create a property visit
export const createVisit = async (req, res) => {
  try {
    const { leadId, agentId, scheduledAt, notes } = req.body;

    if (!leadId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Lead ID and scheduled date/time are required.",
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const appointmentDate = new Date(scheduledAt);

    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future appointment date/time.",
      });
    }

    // Find a lead belonging to the logged-in user's agency
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

    // Agents can only schedule visits for their own assigned leads
    if (
      req.user.role === "agent" &&
      String(lead.assignedAgent) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only schedule visits for your assigned leads.",
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

    // Admin selects an Agent; an Agent schedules for themselves
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

      // If the lead is already assigned, Admin must schedule
      // the visit with that same Agent.
      if (
        lead.assignedAgent &&
        String(lead.assignedAgent) !== String(selectedAgent._id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Assign the lead to this Agent before scheduling the visit.",
        });
      }

      selectedAgentId = selectedAgent._id;
    }

    // Each appointment occupies a fixed 60-minute slot.
    // Ignore cancelled and no-show appointments.
    const slotStart = new Date(
      appointmentDate.getTime() - 60 * 60 * 1000
    );

    const slotEnd = new Date(
      appointmentDate.getTime() + 60 * 60 * 1000
    );

    const conflictingVisit = await Visit.findOne({
      agencyId: req.user.agencyId,
      agent: selectedAgentId,
      scheduledAt: {
        $gt: slotStart,
        $lt: slotEnd,
      },
      status: { $nin: ["Cancelled", "No-show"] },
    });

    if (conflictingVisit) {
      return res.status(409).json({
        success: false,
        message:
          "Scheduling conflict: this Agent already has a visit within this 60-minute appointment slot.",
      });
    }

    const visit = await Visit.create({
      agencyId: req.user.agencyId,
      lead: lead._id,
      property: property._id,
      agent: selectedAgentId,
      scheduledAt: appointmentDate,
      notes: notes?.trim() || "",
    });

    // Reflect the scheduled visit in the CRM lead stage
    lead.status = "Visit Scheduled";
    await lead.save();

    const populatedVisit = await Visit.findById(visit._id)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city")
      .populate("agent", "name email");

    return res.status(201).json({
      success: true,
      message: "Property visit scheduled successfully.",
      visit: populatedVisit,
    });
  } catch (error) {
    console.error("Create visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get visits for the logged-in user's agency
export const getVisits = async (req, res) => {
  try {
    const filter = {
      agencyId: req.user.agencyId,
    };

    // Agents can only see their own visits
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const visits = await Visit.find(filter)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city price")
      .populate("agent", "name email")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      success: true,
      totalVisits: visits.length,
      visits,
    });
  } catch (error) {
    console.error("Get visits error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Update a visit's status or notes
export const updateVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.isValidObjectId(visitId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit ID.",
      });
    }

    if (status === undefined && notes === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a status or notes value to update.",
      });
    }

    if (
      status !== undefined &&
      !validVisitStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit status.",
        validStatuses: validVisitStatuses,
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string.",
      });
    }

    const filter = {
      _id: visitId,
      agencyId: req.user.agencyId,
    };

    // Agents can only update their own visits
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const visit = await Visit.findOne(filter);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Visit not found or you are not authorized to update it.",
      });
    }

    if (status !== undefined) {
      visit.status = status;
    }

    if (notes !== undefined) {
      visit.notes = notes.trim();
    }

    await visit.save();

    const updatedVisit = await Visit.findById(visit._id)
      .populate("lead", "name email phone status")
      .populate("property", "title referenceCode city")
      .populate("agent", "name email");

    return res.status(200).json({
      success: true,
      message: "Visit updated successfully.",
      visit: updatedVisit,
    });
  } catch (error) {
    console.error("Update visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
