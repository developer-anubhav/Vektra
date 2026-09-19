import AdminRegister from "../models/AdminRegister.js";

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, companyName } = req.body;

        if (!name || !email || !companyName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if already registered
        const existingAdmin = await AdminRegister.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "This email is already registered for a workspace" });
        }

        const newRegistration = new AdminRegister({
            name,
            email,
            companyName
        });

        await newRegistration.save();

        res.status(201).json({
            success: true,
            message: "Workspace registration request submitted successfully!",
            data: newRegistration
        });
    } catch (error) {
        console.error("Admin Registration Error:", error);
        res.status(501).json({ 
            success: false,
            message: "Failed to process registration request", 
            error: error.message 
        });
    }
};

import Company from "../models/Company.js";

// GET /api/admin/work-location
export const getWorkLocation = async (req, res) => {
  try {
    let company;
    if (req.user?.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne();
    }
    if (!company) return res.status(404).json({ message: "Company not found" });

    return res.json({
      success: true,
      workLocation: company.workLocation || {
        name: "Main Office / HQ",
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 200,
        enabled: true,
      },
    });
  } catch (err) {
    console.error("Get Work Location Error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch work location" });
  }
};

// PUT /api/admin/work-location
export const updateWorkLocation = async (req, res) => {
  try {
    const { name, latitude, longitude, radiusMeters, enabled } = req.body;

    let company;
    if (req.user?.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne();
    }
    if (!company) return res.status(404).json({ message: "Company not found" });

    const currentLoc = company.workLocation || {};

    company.workLocation = {
      name: name && String(name).trim() !== "" ? String(name).trim() : (currentLoc.name || "Main Office / HQ"),
      latitude: latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : (currentLoc.latitude ?? 12.9716),
      longitude: longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : (currentLoc.longitude ?? 77.5946),
      radiusMeters: radiusMeters !== undefined && !isNaN(Number(radiusMeters)) ? Number(radiusMeters) : (currentLoc.radiusMeters ?? 200),
      enabled: enabled !== undefined ? Boolean(enabled) : (currentLoc.enabled ?? true),
    };

    company.markModified("workLocation");
    await company.save();

    return res.json({
      success: true,
      message: "Work location & geofence settings updated successfully",
      workLocation: company.workLocation,
    });
  } catch (err) {
    console.error("Update Work Location Error:", err);
    return res.status(500).json({ message: err.message || "Failed to update work location" });
  }
};
