import Milestone from "../models/Milestone.js";
import Project from "../models/Project.js";
import Employee from "../models/Employee.js";

const getUserEmployeeIds = async (reqUser) => {
  const userIds = [reqUser.id];
  if (reqUser.email) {
    const emp = await Employee.findOne({ email: reqUser.email.toLowerCase().trim(), companyId: reqUser.companyId });
    if (emp) userIds.push(emp._id);
  }
  return userIds;
};

const checkProjectAccess = async (projectId, reqUser, isMutation = false) => {
  const companyId = reqUser.companyId;
  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) {
    throw new Error("Project not found.");
  }

  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER" || userRole === "EMPLOYEE") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m.toString()));

    if (isMutation && userRole === "MANAGER" && !isPM && !isMember) {
      throw new Error("Access denied. You are not assigned to this project.");
    }
    if (!isMutation && userRole === "EMPLOYEE" && !isMember) {
      throw new Error("Access denied. You are not a team member on this project.");
    }
  }
  return project;
};

export const createMilestoneService = async (projectId, milestoneData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  await checkProjectAccess(projectId, reqUser, true);

  const { title, description, dueDate, status, progress } = milestoneData;
  if (!title) {
    throw new Error("Milestone title is required.");
  }

  const milestone = new Milestone({
    companyId,
    projectId,
    title,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: status || "NOT_STARTED",
    progress: progress !== undefined ? progress : 0,
    createdBy: reqUser.id,
  });

  await milestone.save();
  return milestone;
};

export const getMilestonesService = async (projectId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  await checkProjectAccess(projectId, reqUser, false);

  return await Milestone.find({ companyId, projectId }).sort({ dueDate: 1, createdAt: 1 });
};

export const updateMilestoneService = async (milestoneId, updateData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const milestone = await Milestone.findOne({ _id: milestoneId, companyId });
  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  await checkProjectAccess(milestone.projectId, reqUser, true);

  if (updateData.title !== undefined) milestone.title = updateData.title;
  if (updateData.description !== undefined) milestone.description = updateData.description;
  if (updateData.dueDate !== undefined) milestone.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
  if (updateData.status !== undefined) milestone.status = updateData.status;
  if (updateData.progress !== undefined) milestone.progress = updateData.progress;

  await milestone.save();
  return milestone;
};

export const deleteMilestoneService = async (milestoneId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const milestone = await Milestone.findOne({ _id: milestoneId, companyId });
  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  await checkProjectAccess(milestone.projectId, reqUser, true);

  await Milestone.deleteOne({ _id: milestoneId, companyId });
  return { message: "Milestone deleted successfully" };
};
