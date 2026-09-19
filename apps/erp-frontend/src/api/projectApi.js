import api from "./axios";

// Project API
export const fetchProjectsApi = (params) => api.get("/projects", { params });
export const fetchProjectByIdApi = (id) => api.get(`/projects/${id}`);
export const createProjectApi = (data) => api.post("/projects", data);
export const updateProjectApi = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProjectApi = (id) => api.delete(`/projects/${id}`);
export const fetchProjectAnalyticsApi = () => api.get("/projects/analytics");

// Team Members API
export const fetchProjectMembersApi = (id) => api.get(`/projects/${id}/members`);
export const addTeamMembersApi = (id, employeeIds) => api.post(`/projects/${id}/members`, { employeeIds });
export const removeTeamMemberApi = (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`);

// Milestone API
export const fetchMilestonesApi = (projectId) => api.get(`/projects/${projectId}/milestones`);
export const createMilestoneApi = (projectId, data) => api.post(`/projects/${projectId}/milestones`, data);
export const updateMilestoneApi = (milestoneId, data) => api.put(`/milestones/${milestoneId}`, data);
export const deleteMilestoneApi = (milestoneId) => api.delete(`/milestones/${milestoneId}`);

// Task API
export const fetchTasksApi = (params) => api.get("/tasks", { params });
export const fetchMyTasksApi = (params) => api.get("/tasks/my-tasks", { params });
export const fetchTaskByIdApi = (id) => api.get(`/tasks/${id}`);
export const createTaskApi = (data) => api.post("/tasks", data);
export const updateTaskApi = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTaskApi = (id) => api.delete(`/tasks/${id}`);

// Task Progress & Updates API
export const updateTaskProgressApi = (id, data) => api.put(`/tasks/${id}/progress`, data);
export const addTaskUpdateApi = (id, data) => api.post(`/tasks/${id}/updates`, data);
export const fetchTaskUpdatesApi = (id) => api.get(`/tasks/${id}/updates`);
