
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/user.js";

dotenv.config();

const resetAdminPassword = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin email or password is missing from .env");
    }

    await connectDB();

    const admin = await User.findOne({
      email: ADMIN_EMAIL.trim().toLowerCase(),
      role: "admin",
    }).select("+password");

    if (!admin) {
      throw new Error("Admin account not found");
    }

    admin.password = ADMIN_PASSWORD;
    await admin.save();

    // Verify the saved password without displaying it
    const verified = await admin.comparePassword(ADMIN_PASSWORD);

    console.log("Admin password reset successfully!");
    console.log("Admin email:", admin.email);
    console.log("Password verification:", verified ? "PASSED" : "FAILED");
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetAdminPassword();
