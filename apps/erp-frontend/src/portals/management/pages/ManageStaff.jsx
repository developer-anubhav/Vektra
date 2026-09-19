import { useEffect, useState } from "react"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Table from "../../../components/ui/Table"
import Modal from "../../../components/ui/Modal"
import Loader from "../../../components/ui/Loader"
import { getEmployees, addStaff, updateEmployee, deleteEmployee } from "../../../api/employeeApi"

export default function ManageStaff() {
  const [employees, setEmployees] = useState([])
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    role: "HR",
    password: ""
  })

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    role: "HR",
    status: "Active",
    password: ""
  })

  const columns = ["ID", "Name", "Department", "Role", "Status"]

  const loadStaff = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const res = await getEmployees()
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.employees || res.data?.data || [])
      // Filter for HR/Managers/Employees
      const staff = data.filter(emp => emp.role === "HR" || emp.role === "MANAGER" || emp.role === "EMPLOYEE")
      setEmployees(staff)
    } catch (err) {
      console.error(err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff(true)
  }, [])

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await addStaff(formData)
      setOpen(false)
      setFormData({ name: "", email: "", employeeId: "", department: "", role: "HR", password: "" })
      await loadStaff()
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create staff")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditClick = (emp) => {
    setSelectedStaff(emp)
    setEditFormData({
      name: emp.name || "",
      email: emp.email || "",
      employeeId: emp.employeeId || "",
      department: emp.department || "",
      role: emp.role || "HR",
      status: emp.status || "Active",
      password: ""
    })
    setEditOpen(true)
  }

  const handleUpdateStaff = async (e) => {
    e.preventDefault()
    if (!selectedStaff?._id) return
    setActionLoading(true)
    try {
      const payload = { ...editFormData }
      if (!payload.password) delete payload.password // don't overwrite if empty
      await updateEmployee(selectedStaff._id, payload)
      setEditOpen(false)
      setSelectedStaff(null)
      await loadStaff()
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update staff member")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member? This will permanently purge their workspace account and credentials.")) return
    setActionLoading(true)
    try {
      await deleteEmployee(id)
      await loadStaff()
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff member")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
          {actionLoading && <div className="fixed inset-0 z-[100]"><Loader fullScreen={true} /></div>}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manage Staff</h1>
              <p className="text-slate-500 mt-1">Create and manage HR, Managers, and Employees</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 text-sm"
            >
              Add Staff Member
            </button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={employees}
                onEdit={handleEditClick}
                onDelete={handleDeleteStaff}
              />
            </div>
          </Card>

          {/* CREATE STAFF MODAL */}
          <Modal open={open} onClose={() => setOpen(false)} title="Create Staff Member">
            <form onSubmit={handleCreateStaff} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Employee ID</label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Department</label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Role</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="HR">HR</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Initial Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Default if left blank: Vektra@2026"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank to assign default password: <code className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1 py-0.5 rounded">Vektra@2026</code></p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-4 text-sm shadow-sm active:scale-95"
              >
                Create Staff Account
              </button>
            </form>
          </Modal>

          {/* EDIT STAFF MODAL */}
          <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Staff Member">
            <form onSubmit={handleUpdateStaff} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Employee ID</label>
                  <input
                    required
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed"
                    value={editFormData.employeeId}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Department</label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={editFormData.department}
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Role</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="HR">HR</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Status</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1.5">New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={editFormData.password}
                  onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-4 text-sm shadow-sm active:scale-95"
              >
                Save Changes
              </button>
            </form>
          </Modal>
        </>
      )}
    </MainLayout>
  )
}
