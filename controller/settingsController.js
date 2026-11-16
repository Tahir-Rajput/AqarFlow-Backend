
import User from "../models/user.js";
import Agency from "../models/agency.js";

// Get account and agency settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email phone role agencyId"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const agency = await Agency.findById(user.agencyId);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      agency,
    });
  } catch (error) {
    console.error("Get settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};

// Update account profile
export const updateAccountSettings = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        phone: phone?.trim() || "",
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email phone role agencyId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update account profile",
    });
  }
};

// Update agency profile (Admin only)
export const updateAgencySettings = async (req, res) => {
  try {
    const { name, email, phone, address, city } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Agency name is required",
      });
    }

    const agency = await Agency.findOneAndUpdate(
      {
        _id: req.user.agencyId,
      },
      {
        name: name.trim(),
        email: email?.trim().toLowerCase() || "",
        phone: phone?.trim() || "",
        address: address?.trim() || "",
        city: city?.trim() || "",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agency profile updated successfully",
      agency,
    });
  } catch (error) {
    console.error("Update agency error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update agency profile",
    });
  }
};
