/**
 * FacialCheckInModal
 * ==================
 * Interactive webcam facial attendance scanner.
 * Features:
 *   - Auto-scan / 1:N auto-identification or 1:1 employee check-in
 *   - Animated scanner HUD overlay
 *   - Single-click or live frame capture
 *   - Instant verification feedback: Matched Employee, Confidence Score, Timestamp
 *   - Success audio cue / visual status badge
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Camera, CheckCircle2, AlertTriangle, Loader2, ScanFace,
  RefreshCcw, UserCheck, ShieldCheck, Zap
} from "lucide-react"
import { verifyAndCheckIn } from "../../../api/faceApi"

export default function FacialCheckInModal({ open, onClose, onAttendanceMarked, employees = [] }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("") // empty for 1:N auto-detect
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)                       // { success, matched, employee, verification, message }
  const [errorMsg, setErrorMsg] = useState("")

  const startCamera = useCallback(async () => {
    setCameraError("")
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setCameraReady(true)
        }
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please grant permission in browser settings.")
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera detected. Please attach a camera device.")
      } else {
        setCameraError(`Camera error: ${err.message}`)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  useEffect(() => {
    if (open) {
      setResult(null)
      setErrorMsg("")
      setSelectedEmployeeId("")
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  const handleScanAndCheckIn = async () => {
    if (!cameraReady || !videoRef.current || !canvasRef.current || verifying) return

    setVerifying(true)
    setErrorMsg("")
    setResult(null)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      const maxW = 640
      const maxH = 480
      let w = video.videoWidth || maxW
      let h = video.videoHeight || maxH

      if (w > maxW) {
        h = Math.round((h * maxW) / w)
        w = maxW
      }
      if (h > maxH) {
        w = Math.round((w * maxH) / h)
        h = maxH
      }

      canvas.width = w
      canvas.height = h

      // Capture Frame 1
      const ctx = canvas.getContext("2d")
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, w, h)
      const prevFrame = canvas.toDataURL("image/jpeg", 0.80)

      // Wait 250ms for eye blink / natural motion
      await new Promise(r => setTimeout(r, 250))

      // Capture Frame 2
      ctx.setTransform(1, 0, 0, 1, 0, 0) // reset transform
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, w, h)
      const currentFrame = canvas.toDataURL("image/jpeg", 0.80)

      const response = await verifyAndCheckIn(currentFrame, selectedEmployeeId || null, prevFrame)
      setResult(response.data)
      onAttendanceMarked?.(response.data)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Verification failed. Face not recognized."
      setErrorMsg(msg)
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setErrorMsg("")
    if (!cameraReady) {
      startCamera()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-modal-title"
      >
        {/* Header - Matches BiometricSettingsModal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <ScanFace className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 id="checkin-modal-title" className="text-lg font-bold flex items-center gap-2">
                Facial Attendance Check-In
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Zap size={11} /> AI Powered
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                Face the camera directly and blink your eyes to check in
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
        <div className="p-6 space-y-5">
          {/* Target Employee Selector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-500" />
              <label htmlFor="employee-select" className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Target Employee:
              </label>
            </div>
            <select
              id="employee-select"
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Auto Detect (1:N Match All Enrolled)</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId || emp._id})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Scanner Viewport */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-950 aspect-video shadow-lg">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle size={36} className="text-amber-400" />
                <p className="text-sm text-slate-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  <RefreshCcw size={15} /> Retry Camera
                </button>
              </div>
            ) : result?.matched ? (
              /* Success Screen inside camera container */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-6 text-center backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{result.employee.name}</h3>
                  <p className="text-xs text-slate-400">{result.employee.role} &middot; {result.employee.department}</p>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1 text-xs font-bold text-emerald-300">
                  <ShieldCheck size={14} />
                  <span>{result.verification.confidence}% Face Match</span>
                  <span>&middot;</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                  </div>
                )}
                {/* HUD Scanner Bounding Ring */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-52 h-64 rounded-[3rem] border-2 border-dashed border-emerald-400/60 animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result?.message && !result.matched && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 rounded-xl text-sm flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 text-amber-500" />
              <span>{result.message}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
            {result?.matched ? (
              <>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <RefreshCcw size={16} /> Scan Next Person
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScanAndCheckIn}
                  disabled={!cameraReady || verifying}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {verifying ? (
                    <><Loader2 size={18} className="animate-spin" /> Verifying Face…</>
                  ) : (
                    <><Camera size={18} /> Verify Face & Mark Attendance</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
