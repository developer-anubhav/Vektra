import api from "./axios"

export const getAttendance = () =>
  api.get("/attendance")

export const markAttendance = (data) =>
  api.post("/attendance", data)

export const updateAttendance = (id, data) =>
  api.put(`/attendance/${id}`, data)

export const deleteAttendance = (id) =>
  api.delete(`/attendance/${id}`)

export const getShiftSettings = () =>
  api.get("/attendance/shift-settings")

export const updateShiftSettings = (data) =>
  api.put("/attendance/shift-settings", data)
