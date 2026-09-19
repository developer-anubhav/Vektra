import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import { getCache, setCache, invalidateTenantCache } from "../config/redis.js";

const CACHE_TTL_SECONDS = 60;

export const invalidateAnalyticsCache = async (companyId) => {
  await invalidateTenantCache(companyId);
};

export const getProjectAnalyticsService = async (reqUser) => {
  const companyId = reqUser.companyId;
  if (!companyId) throw new Error("Company ID missing from user context.");

  const cacheKey = `analytics:${companyId.toString()}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return { ...cachedData, cached: true };
  }

  const projects = await Project.find({ companyId })
    .populate("projectManager", "name email department employeeId role")
    .populate("teamMembers", "name email department employeeId role");

  const tasks = await Task.find({ companyId })
    .populate("assignedTo", "name email department employeeId role")
    .populate("projectId", "name projectCode");

  const employees = await Employee.find({ companyId, status: "Active" }).select("_id name email department employeeId role");

  const now = new Date();

  // 1. Completion Rate & Task Distribution
  const totalTasks = tasks.length;
  let completedTasksCount = 0;
  const taskDistribution = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    COMPLETED: 0,
    BLOCKED: 0,
  };

  const overdueTasksList = [];

  tasks.forEach((t) => {
    if (taskDistribution[t.status] !== undefined) {
      taskDistribution[t.status]++;
    }
    if (t.status === "COMPLETED") {
      completedTasksCount++;
    }

    const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED";
    if (isOverdue) {
      overdueTasksList.push({
        _id: t._id,
        title: t.title,
        projectId: t.projectId,
        assignedTo: t.assignedTo,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      });
    }
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // 2. Employee Workload
  const employeeWorkloadMap = new Map();
  employees.forEach((emp) => {
    employeeWorkloadMap.set(emp._id.toString(), {
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      assignedTasksCount: 0,
      completedTasksCount: 0,
      inProgressTasksCount: 0,
      overdueTasksCount: 0,
    });
  });

  tasks.forEach((t) => {
    t.assignedTo.forEach((emp) => {
      const empIdStr = emp._id?.toString() || emp.toString();
      if (employeeWorkloadMap.has(empIdStr)) {
        const workload = employeeWorkloadMap.get(empIdStr);
        workload.assignedTasksCount++;
        if (t.status === "COMPLETED") workload.completedTasksCount++;
        if (t.status === "IN_PROGRESS") workload.inProgressTasksCount++;
        if (t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED") workload.overdueTasksCount++;
      }
    });
  });

  const employeeWorkload = Array.from(employeeWorkloadMap.values());

  // 3. Project Health (🟢 GREEN / 🟡 YELLOW / 🔴 RED)
  const projectHealthList = projects.map((p) => {
    const pIdStr = p._id.toString();
    const projectTasks = tasks.filter((t) => (t.projectId?._id?.toString() || t.projectId?.toString()) === pIdStr);
    const pTotalTasks = projectTasks.length;
    const pCompletedTasks = projectTasks.filter((t) => t.status === "COMPLETED").length;
    const pOverdueTasks = projectTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED").length;

    const pCompletionRate = pTotalTasks > 0 ? Math.round((pCompletedTasks / pTotalTasks) * 100) : p.actualProgress || 0;

    let health = "GREEN"; // 🟢
    const isPastDeadline = p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED";

    if (pCompletionRate < 40 || pOverdueTasks > 2 || isPastDeadline) {
      health = "RED"; // 🔴
    } else if (pCompletionRate < 75 || pOverdueTasks > 0) {
      health = "YELLOW"; // 🟡
    }

    return {
      _id: p._id,
      projectCode: p.projectCode,
      name: p.name,
      status: p.status,
      priority: p.priority,
      projectManager: p.projectManager,
      startDate: p.startDate,
      endDate: p.endDate,
      completionRate: pCompletionRate,
      totalTasks: pTotalTasks,
      completedTasks: pCompletedTasks,
      overdueTasksCount: pOverdueTasks,
      health,
    };
  });

  const analyticsData = {
    summary: {
      totalProjects: projects.length,
      totalTasks,
      completedTasksCount,
      overdueTasksCount: overdueTasksList.length,
      completionRate,
    },
    taskDistribution,
    employeeWorkload,
    overdueTasks: overdueTasksList,
    projectHealth: projectHealthList,
    cached: false,
  };

  await setCache(cacheKey, analyticsData, CACHE_TTL_SECONDS);
  return analyticsData;
};
