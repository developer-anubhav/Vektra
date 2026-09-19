import {
  createTaskService,
  getTasksService,
  getMyTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  updateTaskProgressService,
  addTaskUpdateService,
  getTaskUpdatesService,
} from "../services/taskService.js";

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.body, req.user);
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("required") || error.message.includes("belong to your company") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await getTasksService(req.user, req.query);
    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await getMyTasksService(req.user, req.query);
    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await getTaskByIdService(req.params.id, req.user);
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await updateTaskService(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("belong to your company") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const result = await deleteTaskService(req.params.id, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const updateTaskProgress = async (req, res) => {
  try {
    const { progress, updateMessage } = req.body;
    if (progress === undefined) {
      return res.status(400).json({ success: false, message: "Progress value is required" });
    }
    const result = await updateTaskProgressService(req.params.id, { progress, updateMessage }, req.user);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const addTaskUpdate = async (req, res) => {
  try {
    const update = await addTaskUpdateService(req.params.id, req.body, req.user);
    return res.status(201).json({ success: true, data: update });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("required") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getTaskUpdates = async (req, res) => {
  try {
    const updates = await getTaskUpdatesService(req.params.id, req.user);
    return res.status(200).json({ success: true, count: updates.length, data: updates });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
