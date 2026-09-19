import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const email = "vektra@gmail.com";
    const password = "vektra26";

    // Check if already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("SuperAdmin already exists. Updating password and role...");
      const salt = await bcrypt.genSalt(10);
      existing.password = await bcrypt.hash(password, salt);
      existing.role = "SUPERADMIN";
      await existing.save();
      console.log("✅ SuperAdmin updated successfully!");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const superAdmin = new User({
        name: "Super Admin",
        email: email,
        password: hashedPassword,
        role: "SUPERADMIN",
      });

      await superAdmin.save();
      console.log("✅ SuperAdmin created successfully!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
