import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMembers,
  removeTeamMember,
  getProjectMembers,
} from "../controllers/projectController.js";
import {
  createMilestone,
  getMilestones,
} from "../controllers/milestoneController.js";
import { getProjectAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

// Apply protect middleware to all project routes
router.use(protect);

// Specific project endpoints
router.get("/analytics", getProjectAnalytics);

router.post("/", authorize("ADMIN", "MANAGER", "SUPERADMIN"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), updateProject);
router.delete("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), deleteProject);

// Team membership routes
router.get("/:id/members", getProjectMembers);
router.post("/:id/members", authorize("ADMIN", "MANAGER", "SUPERADMIN"), addTeamMembers);
router.delete("/:id/members/:memberId", authorize("ADMIN", "MANAGER", "SUPERADMIN"), removeTeamMember);
router.delete("/:id/members", authorize("ADMIN", "MANAGER", "SUPERADMIN"), removeTeamMember);

// Project Milestone routes
router.post("/:id/milestones", authorize("ADMIN", "MANAGER", "SUPERADMIN"), createMilestone);
router.get("/:id/milestones", getMilestones);

export default router;
