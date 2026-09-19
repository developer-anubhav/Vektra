import Notification from "../models/Notification.js";
import TaskUpdate from "../models/TaskUpdate.js";

export const createNotificationService = async ({ companyId, recipientId, title, message, type, link }) => {
  if (!companyId || !recipientId || !title || !message) return null;
  try {
    const notification = new Notification({
      companyId,
      recipientId,
      title,
      message,
      type: type || "GENERAL",
      link: link || "",
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err.message);
    return null;
  }
};

export const getUserNotificationsService = async (reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const notifications = await Notification.find({
    companyId,
    recipientId: reqUser.id,
  }).sort({ createdAt: -1 }).limit(50);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount };
};

export const markNotificationAsReadService = async (notificationId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const notification = await Notification.findOne({
    _id: notificationId,
    companyId,
    recipientId: reqUser.id,
  });

  if (!notification) throw new Error("Notification not found.");

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllNotificationsAsReadService = async (reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  await Notification.updateMany(
    { companyId, recipientId: reqUser.id, isRead: false },
    { $set: { isRead: true } }
  );

  return { message: "All notifications marked as read." };
};

export const getActivityLogsService = async (reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const taskUpdates = await TaskUpdate.find({ companyId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("taskId", "title projectId status")
    .populate("employeeId", "name email department role");

  return taskUpdates;
};
