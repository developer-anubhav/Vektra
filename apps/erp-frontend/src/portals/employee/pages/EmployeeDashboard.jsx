import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CalendarCheck, Clock, User, MapPin, 
  CheckCircle, XCircle, AlertCircle, 
  Loader2, LogOut, ChevronDown, 
  Home, CreditCard, FileText, Settings, Mail, Shield, 
  Menu, X, Key, FileDown, Download, Building2, Phone, BadgePercent
} from "lucide-react"
import api from "../../../api/axios"
import Loader from "../../../components/ui/Loader"
import { getDocuments, downloadDocument } from "../../../api/documentApi"
import CopilotDrawer from "../../../components/copilot/CopilotDrawer"

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Navigation & UI states
  const [activeTab, setActiveTab] = useState("dashboard") // dashboard, attendance, payroll, documents, settings
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Data loading states
  const [employeeProfile, setEmployeeProfile] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [payrollHistory, setPayrollHistory] = useState([])
  const [companyDocuments, setCompanyDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [downloadingDocId, setDownloadingDocId] = useState(null)
  const [docCategoryFilter, setDocCategoryFilter] = useState("ALL")
  
  // Action states
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Settings tab states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [settingsError, setSettingsError] = useState("")
  const [settingsSuccess, setSettingsSuccess] = useState("")
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Mobile time/date
  const [timeStr, setTimeStr] = useState("")
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      const today = new Date()
      setTimeStr(today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
      setDateStr(today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      navigate("/login")
    }
  }, [user, navigate])

  // 1. Fetch Today's Attendance on Mount
  useEffect(() => {
    fetchTodayAttendance()
  }, [])

  // 2. Fetch Employee Profile (to get internal employee subdocument _id)
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get("/employees")
        // Find matching employee record by email
        const profile = res.data.find(emp => emp.email.toLowerCase() === user.email.toLowerCase())
        setEmployeeProfile(profile)
      } catch (err) {
        console.error("Failed to load employee profile:", err)
      }
    }
    if (user?.email) {
      loadProfile()
    }
  }, [user])

  // 3. Load tab specific data
  useEffect(() => {
    if (activeTab === "documents") {
      fetchCompanyDocuments()
    }
  }, [activeTab, docCategoryFilter])

  useEffect(() => {
    if (!employeeProfile) return

    if (activeTab === "attendance") {
      fetchAttendanceHistory()
    } else if (activeTab === "payroll") {
      fetchPayrollHistory()
    }
  }, [activeTab, employeeProfile])

  const fetchCompanyDocuments = async () => {
    setLoadingDocs(true)
    try {
      const res = await getDocuments({ category: docCategoryFilter })
      setCompanyDocuments(res.data?.data || [])
    } catch (err) {
      console.error("Failed to fetch company documents:", err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleDocumentDownload = async (doc) => {
    try {
      setDownloadingDocId(doc._id)
      await downloadDocument(doc._id, doc.fileName)
    } catch (err) {
      console.error("Download failed:", err)
      alert("Failed to download document.")
    } finally {
      setDownloadingDocId(null)
    }
  }

  const fetchTodayAttendance = async () => {
    setLoadingToday(true)
    try {
      const res = await api.get("/attendance/today")
      if (res.data?.success) {
        setTodayAttendance(res.data.data)
      }
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err)
    } finally {
      setLoadingToday(false)
    }
  }

  const fetchAttendanceHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await api.get("/attendance")
      // Filter records that belong to this employee
      const filtered = res.data
        .filter(att => att.employeeId.toString() === employeeProfile._id.toString())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setAttendanceHistory(filtered)
    } catch (err) {
      console.error("Failed to fetch attendance history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchPayrollHistory = async () => {
    setLoadingPayroll(true)
    try {
      const res = await api.get("/payroll")
      // Filter payroll documents that belong to this employee
      const filtered = res.data
        .filter(pay => pay.employeeId.toString() === employeeProfile._id.toString())
        .sort((a, b) => b.month.localeCompare(a.month))
      setPayrollHistory(filtered)
    } catch (err) {
      console.error("Failed to fetch payroll history:", err)
    } finally {
      setLoadingPayroll(false)
    }
  }

  const handleCheckIn = async (type) => {
    setActionLoading(true)
    try {
      const res = await api.post("/attendance/checkin", { type })
      if (res.data?.success) {
        setTodayAttendance(res.data.data)
      }
    } catch (err) {
      console.error("Self check-in action failed:", err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSettingsError("")
    setSettingsSuccess("")
    
    if (newPassword !== confirmPassword) {
      setSettingsError("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setSettingsError("Password must be at least 6 characters long")
      return
    }

    setSettingsLoading(true)
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword
      })
      if (res.data?.success) {
        setSettingsSuccess("Password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      setSettingsError(err.response?.data?.message || "Failed to change password. Make sure current password is correct.")
    } finally {
      setSettingsLoading(false)
    }
  }

  // Dashboard configuration mappings
  const todayStatus = todayAttendance?.status || "NOT_CHECKED_IN"
  const statusConfig = {
    Present: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-100", label: "Present" },
    Late: { icon: AlertCircle, color: "text-amber-600 bg-amber-50 border-amber-100", label: "Late" },
    Absent: { icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-100", label: "Absent" },
    "Half Day": { icon: Clock, color: "text-orange-655 bg-orange-50 border-orange-100", label: "Half Day" },
    Leave: { icon: CalendarCheck, color: "text-blue-600 bg-blue-50 border-blue-100", label: "Leave Approved" },
    NOT_CHECKED_IN: { icon: Clock, color: "text-slate-500 bg-slate-100 border-slate-205", label: "Not Checked In" },
  }

  const currentStatusConfig = statusConfig[todayStatus] || statusConfig.NOT_CHECKED_IN
  const StatusIcon = currentStatusConfig.icon
  const statusStyle = currentStatusConfig.color
  const statusLabel = currentStatusConfig.label

  // Nav Items definition
  const navItems = [
    { id: "dashboard", name: "My Dashboard", icon: Home },
    { id: "attendance", name: "Attendance", icon: CalendarCheck },
    { id: "payroll", name: "Payroll", icon: CreditCard },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "settings", name: "Settings", icon: Settings },
  ]

  // Mock corporate documents
  const mockDocuments = [
    { name: "Employment Contract.pdf", type: "PDF", size: "2.4 MB", date: "Jan 12, 2026", status: "Signed" },
    { name: "Vektra Employee Handbook 2026.pdf", type: "PDF", size: "5.8 MB", date: "Feb 01, 2026", status: "Reviewed" },
    { name: "IT Security and Device Policies.pdf", type: "PDF", size: "1.1 MB", date: "Feb 10, 2026", status: "Signed" },
    { name: "Leave Policy Guidelines.pdf", type: "PDF", size: "850 KB", date: "Mar 15, 2026", status: "Shared" },
  ]

  // Tab Rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Today's Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Today's Status</p>
                    <p className="text-xl font-bold text-slate-800 capitalize">{statusLabel}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${statusStyle} border`}>
                    <StatusIcon size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Check-In</p>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {todayAttendance?.checkInTime 
                        ? new Date(todayAttendance.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) 
                        : "--:--"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <Clock size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Check-Out</p>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {todayAttendance?.checkOutTime 
                        ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) 
                        : "--:--"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Clock size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Hours</p>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {todayAttendance?.workDurationMinutes 
                        ? `${(todayAttendance.workDurationMinutes / 60).toFixed(1)} hrs` 
                        : "0.0 hrs"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Employee Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <CalendarCheck size={22} className="text-emerald-600" />
                  Attendance Portal
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Log your daily working hours directly. Choose mobile check-in to use the high-security geofenced facial recognition camera.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todayStatus === "NOT_CHECKED_IN" ? (
                    <button
                      onClick={() => handleCheckIn("CHECK_IN")}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm active:scale-95"
                    >
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
                      <span>Regular Check In</span>
                    </button>
                  ) : !todayAttendance?.checkOutTime ? (
                    <button
                      onClick={() => handleCheckIn("CHECK_OUT")}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm active:scale-95"
                    >
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                      <span>Regular Check Out</span>
                    </button>
                  ) : (
                    <div className="sm:col-span-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center text-emerald-800 font-semibold text-sm">
                      🎉 Shifts completed and logged for today!
                    </div>
                  )}

                  <button 
                    onClick={() => navigate("/mobile-checkin")}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2 shadow-sm text-sm active:scale-95"
                  >
                    <MapPin size={18} className="text-emerald-600" />
                    <span>Selfie Check-In</span>
                  </button>
                </div>
              </div>

              {/* Employee Info Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <User size={22} className="text-emerald-600" />
                  Staff Profile Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Employee ID</p>
                    <p className="font-bold text-slate-800 truncate">{employeeProfile?.employeeId || "WS-PENDING"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</p>
                    <p className="font-bold text-slate-800 truncate">{employeeProfile?.department || "General"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Office Location</p>
                    <p className="font-bold text-slate-800 truncate">Main Office / HQ</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Shift Start</p>
                    <p className="font-bold text-emerald-600 truncate">09:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "attendance":
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <CalendarCheck size={22} className="text-emerald-600" />
                  Attendance Log
                </h3>
                <p className="text-sm text-slate-500 mt-1">Review your monthly check-in times and statuses.</p>
              </div>
              <button 
                onClick={fetchAttendanceHistory}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all self-start sm:self-center shadow-sm active:scale-95"
              >
                <Clock size={14} /> Refresh Logs
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={36} className="text-emerald-500 animate-spin" />
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <CalendarCheck size={48} className="mx-auto mb-4 opacity-20 text-slate-350" />
                <p className="font-bold">No attendance records found</p>
                <p className="text-xs mt-1">Your logs will appear here once you check in.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Check In</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Check Out</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Duration</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Method</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600 bg-white">
                    {attendanceHistory.map((rec) => {
                      const recStatus = rec.status || "Present"
                      const statusBadges = {
                        Present: "bg-emerald-50 text-emerald-600 border-emerald-100",
                        Late: "bg-amber-50 text-amber-600 border-amber-100",
                        Absent: "bg-rose-50 text-rose-600 border-rose-100",
                        "Half Day": "bg-purple-50 text-purple-650 border-purple-100",
                      }
                      const badgeClass = statusBadges[recStatus] || "bg-slate-50 text-slate-500 border-slate-200"

                      return (
                        <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">
                            {new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">
                            {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">
                            {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                          </td>
                          <td className="p-4 text-slate-500">
                            {rec.workDurationMinutes ? `${(rec.workDurationMinutes / 60).toFixed(1)} hrs` : rec.checkInTime && !rec.checkOutTime ? "Active Shift" : "--"}
                          </td>
                          <td className="p-4 text-xs text-slate-400">{rec.verificationMethod || "Manual"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${badgeClass}`}>
                              {recStatus}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case "payroll":
        return (
          <div className="space-y-8">
            {/* Payroll Info Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Basic Salary</p>
                <p className="text-2xl font-extrabold text-slate-800">₹{employeeProfile?.monthlySalary?.toLocaleString() || "0"}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <Building2 size={12} className="text-emerald-600" /> Base Pay Rate
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Estimated Net Payout</p>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono">₹{employeeProfile?.monthlySalary?.toLocaleString() || "0"}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <BadgePercent size={12} className="text-emerald-600" /> Base + Allowances
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Pay Cycle</p>
                <p className="text-2xl font-extrabold text-slate-800">Monthly</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <Clock size={12} className="text-emerald-600" /> Auto credit on 1st
                </div>
              </div>
            </div>

            {/* Payslips Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <CreditCard size={22} className="text-emerald-600" />
                    Salary Slips
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Download generated monthly payslips and tax forms.</p>
                </div>
                <button 
                  onClick={fetchPayrollHistory}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <Clock size={14} /> Refresh History
                </button>
              </div>

              {loadingPayroll ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={36} className="text-emerald-500 animate-spin" />
                </div>
              ) : payrollHistory.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-20 text-slate-350" />
                  <p className="font-bold">No payslips generated yet</p>
                  <p className="text-xs mt-1">Your slips will appear here once payroll is processed by HR.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Month</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Basic Salary</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Allowances</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Deductions</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Net Salary</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600 bg-white">
                      {payrollHistory.map((pay) => (
                        <tr key={pay._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{pay.month}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">₹{pay.basicSalary?.toLocaleString()}</td>
                          <td className="p-4 font-mono text-xs text-emerald-600">+₹{pay.allowances?.toLocaleString() || "0"}</td>
                          <td className="p-4 font-mono text-xs text-rose-600">-₹{pay.deductions?.toLocaleString() || "0"}</td>
                          <td className="p-4 font-bold text-slate-800">₹{pay.netSalary?.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <button className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-100 transition-all inline-flex items-center gap-1.5 text-xs font-bold shadow-sm">
                              <Download size={14} /> Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case "documents":
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <FileText size={22} className="text-emerald-600" />
                  Company Documents
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Access official policies, handbooks, and compliance documentation.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {["ALL", "TERMS_AND_CONDITIONS", "POLICY", "HANDBOOK", "COMPLIANCE", "OTHER"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDocCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      docCategoryFilter === cat
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "ALL" ? "All" : cat.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {loadingDocs ? (
              <div className="py-12 flex justify-center">
                <Loader />
              </div>
            ) : companyDocuments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200/60 rounded-3xl space-y-2">
                <FileText size={32} className="mx-auto text-slate-400" />
                <h4 className="font-semibold text-slate-700 text-sm">No documents available</h4>
                <p className="text-xs text-slate-500">
                  There are no documents uploaded in this category for your organization yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-5 bg-slate-50 border border-slate-200/60 hover:border-slate-300 rounded-3xl flex items-start gap-4 transition-all shadow-sm group"
                  >
                    <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex-shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate text-sm group-hover:text-emerald-600 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-extrabold uppercase rounded">
                          {doc.category.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(doc.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDocumentDownload(doc)}
                      disabled={downloadingDocId === doc._id}
                      className="p-2.5 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all self-center shadow-sm disabled:opacity-50"
                      title="Download File"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "settings":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 h-fit">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <User size={22} className="text-emerald-600" />
                Personal Profile
              </h3>
              
              <div className="flex flex-col items-center py-6 border-b border-slate-100">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                  <User size={48} />
                </div>
                <h4 className="text-slate-800 font-bold text-lg text-center leading-tight">{employeeProfile?.name || user?.name}</h4>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-extrabold">{employeeProfile?.department || "General Department"} • {employeeProfile?.employeeId || "STAFF"}</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{employeeProfile?.email || user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{employeeProfile?.phoneNumber || "Not configured"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Shield size={16} className="text-slate-400" />
                  <span className="capitalize">{employeeProfile?.role || "Employee"} Role</span>
                </div>
              </div>
            </div>

            {/* Change Password Panel */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <Key size={22} className="text-emerald-600" />
                  Account Security
                </h3>
                <p className="text-sm text-slate-500 mt-1">Configure your login credentials and change password.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                {settingsError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    {settingsError}
                  </div>
                )}
                {settingsSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                    <CheckCircle size={18} />
                    {settingsSuccess}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 placeholder-slate-455 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-sm"
                >
                  {settingsLoading && <Loader2 size={16} className="animate-spin" />}
                  <span>Save Password Changes</span>
                </button>
              </form>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative selection:bg-emerald-500/10 font-sans text-slate-600">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/[0.01] rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/[0.01] rounded-full filter blur-[120px] pointer-none"></div>

      {/* left Sidebar - Matches User Image */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#161a29] border-r border-slate-800 text-slate-400 w-72 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 flex items-center justify-between">
          <img src="/Vektra-dark.png" alt="Vektra" className="h-8 md:h-9 w-auto object-contain" />
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* User Card Header */}
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <User size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base leading-tight truncate">{user?.name || "Employee"}</h2>
              <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mt-1">Employee</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 truncate">{user?.email}</p>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-emerald-400" : "text-slate-400"} />
                <span className="text-sm">{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 rounded-xl transition-all group font-semibold"
          >
            <LogOut size={20} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Right Content Panel */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        
        {/* Top Header Bar */}
        <header className="h-20 flex-shrink-0 border-b border-slate-200 flex items-center justify-between px-6 md:px-10 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <img src="/Vektra.png" alt="Vektra" className="h-7 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-black text-slate-800">Employee Portal</h1>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{dateStr || "Loading date..."}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{timeStr || "Loading time..."}</p>
          </div>
        </header>

        {/* Main scrollable body */}
        <main className="p-6 md:p-10 flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header welcome banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  Welcome, {user?.name?.split(" ")[0] || "Employee"}!
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                  {activeTab === "dashboard" && "Here is your summary of achievements and shifts today."}
                  {activeTab === "attendance" && "Detailed review of your attendance history logs."}
                  {activeTab === "payroll" && "Your monthly payments ledger and breakdowns."}
                  {activeTab === "documents" && "Verify and download your employment paperwork."}
                  {activeTab === "settings" && "Adjust password options and account profile details."}
                </p>
              </div>

              {activeTab === "dashboard" && (
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${statusStyle} text-xs font-bold shadow-sm`}>
                  <StatusIcon size={16} />
                  <span>{statusLabel}</span>
                </div>
              )}
            </div>

            {/* Render selected tab panel */}
            <Suspense fallback={<Loader fullScreen={false} />}>
              {renderTabContent()}
            </Suspense>

          </div>
        </main>
      </div>

      {/* Vektra AI Co-Pilot Floating Drawer */}
      <CopilotDrawer />
    </div>
  )
}

// React lazy-loading support fallback container
function Suspense({ children, fallback }) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  if (!isMounted) return fallback
  return children
}
