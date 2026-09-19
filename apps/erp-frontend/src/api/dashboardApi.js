import api from "./axios"

export const getDashboardStats = () => api.get("/reports/dashboard")
export const getAttendanceSummary = () => api.get("/reports/attendance-summary")
export const getEmployeeStatus = () => api.get("/reports/employee-status")