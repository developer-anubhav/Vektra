import { useState } from "react"
import Input from "../../../components/ui/Input"
import Select from "../../../components/ui/Select"
import { Eye, EyeOff, Lock, Info, AlertCircle } from "lucide-react"

export default function EditEmployeeForm({ initial, onSubmit }) {

  const [form, setForm] = useState({
    employeeId: initial.employeeId,
    name: initial.name,
    email: initial.email,
    phoneNumber: initial.phoneNumber || "",
    department: initial.department,
    role: initial.role,
    monthlySalary: initial.monthlySalary ?? "",
    status: initial.status,
    password: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <Input
        name="employeeId"
        value={form.employeeId}
        onChange={handleChange}
      />

      <Input
        name="name"
        value={form.name}
        onChange={handleChange}
      />

      <Input
        name="email"
        value={form.email}
        onChange={handleChange}
      />

      <Input
        name="phoneNumber"
        value={form.phoneNumber}
        onChange={handleChange}
      />

      <Select
        name="department"
        value={form.department}
        onChange={handleChange}
      >
        <option value="">Select Department</option>
        <option value="Engineering">Engineering</option>
        <option value="HR">HR</option>
        <option value="Finance">Finance</option>
      </Select>

      <Select
        name="role"
        value={form.role}
        onChange={handleChange}
      >
        <option value="EMPLOYEE">Employee</option>
        <option value="HR">HR</option>
        <option value="MANAGER">Manager</option>
      </Select>

      <Input
        type="number"
        min="0"
        step="0.01"
        name="monthlySalary"
        value={form.monthlySalary}
        onChange={handleChange}
      />

      <Select
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
          <Lock size={14} className="text-slate-500" />
          Reset Password
        </label>
        <div className="relative group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Leave blank to keep current password"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-4 pr-12 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Info size={12} />
          <span>Leave blank to keep current password</span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2"
      >
        <span>Update Employee</span>
      </button>

    </form>
  )
}
