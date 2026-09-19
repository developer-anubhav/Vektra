import api from "./axios"

export const getPayroll = () => api.get("/payroll")
export const addPayroll = data => api.post("/payroll", data)
export const updatePayroll = (id, data) => api.put(`/payroll/${id}`, data)
export const deletePayroll = id => api.delete(`/payroll/${id}`)
