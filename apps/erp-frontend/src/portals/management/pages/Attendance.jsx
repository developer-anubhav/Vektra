import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Modal from "../../../components/ui/Modal"
import Loader from "../../../components/ui/Loader"

import {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance
} from "../../../api/attendanceApi"

import { getEmployees } from "../../../api/employeeApi"

import EditAttendanceForm from "../components/EditAttendanceForm"
import FacialCheckInModal from "../components/FacialCheckInModal"
import ShiftSettingsModal from "../components/ShiftSettingsModal"
import FacialAnalyticsModal from "../components/FacialAnalyticsModal"
import WorkLocationModal from "../../../components/WorkLocationModal"
import BiometricSettingsModal from "../components/BiometricSettingsModal"
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Track daily attendance records and perform instant AI facial check-in
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOpenSecurityModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 font-bold text-indigo-700 hover:bg-indigo-100 transition-all text-xs"
            title="Biometric Security, Encryption & Threshold Calibration"
          >
            <ShieldCheck size={18} className="text-indigo-600" />
            <span>Biometric Protection</span>
          </button>

          <button
            onClick={() => setOpenLocationModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-sm"
            title="Configure Work Location GPS & Geofence Radius"
          >
            <MapPin size={18} className="text-emerald-600" />
            <span>Geofence Settings</span>
          </button>

          <button
            onClick={() => setOpenAnalyticsModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-sm"
            title="View Biometric Facial Analytics & Audit Trail"
          >
            <Activity size={18} className="text-indigo-600" />
            <span>Face Analytics</span>
          </button>

          <button
            onClick={() => setOpenShiftModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-sm"
            title="Configure Shift Start/End Hours & Grace Period"
          >
            <Clock size={18} className="text-cyan-600" />
            <span>Shift Settings</span>
          </button>

          <button
            onClick={() => navigate("/mobile-checkin")}
            className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700 hover:bg-blue-100 transition-all text-xs"
            title="Open Mobile Self Check-In Page"
          >
            <Smartphone size={18} className="text-blue-600" />
            <span>Mobile Check-In</span>
          </button>

          <button
            onClick={() => navigate("/kiosk")}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-sm"
          >
            <ScanFace size={18} className="text-cyan-650" />
            <span>Launch Kiosk Mode</span>
          </button>

          <button
            onClick={() => setOpenFacialCheckIn(true)}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/50 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-950/40 hover:shadow-indigo-900/60 transition-all hover:scale-[1.02] text-xs"
          >
            <ScanFace size={20} className="text-indigo-400" />
            <span>Facial Check-In</span>
            <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={10} className="text-indigo-400" /> AI
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Filtering Active</p>
          )}
        </div>

        {/* MARK ATTENDANCE */}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Department Select */}
          <select
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
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
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            onChange={e => setDate(e.target.value)}
          />

          {/* Bulk Mark button */}
          <button
            onClick={handleBulkMark}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!selectedDepartment || employees.length === 0 || !date}
          >
            Bulk Mark Present
          </button>
        </div>

        {/* Employee List for Bulk Marking */}
        {selectedDepartment && employees.length > 0 && (
          <div className="w-full mb-6 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
            <table className="min-w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Employee ID</th>
                  <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Name</th>
                  <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">{emp.employeeId}</td>
                    <td className="p-4 text-slate-700 font-semibold whitespace-nowrap">{emp.name}</td>
                    <td className="p-4 whitespace-nowrap">
                      <select
                        className="bg-slate-50 border border-slate-200 text-slate-800 px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

        <div className="overflow-x-auto border border-slate-200 rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 border-b border-slate-200">Emp ID</th>
                <th className="p-4 border-b border-slate-200">Employee</th>
                <th className="p-4 border-b border-slate-200">Date</th>
                <th className="p-4 border-b border-slate-200">Check-In / Out</th>
                <th className="p-4 border-b border-slate-200">Duration</th>
                <th className="p-4 border-b border-slate-200">Status</th>
                <th className="p-4 border-b border-slate-200">Remarks & Method</th>
                <th className="p-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
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

                  let statusClass = "bg-slate-100 text-slate-500 border-slate-200"
                  if (isPresent) statusClass = "bg-emerald-50 text-emerald-600 border-emerald-100"
                  if (isLate) statusClass = "bg-amber-50 text-amber-600 border-amber-100"
                  if (isHalfDay) statusClass = "bg-purple-50 text-purple-600 border-purple-100"

                  const checkInFormatted = item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"
                  const checkOutFormatted = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"

                  let durationFormatted = "—"
                  if (item.workDurationMinutes) {
                    const hrs = Math.floor(item.workDurationMinutes / 60)
                    const mins = item.workDurationMinutes % 60
                    durationFormatted = `${hrs}h ${mins}m`
                  }

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {item.employee?.employeeId}
                      </td>

                      <td className="p-4 text-slate-700 whitespace-nowrap font-bold text-sm">
                        {item.employee?.name}
                      </td>

                      <td className="p-4 text-slate-400 whitespace-nowrap text-xs font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-xs whitespace-nowrap">
                        <span className="text-emerald-600 font-mono font-semibold">{checkInFormatted}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-amber-600 font-mono font-semibold">{checkOutFormatted}</span>
                      </td>

                      <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {durationFormatted}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusClass}`}>
                          {item.status || 'N/A'}
                        </span>
                      </td>

                      <td className="p-4 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {item.verificationMethod === "Mobile Self Check-In" ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600">
                                <Smartphone size={12} /> Mobile Selfie {item.confidence ? `(${item.confidence}%)` : ""}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                                <MapPin size={10} /> Geofence Passed {item.distanceFromLocationMeters !== null ? `(${item.distanceFromLocationMeters}m)` : ""}
                              </span>
                            </div>
                          ) : item.verificationMethod === "Facial Recognition" || item.verificationMethod === "Camera Kiosk" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
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

                      <td className="p-4 text-right whitespace-nowrap space-x-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold text-xs uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-rose-600 hover:text-rose-700 hover:underline transition-colors font-bold text-xs uppercase tracking-wider"
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
