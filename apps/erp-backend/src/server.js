import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectDB } from "./config/db.js"
import { syncEmployees } from "./utils/syncEmployees.js"
import { validateEnv } from "./config/env.js"

const PORT = process.env.PORT || 5000

// Startup logic
const startServer = async () => {
  try {
    validateEnv()
    await connectDB()
    await syncEmployees()
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ SERVER ACTIVE: http://0.0.0.0:${PORT}`)
      console.log(`📧 MAIL SERVICE: ${process.env.EMAIL_USER}`)
    })
  } catch (error) {
    console.error("❌ CRITICAL STARTUP ERROR:", error.message)
  }
}

process.on("unhandledRejection", (err) => {
  console.error("DEBUG: Unhandled Rejection at Promise", err);
});

process.on("uncaughtException", (err) => {
  console.error("DEBUG: Uncaught Exception thrown", err);
});

startServer()
