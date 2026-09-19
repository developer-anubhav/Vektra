import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import faceRoutes from "./routes/faceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import copilotRoutes from "./routes/copilotRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy for live deployment (Render, Vercel, Railway, Nginx, Cloudflare)
app.set("trust proxy", 1);

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[NETWORK] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Auto-connect to DB in serverless / cloud deployment if connection lost
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("[DB Middleware] Connection error:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

const corsOptions = {
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoints for Render / AWS / Railway probes
app.get("/health", (req, res) => res.json({ success: true, status: "ok", message: "Vektra API is running", timestamp: new Date().toISOString() }));
app.get("/api/health", (req, res) => res.json({ success: true, status: "ok", message: "Vektra API is running", timestamp: new Date().toISOString() }));

// Register REST API Routers
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/documents", documentRoutes);

// Serve frontend dist static files if deployed together in a monorepo service
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Vektra E-HRMS API running" });
  });
}

export default app;
