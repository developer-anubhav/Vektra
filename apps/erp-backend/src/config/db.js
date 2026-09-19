import mongoose from "mongoose"
import dns from "dns"

// Ensure reliable DNS resolution for MongoDB SRV connection strings on Windows / local ISP
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error("Database URI is not defined in environment variables");

    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    // Callers (including the serverless connection middleware) must receive
    // this failure. Swallowing it lets an upload continue until GridFS fails
    // with a misleading "database is not established" error.
    throw err;
  }
}

