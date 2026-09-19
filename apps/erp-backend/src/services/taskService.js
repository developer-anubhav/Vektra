import Task from "../models/Task.js";
import TaskUpdate from "../models/TaskUpdate.js";
import Project from "../models/Project.js";
import Milestone from "../models/Milestone.js";
import Employee from "../models/Employee.js";
import { invalidateAnalyticsCache } from "./analyticsService.js";
import { createNotificationService } from "./notificationService.js";

const getUserEmployeeIds = async (reqUser) => {
  const userIds = [reqUser.id];
  if (reqUser.email) {
    const emp = await Employee.findOne({ email: reqUser.email.toLowerCase().trim(), companyId: reqUser.companyId });
    if (emp) userIds.push(emp._id);
  }
  return userIds;
};

const getPrimaryEmployeeId = async (reqUser) => {
  if (reqUser.email) {
    const emp = await Employee.findOne({ email: reqUser.email.toLowerCase().trim(), companyId: reqUser.companyId });
    if (emp) return emp._id;
  }
  return reqUser.id;
};

export const createTaskService = async (taskData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const { projectId, milestoneId, title, description, assignedTo, priority, status, progress, startDate, dueDate } = taskData;

  if (!projectId || !title) {
    throw new Error("projectId and title are required.");
  }

  // Validate project belongs to companyId
  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) throw new Error("Project not found in your company.");

  // Validate milestone if provided
  if (milestoneId) {
    const milestone = await Milestone.findOne({ _id: milestoneId, companyId, projectId });
    if (!milestone) throw new Error("Milestone not found for this project.");
  }

  // Validate assigned employees
  let validatedAssignedTo = [];
  if (Array.isArray(assignedTo) && assignedTo.length > 0) {
    const validEmps = await Employee.find({ _id: { $in: assignedTo }, companyId }).select("_id");
    if (validEmps.length !== assignedTo.length) {
      throw new Error("Invalid assignment: One or more employees do not belong to your company.");
    }
    validatedAssignedTo = validEmps.map((e) => e._id);
  }

  const initialStatus = status || "TODO";
  const initialProgress = progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : 0;
  const completedAt = initialStatus === "COMPLETED" || initialProgress === 100 ? new Date() : null;

  const newTask = new Task({
    companyId,
    projectId,
    milestoneId: milestoneId || null,
    title,
    description: description || "",
    assignedTo: validatedAssignedTo,
    assignedBy: reqUser.id,
    priority: priority || "MEDIUM",
    status: initialStatus,
    progress: initialProgress,
    startDate: startDate ? new Date(startDate) : undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    completedAt,
  });

  await newTask.save();
  invalidateAnalyticsCache(companyId);

  if (Array.isArray(validatedAssignedTo) && validatedAssignedTo.length > 0) {
    for (const recipientId of validatedAssignedTo) {
      await createNotificationService({
        companyId,
        recipientId,
        title: "New Task Assigned",
        message: `You have been assigned to task '${title}'`,
        type: "TASK_ASSIGNED",
        link: "/employee/tasks",
      });
    }
  }

  return await Task.findOne({ _id: newTask._id, companyId })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");
};

export const getTasksService = async (reqUser, queryFilters = {}) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const filter = { companyId };

  if (queryFilters.projectId) filter.projectId = queryFilters.projectId;
  if (queryFilters.milestoneId) filter.milestoneId = queryFilters.milestoneId;
  if (queryFilters.status) filter.status = queryFilters.status;
  if (queryFilters.priority) filter.priority = queryFilters.priority;

  // Role scoping
  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "EMPLOYEE") {
    const userIds = await getUserEmployeeIds(reqUser);
    filter.assignedTo = { $in: userIds };
  } else if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    // MANAGER sees tasks in projects they are assigned to
    const assignedProjects = await Project.find({
      companyId,
      $or: [{ projectManager: { $in: userIds } }, { teamMembers: { $in: userIds } }],
    }).select("_id");
    const projectIds = assignedProjects.map((p) => p._id);
    filter.projectId = { $in: projectIds };
  }

  return await Task.find(filter)
    .sort({ createdAt: -1 })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");
};

export const getMyTasksService = async (reqUser, queryFilters = {}) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const userIds = await getUserEmployeeIds(reqUser);
  const filter = { companyId, assignedTo: { $in: userIds } };

  if (queryFilters.status) filter.status = queryFilters.status;
  if (queryFilters.priority) filter.priority = queryFilters.priority;

  return await Task.find(filter)
    .sort({ dueDate: 1, createdAt: -1 })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");
};

export const getTaskByIdService = async (taskId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const task = await Task.findOne({ _id: taskId, companyId })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");

  if (!task) throw new Error("Task not found.");
  return task;
};

