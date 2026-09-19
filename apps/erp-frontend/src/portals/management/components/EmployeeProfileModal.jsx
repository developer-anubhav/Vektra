import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  BadgeCheck, BriefcaseBusiness, Building2,
  Mail, Phone, IndianRupee, ScanFace, Trash2, ShieldCheck,
  ShieldOff, Loader2, X
} from "lucide-react"
import FaceEnrollModal from "./FaceEnrollModal"
import { getFaceProfile, deleteFaceProfile } from "../../../api/faceApi"

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not available"
  }

  const numericAmount = Number(amount)

  if (Number.isNaN(numericAmount)) {
    return "Not available"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(numericAmount)
}

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const detailItems = (employee) => [
  {
    label: "EMPLOYEE ID",
    value: employee.employeeId || "Not assigned",
    icon: BadgeCheck
  },
  {
    label: "DEPARTMENT",
    value: employee.department || "Not specified",
    icon: Building2
  },
  {
    label: "ROLE",
    value: employee.role || "Not specified",
    icon: BriefcaseBusiness
  },
  {
    label: "EMAIL",
    value: employee.email || "Not available",
    icon: Mail
  },
  {
    label: "PHONE NUMBER",
    value: employee.phoneNumber || "Not available",
    icon: Phone
  },
  {
    label: "SALARY DETAILS",
    value: formatCurrency(employee.monthlySalary),
    icon: IndianRupee
  }
]

export default function EmployeeProfileModal({ employee, open, onClose }) {
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [faceProfile, setFaceProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Load face profile whenever modal opens
  useEffect(() => {
    if (!open || !employee) return
    setFaceProfile(null)
    setProfileError("")
    setProfileLoading(true)

    getFaceProfile(employee._id)
      .then(res => setFaceProfile(res.data))
      .catch(err => {
        const msg = err.response?.data?.message || "Could not load face profile"
        setProfileError(msg)
      })
      .finally(() => setProfileLoading(false))
  }, [open, employee])

  const handleEnrolled = () => {
    // Refresh profile after enrollment
    getFaceProfile(employee._id)
      .then(res => setFaceProfile(res.data))
      .catch(() => {})
  }

  const handleDeleteProfile = async () => {
    if (!window.confirm(`Delete face profile for ${employee.name}? This cannot be undone.`)) return
    setDeleteLoading(true)
    try {
      await deleteFaceProfile(employee._id)
      setFaceProfile(prev => ({ ...prev, enrolled: false, embedding_count: 0, created_at: "", updated_at: "" }))
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete face profile")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !employee) return null

  const status = employee.status || "Unknown"
  const isActive = ["active", "present"].includes(status.toLowerCase())
  const isEnrolled = faceProfile?.enrolled === true

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transform transition-all my-8"
          onClick={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-profile-title"
        >
          {/* Header matching Biometric Settings Modal */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center space-x-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold text-base shadow-inner">
                {getInitials(employee.name)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 id="employee-profile-title" className="text-lg font-bold text-white">
                    {employee.name || "Unnamed Employee"}
                  </h3>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {status}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {employee.role || "Role pending"} in {employee.department || "Unknown department"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6">
            {/* Detail Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailItems(employee).map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                  <p className="text-base font-bold text-white break-words mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Snapshot Summary Card */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                SNAPSHOT
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {employee.name || "This employee"} is currently marked as{" "}
                <span className={`font-semibold ${isActive ? "text-emerald-400" : "text-amber-400"}`}>{status}</span>. Reach them at{" "}
                <span className="text-white font-medium">{employee.email || "no email on file"}</span>.
              </p>
            </div>

            {/* Face Recognition Section Card */}
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <ScanFace size={18} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    FACE RECOGNITION
                  </span>
                </div>

                {/* Enrollment status badge */}
                {profileLoading ? (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin text-indigo-400" /> Loading…
                  </span>
                ) : profileError ? (
                  <span className="text-xs text-amber-400 font-medium">{profileError}</span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
                    isEnrolled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-700/40 text-slate-400 border-slate-700"
                  }`}>
                    {isEnrolled ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                    {isEnrolled ? "ENROLLED" : "NOT ENROLLED"}
                  </span>
                )}
              </div>

              {/* Profile details when enrolled */}
              {!profileLoading && !profileError && isEnrolled && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-lg font-bold text-white">{faceProfile.embedding_count}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Embeddings</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs font-bold text-white uppercase">{faceProfile.model_version || "—"}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Model</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs font-bold text-white">
                      {faceProfile.created_at
                        ? new Date(faceProfile.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Enrolled On</p>
                  </div>
                </div>
              )}

              {/* Not enrolled helper text */}
              {!profileLoading && !profileError && !isEnrolled && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  This employee has not been enrolled for facial recognition yet. Enroll their face so they can check in via the entrance camera or mobile app.
                </p>
              )}

              {/* Action buttons matching Biometric Modal primary button styling */}
              {!profileLoading && !profileError && (
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEnrollOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <ScanFace size={15} />
                    {isEnrolled ? "Re-enroll Face" : "Enroll Face"}
                  </button>

                  {isEnrolled && (
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      disabled={deleteLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete Profile
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer matching Biometric Settings Modal */}
          <div className="flex items-center justify-end px-6 py-4 bg-slate-900/80 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Face enrollment modal */}
      <FaceEnrollModal
        employee={employee}
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={handleEnrolled}
      />
    </>
  )

  return createPortal(modalContent, document.body)
}
