import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestoneController.js";

const router = express.Router();

router.use(protect);

router.put("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), updateMilestone);
router.delete("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), deleteMilestone);

export default router;
