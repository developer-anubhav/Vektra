import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getActivityLogs,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getUserNotifications);
router.get("/activity-logs", getActivityLogs);
router.put("/read-all", markAllNotificationsAsRead);
router.put("/:id/read", markNotificationAsRead);

export default router;
