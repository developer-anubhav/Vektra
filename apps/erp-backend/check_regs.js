import mongoose from "mongoose";
import dotenv from "dotenv";
import AdminRegister from "./src/models/AdminRegister.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const checkRegistrations = async () => {
  try {
    await connectDB();
    const regs = await AdminRegister.find({}, "email status companyName");
    console.log("Current Registrations in Database:");
    console.log(JSON.stringify(regs, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkRegistrations();
