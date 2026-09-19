import Project from "../models/Project.js";
import Employee from "../models/Employee.js";
import User from "../models/userModel.js";
import { invalidateAnalyticsCache } from "./analyticsService.js";

// Helper to resolve user/employee IDs for role-based scoping
const getUserEmployeeIds = async (reqUser) => {
  const userIds = [reqUser.id];
  if (reqUser.email) {
    const emp = await Employee.findOne({ email: reqUser.email.toLowerCase().trim(), companyId: reqUser.companyId });
    if (emp) {
      userIds.push(emp._id);
    }
  }
  return userIds;
};

// Helper to validate manager role eligibility
const validateManagerEligibility = async (managerId, companyId) => {
  let role = null;
  const emp = await Employee.findOne({ _id: managerId, companyId });
  if (emp) {
    role = emp.role;
  } else {
    const user = await User.findOne({ _id: managerId, companyId });
    if (user) role = user.role;
  }

  if (!role) {
    throw new Error("Designated project manager does not exist in this company.");
  }

  const allowedRoles = ["MANAGER", "ADMIN", "SUPERADMIN"];
  if (!allowedRoles.includes(role.toUpperCase())) {
    throw new Error("A MANAGER or ADMIN role is required to be eligible as a project manager.");
  }
};

export const createProjectService = async (projectData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) {
    throw new Error("Company ID missing from user context.");
  }

  const { projectCode, name, description, status, priority, projectManager, teamMembers, startDate, endDate } = projectData;

  if (!projectCode || !name || !projectManager) {
    throw new Error("projectCode, name, and projectManager are required.");
  }

  // Check duplicate projectCode within companyId
  const existingCode = await Project.findOne({ companyId, projectCode: projectCode.toUpperCase().trim() });
  if (existingCode) {
    throw new Error(`Project code '${projectCode.toUpperCase().trim()}' already exists in your company.`);
  }

  // Validate Project Manager role eligibility
  await validateManagerEligibility(projectManager, companyId);

  // Validate team members companyId scope if provided
  let validatedTeamMembers = [];
  if (Array.isArray(teamMembers) && teamMembers.length > 0) {
    const validEmployees = await Employee.find({ _id: { $in: teamMembers }, companyId }).select("_id");
    if (validEmployees.length !== teamMembers.length) {
      throw new Error("Invalid employee assignment: One or more employees do not belong to your company.");
    }
    validatedTeamMembers = validEmployees.map((e) => e._id);
  }

  const newProject = new Project({
    companyId,
    projectCode: projectCode.toUpperCase().trim(),
    name,
    description: description || "",
    status: status || "PLANNING",
    priority: priority || "MEDIUM",
    projectManager,
    teamMembers: validatedTeamMembers,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    createdBy: reqUser.id,
  });

  await newProject.save();
  invalidateAnalyticsCache(companyId);
  return await Project.findOne({ _id: newProject._id, companyId })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");
};

export const getProjectsService = async (reqUser, queryFilters = {}) => {
  const companyId = reqUser.companyId;
  if (!companyId) {
    throw new Error("Company ID missing from user context.");
  }

  const filter = { companyId };

  if (queryFilters.status) {
    filter.status = queryFilters.status;
  }
  if (queryFilters.priority) {
    filter.priority = queryFilters.priority;
  }

  // Scoping based on role
  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    filter.$or = [{ projectManager: { $in: userIds } }, { teamMembers: { $in: userIds } }];
  } else if (userRole === "EMPLOYEE") {
    const userIds = await getUserEmployeeIds(reqUser);
    filter.teamMembers = { $in: userIds };
  }

  return await Project.find(filter)
    .sort({ createdAt: -1 })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");
};

export const getProjectByIdService = async (projectId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) {
    throw new Error("Company ID missing from user context.");
  }

  const project = await Project.findOne({ _id: projectId, companyId })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");

  if (!project) {
    throw new Error("Project not found.");
  }

  // Verify MANAGER / EMPLOYEE scoping
  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER" || userRole === "EMPLOYEE") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?._id?.toString() || project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m._id?.toString() || m.toString()));

    if (userRole === "MANAGER" && !isPM && !isMember) {
      throw new Error("Access denied. You are not assigned to this project.");
    }
    if (userRole === "EMPLOYEE" && !isMember) {
      throw new Error("Access denied. You are not a team member on this project.");
    }
  }

  return project;
};

