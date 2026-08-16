import { useEffect, useState } from "react"
import {
  BadgeCheck, BriefcaseBusiness, Building2, CircleDot,
  Mail, Phone, IndianRupee, ScanFace, Trash2, ShieldCheck,
  ShieldOff, Loader2, RefreshCcw
} from "lucide-react"
import FaceEnrollModal from "./FaceEnrollModal"
import { getFaceProfile, deleteFaceProfile } from "../../api/faceApi"

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
    label: "Employee ID",
    value: employee.employeeId || "Not assigned",
    icon: BadgeCheck
  },
  {
    label: "Department",
    value: employee.department || "Not specified",
    icon: Building2
  },
  {
    label: "Role",
    value: employee.role || "Not specified",
    icon: BriefcaseBusiness
  },
  {
    label: "Email",
    value: employee.email || "Not available",
    icon: Mail
  },
  {
    label: "Phone Number",
    value: employee.phoneNumber || "Not available",
    icon: Phone
  },
  {
    label: "Salary Details",
    value: formatCurrency(employee.monthlySalary),
    icon: IndianRupee
  }]

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

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172ae6] shadow-2xl"
          onClick={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-profile-title"
        >
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-primary/20 via-cyan-400/10 to-emerald-400/20" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-gradient-to-br from-primary/25 to-cyan-500/10 text-2xl font-black text-primary shadow-lg shadow-primary/10">
                {getInitials(employee.name)}
              </div>

              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-300">
                  <CircleDot size={12} className={isActive ? "text-emerald-400" : "text-amber-400"} />
                  {status}
                </p>
                <h2 id="employee-profile-title" className="text-2xl font-black tracking-tight text-white">
                  {employee.name || "Unnamed Employee"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {employee.role || "Role pending"} in {employee.department || "Unknown department"}
                </p>
              </div>
            </div>

            {/* Detail grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {detailItems(employee).map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4 shadow-inner shadow-black/10"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-primary">
                      <Icon size={18} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                      {label}
                    </p>
                  </div>
                  <p className="break-words text-sm font-semibold text-slate-100">{value}</p>
                </div>
              ))}
            </div>

            {/* Snapshot summary */}
            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-gradient-to-r from-white/[0.03] to-white/[0.06] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                Snapshot
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {employee.name || "This employee"} is currently marked as{" "}
                <span className={isActive ? "text-emerald-300" : "text-amber-300"}>{status}</span>.
                Reach them at <span className="text-white">{employee.email || "no email on file"}</span>.
              </p>
            </div>

            {/* ---------------------------------------------------------- Face Profile Section */}
            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanFace size={16} className="text-violet-400" />
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Face Recognition
                  </p>
                </div>

                {/* Enrollment status badge */}
                {profileLoading ? (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Loader2 size={12} className="animate-spin" /> Loading…
                  </span>
                ) : profileError ? (
                  <span className="text-xs text-amber-400">{profileError}</span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${
                    isEnrolled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                  }`}>
                    {isEnrolled ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                    {isEnrolled ? "Enrolled" : "Not Enrolled"}
                  </span>
                )}
              </div>

              {/* Profile details when enrolled */}
              {!profileLoading && !profileError && isEnrolled && (
                <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-lg font-black text-white">{faceProfile.embedding_count}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Embeddings</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-xs font-bold text-white uppercase">{faceProfile.model_version || "—"}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Model</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-xs font-bold text-white">
                      {faceProfile.created_at
                        ? new Date(faceProfile.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enrolled On</p>
                  </div>
                </div>
              )}

              {/* Not enrolled helper text */}
              {!profileLoading && !profileError && !isEnrolled && (
                <p className="mb-4 text-xs text-slate-500">
                  This employee has not been enrolled for facial recognition yet.
                  Enroll their face so they can check in via the entrance camera or mobile app.
                </p>
              )}

              {/* Action buttons */}
              {!profileLoading && !profileError && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEnrollOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2.5 text-xs font-bold text-violet-300 transition hover:bg-violet-600/30 hover:text-violet-200"
                  >
                    <ScanFace size={14} />
                    {isEnrolled ? "Re-enroll Face" : "Enroll Face"}
                  </button>

                  {isEnrolled && (
                    <button
                      onClick={handleDeleteProfile}
                      disabled={deleteLoading}
                      className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* ---------------------------------------------------------- /Face Profile */}
          </div>
        </div>
      </div>

      {/* Face enrollment modal — stacked above profile modal */}
      <FaceEnrollModal
        employee={employee}
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={handleEnrolled}
      />
    </>
  )
}
