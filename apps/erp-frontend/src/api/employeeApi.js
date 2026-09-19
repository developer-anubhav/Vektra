import api from "./axios"


// Optionally pass department or search query to filter
export const getEmployees = (department, search) => {
  let url = "/employees"
  const params = new URLSearchParams()
  if (department) params.append("department", department)
  if (search) params.append("search", search)
  
  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }
  
  return api.get(url)
}

export const addEmployee = (data) =>
  api.post("/employees", data)

export const addStaff = (data) =>
  api.post("/employees/create-staff", data)

export const updateEmployee = (id, data) =>
  api.put(`/employees/${id}`, data)

export const deleteEmployee = (id) =>
  api.delete(`/employees/${id}`)