export const updateProjectService = async (projectId, updateData, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) {
    throw new Error("Company ID missing from user context.");
  }

  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) {
    throw new Error("Project not found.");
  }

  // Role scoping for updates: MANAGER must be assigned to project
  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m.toString()));
    if (!isPM && !isMember) {
      throw new Error("Access denied. You can only update projects assigned to you.");
    }
  }

  if (updateData.projectManager) {
    await validateManagerEligibility(updateData.projectManager, companyId);
    project.projectManager = updateData.projectManager;
  }

  if (updateData.projectCode) {
    const formattedCode = updateData.projectCode.toUpperCase().trim();
    const existingCode = await Project.findOne({ companyId, projectCode: formattedCode, _id: { $ne: projectId } });
    if (existingCode) {
      throw new Error(`Project code '${formattedCode}' is already in use by another project.`);
    }
    project.projectCode = formattedCode;
  }

  if (updateData.name !== undefined) project.name = updateData.name;
  if (updateData.description !== undefined) project.description = updateData.description;
  if (updateData.status !== undefined) project.status = updateData.status;
  if (updateData.priority !== undefined) project.priority = updateData.priority;
  if (updateData.startDate !== undefined) project.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
  if (updateData.endDate !== undefined) project.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
  if (updateData.estimatedProgress !== undefined) project.estimatedProgress = updateData.estimatedProgress;
  if (updateData.actualProgress !== undefined) project.actualProgress = updateData.actualProgress;

  if (Array.isArray(updateData.teamMembers)) {
    const validEmployees = await Employee.find({ _id: { $in: updateData.teamMembers }, companyId }).select("_id");
    if (validEmployees.length !== updateData.teamMembers.length) {
      throw new Error("Invalid employee assignment: One or more employees do not belong to your company.");
    }
    project.teamMembers = validEmployees.map((e) => e._id);
  }

  await project.save();
  return await Project.findOne({ _id: projectId, companyId })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");
};

export const deleteProjectService = async (projectId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) {
    throw new Error("Company ID missing from user context.");
  }

  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) {
    throw new Error("Project not found.");
  }

  // Role scoping for archive/delete: MANAGER must be assigned
  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m.toString()));
    if (!isPM && !isMember) {
      throw new Error("Access denied. You can only archive projects assigned to you.");
    }
  }

  project.status = "ARCHIVED";
  await project.save();
  return { message: "Project archived successfully", project };
};

export const addTeamMembersService = async (projectId, employeeIds, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) throw new Error("Project not found.");

  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m.toString()));
    if (!isPM && !isMember) {
      throw new Error("Access denied. You are not assigned to this project.");
    }
  }

  const idsToAdd = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
  if (idsToAdd.length === 0) {
    throw new Error("No employee IDs provided for assignment.");
  }

  // Validate assigned employees belong to THIS companyId
  const validEmployees = await Employee.find({ _id: { $in: idsToAdd }, companyId }).select("_id");
  if (validEmployees.length !== idsToAdd.length) {
    throw new Error("Invalid employee assignment: One or more employees do not belong to your company.");
  }

  const existingSet = new Set(project.teamMembers.map((id) => id.toString()));
  validEmployees.forEach((emp) => existingSet.add(emp._id.toString()));
  project.teamMembers = Array.from(existingSet);

  await project.save();
  return await Project.findOne({ _id: projectId, companyId })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");
};

export const removeTeamMemberService = async (projectId, memberId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) throw new Error("Project not found.");

  const userRole = (reqUser.role || "").toUpperCase();
  if (userRole === "MANAGER") {
    const userIds = await getUserEmployeeIds(reqUser);
    const pmIdStr = project.projectManager?.toString();
    const isPM = userIds.map((id) => id.toString()).includes(pmIdStr);
    const isMember = project.teamMembers.some((m) => userIds.map((id) => id.toString()).includes(m.toString()));
    if (!isPM && !isMember) {
      throw new Error("Access denied. You are not assigned to this project.");
    }
  }

  project.teamMembers = project.teamMembers.filter((m) => m.toString() !== memberId.toString());
  await project.save();
  return await Project.findOne({ _id: projectId, companyId })
    .populate("projectManager", "name email role department employeeId")
    .populate("teamMembers", "name email role department employeeId");
};

export const getProjectMembersService = async (projectId, reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const project = await getProjectByIdService(projectId, reqUser);
  return {
    projectManager: project.projectManager,
    teamMembers: project.teamMembers,
  };
};
