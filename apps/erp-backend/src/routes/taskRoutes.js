import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskProgress,
  addTaskUpdate,
  getTaskUpdates,
} from "../controllers/taskController.js";

const router = express.Router();

router.use(protect);

// Specific routes first to prevent route parameter collision
router.get("/my-tasks", getMyTasks);

router.post("/", authorize("ADMIN", "MANAGER", "SUPERADMIN"), createTask);
router.get("/", getTasks);

router.get("/:id", getTaskById);
router.put("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), updateTask);
router.delete("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), deleteTask);

// Progress tracking & Audit update history
router.put("/:id/progress", updateTaskProgress);
router.post("/:id/updates", addTaskUpdate);
router.get("/:id/updates", getTaskUpdates);

export default router;
