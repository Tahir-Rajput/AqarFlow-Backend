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

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Password must contain at least 8 characters");
    }

    await connectDB();

    const admin = await User.findOne({
      email: ADMIN_EMAIL.trim().toLowerCase(),
      role: "admin",
    });

    if (!admin) {
      throw new Error("Admin account not found");
    }

    // Assign new password.
    // The pre-save hook will hash it automatically.
    admin.password = ADMIN_PASSWORD;

    await admin.save();

    console.log("Admin password reset successfully!");
    console.log(`Admin email: ${admin.email}`);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetAdminPassword();