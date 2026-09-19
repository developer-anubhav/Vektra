import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
import Company from "./src/models/Company.js";
import AdminRegister from "./src/models/AdminRegister.js";
import { connectDB } from "./src/config/db.js";
import bcrypt from "bcryptjs";

dotenv.config();

const syncUsers = async () => {
  try {
    await connectDB();
    
    // Find all approved registrations
    const approvedRegs = await AdminRegister.find({ status: "Approved" });
    
    for (const reg of approvedRegs) {
      const existingUser = await User.findOne({ email: reg.email.toLowerCase() });
      if (!existingUser) {
        console.log(`Fixing missing user for approved registration: ${reg.email}`);
        
        // Find the company created for this registration
        const company = await Company.findOne({ email: reg.email.toLowerCase() });
        if (!company) {
            console.error(`Error: Company not found for ${reg.email}. Skipping user creation.`);
            continue;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Admin@Vektra2026", salt);

        const newAdmin = new User({
          name: reg.name,
          email: reg.email.toLowerCase(),
          password: hashedPassword,
          role: "ADMIN",
          companyId: company._id
        });

        await newAdmin.save();
        console.log(`✅ User created for ${reg.email}`);
      } else {
        console.log(`User already exists for ${reg.email}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

syncUsers();
