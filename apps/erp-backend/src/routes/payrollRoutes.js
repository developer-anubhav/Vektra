import express from "express"
import {
  createPayroll,
  getPayroll,
  updatePayroll,
  deletePayroll
} from "../controllers/payrollController.js"

import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", protect, createPayroll)
router.get("/", protect, getPayroll)
router.put("/:id", protect, updatePayroll)
router.delete("/:id", protect, deletePayroll)


export default router
