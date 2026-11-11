import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.js";

dotenv.config();

const resetAgentPassword = async () => {
  try {
    await connectDB();

    const agent = await User.findOne({
      email: "usman@aqarflow.com",
      role: "agent",
    });

    if (!agent) {
      console.log("Agent not found.");
      return;
    }

    agent.password = "AqarFlowTest123!";
    await agent.save();

    console.log("Agent password reset successfully!");
  } catch (error) {
    console.error("Password reset error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

resetAgentPassword();
