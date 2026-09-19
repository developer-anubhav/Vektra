import api from "./axios"

// Attendance Report
export const getAttendanceReport = () =>
  api.get("/reports/attendance")

// Payroll Report
export const getPayrollReport = () =>
  api.get("/reports/payroll")
