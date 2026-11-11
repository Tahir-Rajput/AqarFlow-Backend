import User from "../models/user.js";

// Create an Agent
export const createAgent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name",
      });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const agent = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "agent",
      agencyId: req.user.agencyId,
    });

    // The User model pre-save hook hashes the password.
    await agent.save();

    return res.status(201).json({
      success: true,
      message: "Agent created successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        agencyId: agent.agencyId,
        isActive: agent.isActive,
      },
    });
  } catch (error) {
    console.error("Create agent error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Agents belonging to the Admin's agency
export const getAgents = async (req, res) => {
  try {
    const agents = await User.find({
      agencyId: req.user.agencyId,
      role: "agent",
    })
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalAgents: agents.length,
      agents,
    });
  } catch (error) {
    console.error("Get agents error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Deactivate an Agent
export const deactivateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await User.findOneAndUpdate(
      {
        _id: agentId,
        agencyId: req.user.agencyId,
        role: "agent",
      },
      {
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role isActive");

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found in your agency",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agent deactivated successfully",
      agent,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent ID",
      });
    }

    console.error("Deactivate agent error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};