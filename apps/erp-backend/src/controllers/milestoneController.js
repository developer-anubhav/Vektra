import {
  createMilestoneService,
  getMilestonesService,
  updateMilestoneService,
  deleteMilestoneService,
} from "../services/milestoneService.js";

export const createMilestone = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const milestone = await createMilestoneService(projectId, req.body, req.user);
    return res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : error.message.includes("required") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getMilestones = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const milestones = await getMilestonesService(projectId, req.user);
    return res.status(200).json({ success: true, count: milestones.length, data: milestones });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const milestone = await updateMilestoneService(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const deleteMilestone = async (req, res) => {
  try {
    const result = await deleteMilestoneService(req.params.id, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
