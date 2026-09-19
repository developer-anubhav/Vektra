import express from "express"
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getShiftSettings,
  updateShiftSettings,
  checkIn,
  getTodayAttendance
} from "../controllers/attendanceController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/today", protect, getTodayAttendance)
router.post("/checkin", protect, checkIn)
router.get("/", protect, getAttendance)
router.post("/", protect, markAttendance)
router.get("/shift-settings", protect, getShiftSettings)
router.put("/shift-settings", protect, updateShiftSettings)
router.put("/:id", protect, updateAttendance)
router.delete("/:id", protect, deleteAttendance)

export default router
