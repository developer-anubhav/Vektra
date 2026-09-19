/**
 * ShiftSettingsModal
 * ==================
 * HR Admin modal to configure company working hours and grace period.
 */

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Clock, Save, ShieldCheck, Loader2, Info } from "lucide-react"
import { getShiftSettings, updateShiftSettings } from "../../../api/attendanceApi"

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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-settings-title"
      >
        {/* Header - Matches BiometricSettingsModal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 id="shift-settings-title" className="text-lg font-bold">
                Company Shift & Working Hours
              </h2>
              <p className="text-xs text-indigo-200">
                Configure shift hours for automatic On Time, Late, and Half Day calculation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={30} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-center gap-3">
                  <Info className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Shift Start Time */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800 dark:text-gray-200">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                {/* Shift End Time */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800 dark:text-gray-200">
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Grace Period */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800 dark:text-gray-200">
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
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    mins
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Info size={14} className="text-indigo-500 shrink-0" />
                  Check-ins up to {startTime} + {gracePeriod} mins are marked On Time. Later check-ins are marked Late.
                </p>
              </div>

              {/* Automated Rules Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700 text-xs space-y-1.5 text-gray-700 dark:text-gray-300">
                <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 text-sm mb-1">
                  <ShieldCheck size={16} className="text-emerald-500" /> Automated Rules Summary
                </p>
                <p>&bull; <strong>On Time:</strong> Check-in before or at {startTime} + {gracePeriod}m</p>
                <p>&bull; <strong>Late:</strong> Check-in after {startTime} + {gracePeriod}m</p>
                <p>&bull; <strong>Half Day:</strong> Work duration under 4 hours (240 mins)</p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
