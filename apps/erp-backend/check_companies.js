import mongoose from "mongoose";
import dotenv from "dotenv";
import Company from "./src/models/Company.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const checkCompanies = async () => {
  try {
    await connectDB();
    const companies = await Company.find({}, "name email adminName");
    console.log("Current Companies in Database:");
    console.log(JSON.stringify(companies, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkCompanies();
