/**
 * ShiftSettingsModal
 * ==================
 * HR Admin modal to configure company working hours and grace period.
 */

import { useEffect, useState } from "react"
import { Clock, Save, ShieldCheck, Loader2, Info } from "lucide-react"
import { getShiftSettings, updateShiftSettings } from "../../api/attendanceApi"

export default function ShiftSettingsModal({ open, onClose, onUpdated }) {
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [gracePeriod, setGracePeriod] = useState(15)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!open) return
    setErrorMsg("")
    setLoading(true)
    getShiftSettings()
      .then(res => {
        if (res.data) {
          setStartTime(res.data.startTime || "09:00")
          setEndTime(res.data.endTime || "17:00")
          setGracePeriod(res.data.gracePeriodMinutes ?? 15)
        }
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Failed to load shift settings"))
      .finally(() => setLoading(false))
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg("")

    try {
      await updateShiftSettings({
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriod),
      })
      onUpdated?.()
      onClose()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update shift settings")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a] shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-settings-title"
      >
        {/* Header gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-teal-500/20 pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Clock size={24} />
            </div>
            <div>
              <h2 id="shift-settings-title" className="text-xl font-black text-white">
                Company Shift & Working Hours
              </h2>
              <p className="text-xs text-slate-400">
                Configure shift hours for automatic On Time, Late, and Half Day calculation
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={30} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Shift Start Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>

                {/* Shift End Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Grace Period */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Grace Period (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    mins
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <Info size={13} className="text-cyan-400 shrink-0" />
                  Check-ins up to {startTime} + {gracePeriod} mins are marked On Time. Later check-ins are marked Late.
                </p>
              </div>

              {/* Summary box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1.5 text-slate-300">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Automated Rule Rules
                </p>
                <p>&bull; <strong>On Time:</strong> Check-in before or at {startTime} + {gracePeriod}m</p>
                <p>&bull; <strong>Late:</strong> Check-in after {startTime} + {gracePeriod}m</p>
                <p>&bull; <strong>Half Day:</strong> Work duration under 4 hours (240 mins)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
