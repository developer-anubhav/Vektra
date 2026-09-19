import { protect } from "../middleware/authMiddleware.js"

import express from "express"
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  createStaff
} from "../controllers/employeeController.js"

const router = express.Router()

router.get("/", protect, getEmployees)
router.post("/", protect, createEmployee)
router.post("/create-staff", protect, createStaff)
router.put("/:id", protect, updateEmployee)
router.delete("/:id", protect, deleteEmployee)


export default router
