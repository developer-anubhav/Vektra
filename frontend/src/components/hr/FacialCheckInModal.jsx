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
import {
  Camera, CheckCircle2, AlertTriangle, Loader2, ScanFace,
  RefreshCcw, UserCheck, ShieldCheck, Zap
} from "lucide-react"
import { verifyAndCheckIn } from "../../api/faceApi"

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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1329] shadow-2xl shadow-black/80"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-modal-title"
      >
        {/* Header glow */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-emerald-600/20 via-cyan-500/20 to-blue-600/20 pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>

        <div className="relative p-6 sm:p-8">
          {/* Title Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <ScanFace size={24} />
            </div>
            <div>
              <h2 id="checkin-modal-title" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Facial Attendance Check-In
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Zap size={11} /> AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Face the camera directly and blink your eyes to check in
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <div className="flex flex-1 items-center gap-2">
              <UserCheck size={16} className="text-slate-400 ml-2" />
              <label htmlFor="employee-select" className="text-xs font-semibold text-slate-300">
                Target Employee:
              </label>
            </div>
            <select
              id="employee-select"
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
          <div className="relative mb-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 aspect-video shadow-inner">
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
                    <Loader2 size={32} className="animate-spin text-emerald-400" />
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
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result?.message && !result.matched && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{result.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {result?.matched ? (
              <>
                <button
                  onClick={handleReset}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-semibold text-white hover:bg-white/15 transition"
                >
                  <RefreshCcw size={16} /> Scan Next Person
                </button>
                <button
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-500 transition"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                onClick={handleScanAndCheckIn}
                disabled={!cameraReady || verifying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <><Loader2 size={18} className="animate-spin" /> Verifying Face…</>
                ) : (
                  <><Camera size={18} /> Verify Face & Mark Attendance</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
