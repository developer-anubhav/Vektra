import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import MainLayout from "../../layouts/MainLayout"
import Card from "../../components/ui/Card"
import Modal from "../../components/ui/Modal"
import Loader from "../../components/ui/Loader"

import {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance
} from "../../api/attendanceApi"

import { getEmployees } from "../../api/employeeApi"

import EditAttendanceForm from "../../components/hr/EditAttendanceForm"
import FacialCheckInModal from "../../components/hr/FacialCheckInModal"
import ShiftSettingsModal from "../../components/hr/ShiftSettingsModal"
import FacialAnalyticsModal from "../../components/hr/FacialAnalyticsModal"
import WorkLocationModal from "../../components/WorkLocationModal"
import BiometricSettingsModal from "../../components/hr/BiometricSettingsModal"
import { ScanFace, Sparkles, ShieldCheck, Clock, CheckCircle2, AlertCircle, Info, Activity, MapPin, Smartphone, Navigation, ShieldAlert } from "lucide-react"

export default function Attendance() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get("search") || ""

  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [date, setDate] = useState("")
  const [bulkStatus, setBulkStatus] = useState({}) // { employeeId: status }
  const [search, setSearch] = useState(urlSearch)

  const [selected, setSelected] = useState(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openFacialCheckIn, setOpenFacialCheckIn] = useState(false)
  const [openShiftModal, setOpenShiftModal] = useState(false)
  const [openAnalyticsModal, setOpenAnalyticsModal] = useState(false)
  const [openLocationModal, setOpenLocationModal] = useState(false)
  const [openSecurityModal, setOpenSecurityModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // =========================
  // FETCH DATA
  // =========================


  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await fetchAttendance()
      // Fetch departments from backend employees
      const res = await getEmployees()
      const uniqueDepartments = Array.from(new Set(res.data.map(emp => emp.department)))
      setDepartments(uniqueDepartments)
      setLoading(false)
    }
    loadAll()
  }, [])

  async function fetchAttendance() {
    const res = await getAttendance()
    setAttendance(res.data)
  }

  // Fetch employees when department changes
  useEffect(() => {
    async function fetchByDepartment() {
      if (selectedDepartment) {
        setLoading(true)
        // Pass department as query param
        const res = await getEmployees(selectedDepartment)
        // Filter employees on frontend as fallback (in case backend returns all)
        const filtered = res.data.filter(emp => emp.department === selectedDepartment)
        setEmployees(filtered)
        // Reset bulkStatus for new department
        const initialStatus = {}
        filtered.forEach(emp => {
          initialStatus[emp._id] = "Present"
        })
        setBulkStatus(initialStatus)
        setLoading(false)
      } else {
        setEmployees([])
        setBulkStatus({})
      }
    }
    fetchByDepartment()
  }, [selectedDepartment])

  // =========================
  // MARK ATTENDANCE
  // =========================

  // Bulk mark attendance for all employees in department
  async function handleBulkMark() {
    if (!date) {
      alert("Please select a date!");
      return;
    }
    // Defensive: do not allow marking if date is empty
    if (!date.trim()) {
      alert("Date is required.");
      return;
    }
    const promises = employees.map(emp =>
      markAttendance({
        employee: emp._id,
        date,
        status: bulkStatus[emp._id] || "Present"
      })
    )
    try {
      await Promise.all(promises)
      await fetchAttendance()
      alert("Success! Attendance marked for all employees.")
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message))
    }
  }

  // =========================
  // EDIT ATTENDANCE
  // =========================

  function handleEdit(item) {
    setSelected(item)
    setOpenEdit(true)
  }

  // =========================
  // UPDATE ATTENDANCE
  // =========================

  async function handleUpdateAttendance(updated) {

    await updateAttendance(selected._id, updated)

    await fetchAttendance()

    setOpenEdit(false)
  }

  // =========================
  // DELETE ATTENDANCE
  // =========================

  async function handleDelete(id) {

    await deleteAttendance(id)

    await fetchAttendance()
  }

  // =========================
  // UI
  // =========================

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track daily attendance records and perform instant AI facial check-in
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenSecurityModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 font-bold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all"
            title="Biometric Security, Encryption & Threshold Calibration"
          >
            <ShieldCheck size={18} className="text-indigo-400" />
            <span>Biometric Protection</span>
          </button>

          <button
            onClick={() => setOpenLocationModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
            title="Configure Work Location GPS & Geofence Radius"
          >
            <MapPin size={18} className="text-emerald-400" />
            <span>Geofence Settings</span>
          </button>

          <button
            onClick={() => setOpenAnalyticsModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
            title="View Biometric Facial Analytics & Audit Trail"
          >
            <Activity size={18} className="text-indigo-400" />
            <span>Face Analytics</span>
          </button>

          <button
            onClick={() => setOpenShiftModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
            title="Configure Shift Start/End Hours & Grace Period"
          >
            <Clock size={18} className="text-cyan-400" />
            <span>Shift Settings</span>
          </button>

          <button
            onClick={() => navigate("/mobile-checkin")}
            className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-bold text-blue-300 hover:bg-blue-500/20 hover:text-white transition-all"
            title="Open Mobile Self Check-In Page"
          >
            <Smartphone size={18} className="text-blue-400" />
            <span>Mobile Check-In</span>
          </button>

          <button
            onClick={() => navigate("/kiosk")}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <ScanFace size={18} className="text-cyan-400" />
            <span>Launch Kiosk Mode</span>
          </button>

          <button
            onClick={() => setOpenFacialCheckIn(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <ScanFace size={20} />
            <span>Facial Check-In</span>
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={10} /> AI
            </span>
          </button>
        </div>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Filter by employee name or ID..."
              className="w-full bg-black/50 border border-white/10 text-white px-10 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Filtering Active</p>
          )}
        </div>

        {/* MARK ATTENDANCE */}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Department Select */}
          <select
            className="w-full bg-black/50 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            <option value="" className="bg-black">Select Department</option>
            {departments.map(dep => (
              <option key={dep} value={dep} className="bg-black">{dep}</option>
            ))}
          </select>

          {/* Date input */}
          <input
            type="text"
            placeholder="dd/mm/yyyy"
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [color-scheme:dark]"
            onChange={e => setDate(e.target.value)}
          />

          {/* Bulk Mark button */}
          <button
            onClick={handleBulkMark}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!selectedDepartment || employees.length === 0 || !date}
          >
            Bulk Mark Present
          </button>
        </div>

        {/* Employee List for Bulk Marking */}
        {selectedDepartment && employees.length > 0 && (
          <div className="w-full mb-6">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Employee ID</th>
                  <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Name</th>
                  <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-white/[0.02]">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-300 font-medium whitespace-nowrap">{emp.employeeId}</td>
                    <td className="p-4 text-gray-300 whitespace-nowrap">{emp.name}</td>
                    <td className="p-4 whitespace-nowrap">
                      <select
                        className="bg-black/50 border border-white/10 text-white px-2 py-1 rounded-xl focus:outline-none"
                        value={bulkStatus[emp._id] || "Present"}
                        onChange={e => setBulkStatus(prev => ({ ...prev, [emp._id]: e.target.value }))}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ATTENDANCE TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Emp ID</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Check-In / Out</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Remarks & Method</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance
                .filter(item => 
                  item.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
                  item.employee?.employeeId.toLowerCase().includes(search.toLowerCase())
                )
                .map(item => {
                  const statusLower = item.status?.toLowerCase() || ""
                  const isPresent = statusLower === "present"
                  const isLate = statusLower === "late"
                  const isHalfDay = statusLower === "half day"

                  let statusClass = "bg-gray-500/10 text-gray-400 border-gray-500/20"
                  if (isPresent) statusClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  if (isLate) statusClass = "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  if (isHalfDay) statusClass = "bg-purple-500/10 text-purple-400 border-purple-500/20"

                  const checkInFormatted = item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"
                  const checkOutFormatted = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"

                  let durationFormatted = "—"
                  if (item.workDurationMinutes) {
                    const hrs = Math.floor(item.workDurationMinutes / 60)
                    const mins = item.workDurationMinutes % 60
                    durationFormatted = `${hrs}h ${mins}m`
                  }

                  return (
                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-300 font-medium whitespace-nowrap">
                        {item.employee?.employeeId}
                      </td>

                      <td className="p-4 text-gray-300 whitespace-nowrap font-semibold">
                        {item.employee?.name}
                      </td>

                      <td className="p-4 text-gray-400 whitespace-nowrap text-xs font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-xs whitespace-nowrap">
                        <span className="text-emerald-300 font-mono">{checkInFormatted}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-amber-300 font-mono">{checkOutFormatted}</span>
                      </td>

                      <td className="p-4 text-xs font-mono text-slate-300 whitespace-nowrap">
                        {durationFormatted}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusClass}`}>
                          {item.status || 'N/A'}
                        </span>
                      </td>

                      <td className="p-4 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {item.verificationMethod === "Mobile Self Check-In" ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                                <Smartphone size={12} /> Mobile Selfie {item.confidence ? `(${item.confidence}%)` : ""}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                <MapPin size={10} /> Geofence Passed {item.distanceFromLocationMeters !== null ? `(${item.distanceFromLocationMeters}m)` : ""}
                              </span>
                            </div>
                          ) : item.verificationMethod === "Facial Recognition" || item.verificationMethod === "Camera Kiosk" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <ShieldCheck size={12} /> Face ID {item.confidence ? `(${item.confidence}%)` : ""}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Manual</span>
                          )}
                          {item.remarks && (
                            <span className="text-[10px] text-slate-400">{item.remarks}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-400 hover:text-red-300 transition-colors font-medium text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EDIT MODAL */}

      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Attendance"
      >
        {selected && (
          <EditAttendanceForm
            initial={selected}
            onSubmit={handleUpdateAttendance}
          />
        )}
      </Modal>

      {/* FACIAL CHECK-IN MODAL */}
      <FacialCheckInModal
        open={openFacialCheckIn}
        onClose={() => setOpenFacialCheckIn(false)}
        employees={employees}
        onAttendanceMarked={() => {
          fetchAttendance()
        }}
      />

      {/* SHIFT SETTINGS MODAL */}
      <ShiftSettingsModal
        open={openShiftModal}
        onClose={() => setOpenShiftModal(false)}
        onUpdated={() => {
          fetchAttendance()
        }}
      />

      {/* FACIAL ANALYTICS & AUDIT LOGS MODAL */}
      <FacialAnalyticsModal
        isOpen={openAnalyticsModal}
        onClose={() => setOpenAnalyticsModal(false)}
      />

      {/* WORK LOCATION & GEOFENCE MODAL */}
      <WorkLocationModal
        isOpen={openLocationModal}
        onClose={() => setOpenLocationModal(false)}
        onSaveSuccess={() => {
          fetchAttendance()
        }}
      />

      {/* BIOMETRIC SECURITY & THRESHOLD MODAL */}
      <BiometricSettingsModal
        isOpen={openSecurityModal}
        onClose={() => setOpenSecurityModal(false)}
      />
        </>
      )}
    </MainLayout>
  )
}
