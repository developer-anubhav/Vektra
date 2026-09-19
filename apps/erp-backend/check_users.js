import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const checkUsers = async () => {
  try {
    await connectDB();
    const users = await User.find({}, "email role");
    console.log("Current Users in Database:");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkUsers();
