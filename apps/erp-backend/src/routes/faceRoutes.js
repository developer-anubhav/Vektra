import express from "express";
import {
  enrollFace,
  getFaceProfile,
  deleteFaceProfile,
  verifyAndCheckInFace,
  mobileCheckIn,
  getFacialAnalytics,
  getFacialAuditLogs,
  getBiometricSettings,
  updateBiometricSettings,
  cleanupAuditLogs,
} from "../controllers/faceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Analytics & Audit Logs
router.get("/analytics", protect, getFacialAnalytics);
router.get("/audit-logs", protect, getFacialAuditLogs);

// Biometric Security & Settings Calibration
router.get("/settings", protect, getBiometricSettings);
router.post("/settings", protect, updateBiometricSettings);
router.post("/cleanup-audit", protect, cleanupAuditLogs);

// Face Profile Enrollment & Management
router.post("/enroll/:employeeId", protect, enrollFace);
router.get("/profile/:employeeId", protect, getFaceProfile);
router.delete("/profile/:employeeId", protect, deleteFaceProfile);

// Facial Attendance Verification Check-In & Mobile Check-In
router.post("/verify-checkin", protect, verifyAndCheckInFace);
router.post("/mobile-checkin", protect, mobileCheckIn);

export default router;