export const updateTaskService = async (taskId, updateData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const task = await Task.findOne({ _id: taskId, companyId });
  if (!task) throw new Error("Task not found.");

  if (updateData.title !== undefined) task.title = updateData.title;
  if (updateData.description !== undefined) task.description = updateData.description;
  if (updateData.priority !== undefined) task.priority = updateData.priority;
  if (updateData.startDate !== undefined) task.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
  if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;

  if (Array.isArray(updateData.assignedTo)) {
    const validEmps = await Employee.find({ _id: { $in: updateData.assignedTo }, companyId }).select("_id");
    if (validEmps.length !== updateData.assignedTo.length) {
      throw new Error("Invalid assignment: One or more employees do not belong to your company.");
    }
    task.assignedTo = validEmps.map((e) => e._id);
  }

  if (updateData.milestoneId !== undefined) {
    if (updateData.milestoneId) {
      const milestone = await Milestone.findOne({ _id: updateData.milestoneId, companyId, projectId: task.projectId });
      if (!milestone) throw new Error("Milestone not found for this project.");
      task.milestoneId = updateData.milestoneId;
    } else {
      task.milestoneId = null;
    }
  }

  if (updateData.progress !== undefined) {
    task.progress = Math.min(100, Math.max(0, Number(updateData.progress)));
  }

  if (updateData.status !== undefined) {
    const oldStatus = task.status;
    task.status = updateData.status;
    if (updateData.status === "COMPLETED" && oldStatus !== "COMPLETED") {
      task.completedAt = new Date();
      task.progress = 100;
    } else if (updateData.status !== "COMPLETED" && oldStatus === "COMPLETED") {
      task.completedAt = null;
    }
  } else if (task.progress === 100 && task.status !== "COMPLETED") {
    task.status = "COMPLETED";
    task.completedAt = new Date();
  }

  await task.save();
  return await Task.findOne({ _id: taskId, companyId })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");
};

export const deleteTaskService = async (taskId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const task = await Task.findOne({ _id: taskId, companyId });
  if (!task) throw new Error("Task not found.");

  await TaskUpdate.deleteMany({ companyId, taskId });
  await Task.deleteOne({ _id: taskId, companyId });
  return { message: "Task deleted successfully" };
};

export const updateTaskProgressService = async (taskId, { progress, updateMessage }, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const task = await Task.findOne({ _id: taskId, companyId });
  if (!task) throw new Error("Task not found.");

  const progressBefore = task.progress;
  const progressAfter = Math.min(100, Math.max(0, Number(progress)));
  task.progress = progressAfter;

  if (progressAfter === 100 && task.status !== "COMPLETED") {
    task.status = "COMPLETED";
    task.completedAt = new Date();
  } else if (progressAfter < 100 && task.status === "COMPLETED") {
    task.status = "IN_PROGRESS";
    task.completedAt = null;
  }

  await task.save();

  const empId = await getPrimaryEmployeeId(reqUser);
  const taskUpdate = new TaskUpdate({
    companyId,
    taskId,
    employeeId: empId,
    updateMessage: updateMessage || `Progress updated from ${progressBefore}% to ${progressAfter}%`,
    progressBefore,
    progressAfter,
  });

  await taskUpdate.save();

  if (task.assignedBy && task.assignedBy.toString() !== reqUser.id.toString()) {
    await createNotificationService({
      companyId,
      recipientId: task.assignedBy,
      title: task.status === "COMPLETED" ? "Task Completed" : "Task Progress Updated",
      message: `Task '${task.title}' updated to ${progressAfter}%`,
      type: "TASK_UPDATED",
      link: "/projects",
    });
  }

  const updatedTask = await Task.findOne({ _id: taskId, companyId })
    .populate("assignedTo", "name email role department employeeId")
    .populate("assignedBy", "name email role")
    .populate("projectId", "name projectCode")
    .populate("milestoneId", "title status");

  return { task: updatedTask, update: taskUpdate };
};

export const addTaskUpdateService = async (taskId, { updateMessage, progress }, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  if (!updateMessage) {
    throw new Error("Update message is required.");
  }

  const task = await Task.findOne({ _id: taskId, companyId });
  if (!task) throw new Error("Task not found.");

  const progressBefore = task.progress;
  const progressAfter = progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : progressBefore;

  task.progress = progressAfter;
  if (progressAfter === 100 && task.status !== "COMPLETED") {
    task.status = "COMPLETED";
    task.completedAt = new Date();
  } else if (progressAfter < 100 && task.status === "COMPLETED") {
    task.status = "IN_PROGRESS";
    task.completedAt = null;
  }

  await task.save();

  const empId = await getPrimaryEmployeeId(reqUser);
  const taskUpdate = new TaskUpdate({
    companyId,
    taskId,
    employeeId: empId,
    updateMessage,
    progressBefore,
    progressAfter,
  });

  await taskUpdate.save();
  return taskUpdate;
};

export const getTaskUpdatesService = async (taskId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const task = await Task.findOne({ _id: taskId, companyId });
  if (!task) throw new Error("Task not found.");

  return await TaskUpdate.find({ companyId, taskId })
    .sort({ createdAt: -1 })
    .populate("employeeId", "name email department employeeId role");
};
