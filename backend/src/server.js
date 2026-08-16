import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectDB } from "./config/db.js"

import authRoutes from "./routes/authRoutes.js"
app.use("/api/auth", authRoutes)

import attendanceRoutes from "./routes/attendanceRoutes.js"
app.use("/api/attendance", attendanceRoutes)

import payrollRoutes from "./routes/payrollRoutes.js"
app.use("/api/payroll", payrollRoutes)

import reportRoutes from "./routes/reportRoutes.js"
app.use("/api/reports", reportRoutes)

import superAdminRoutes from "./routes/superAdminRoutes.js"
app.use("/api/superadmin", superAdminRoutes)

import searchRoutes from "./routes/searchRoutes.js"
app.use("/api/search", searchRoutes)

import faceRoutes from "./routes/faceRoutes.js"
app.use("/api/face", faceRoutes)

import adminRoutes from "./routes/adminRoutes.js"
app.use("/api/admin", adminRoutes)

const PORT = process.env.PORT || 5000

// We wrap startup in an async function to ensure DB is ready before server accepts requests
const startServer = async () => {
  try {
    await connectDB()
    
    app.listen(PORT, () => {
      console.log(`✅ SERVER ACTIVE: http://localhost:${PORT}`)
      console.log(`📧 MAIL SERVICE: ${process.env.EMAIL_USER}`)
    })
  } catch (error) {
    console.error("❌ CRITICAL STARTUP ERROR:", error.message)
  }
}

// Final crash protection
process.on("unhandledRejection", (err) => {
  console.error("DEBUG: Unhandled Rejection at Promise", err);
});

process.on("uncaughtException", (err) => {
  console.error("DEBUG: Uncaught Exception thrown", err);
});

startServer()
