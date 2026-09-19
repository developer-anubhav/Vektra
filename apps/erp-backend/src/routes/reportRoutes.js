import express from "express"
import { protect } from "../middleware/authMiddleware.js"
import {
  getAttendanceReport,
  getPayrollReport,
  getDashboardStats,
  getAttendanceSummary,
  getEmployeeStatus,
  getHeadcountChart,
  getAttendanceChart
} from "../controllers/reportController.js"


const router = express.Router()

router.get("/attendance", protect, getAttendanceReport)
router.get("/payroll", protect, getPayrollReport)
router.get("/dashboard", protect, getDashboardStats)
router.get("/attendance-summary", protect, getAttendanceSummary)
router.get("/employee-status", protect, getEmployeeStatus)
router.get("/headcount-chart", protect, getHeadcountChart)
router.get("/attendance-chart", protect, getAttendanceChart)
export default router
