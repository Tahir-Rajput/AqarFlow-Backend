import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import Agency from "../models/agency.js";
import User from "../models/user.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Validate environment variables
    const {
      AGENCY_NAME,
      AGENCY_EMAIL,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (
      !AGENCY_NAME ||
      !AGENCY_EMAIL ||
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      throw new Error("Required admin environment variables are missing");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must be at least 8 characters");
    }

    await connectDB();

    const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
    const agencyEmail = AGENCY_EMAIL.trim().toLowerCase();

    // Prevent duplicate Admin accounts
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    // Find or create the Agency
    let agency = await Agency.findOne({ email: agencyEmail });

    if (!agency) {
      agency = await Agency.create({
        name: AGENCY_NAME.trim(),
        email: agencyEmail,
      });

      console.log("Agency created successfully!");
    }

    // Create the first Admin
    const admin = new User({
      name: ADMIN_NAME.trim(),
      email: adminEmail,
      password: ADMIN_PASSWORD,
      role: "admin",
      agencyId: agency._id,
    });

    // The User model's pre-save hook hashes the password
    await admin.save();

    console.log("Admin account created successfully!");
    console.log(`Admin email: ${admin.email}`);
    console.log(`Agency: ${agency.name}`);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();