/**
 * FaceEnrollModal
 * ================
 * Full-screen enrollment modal with:
 *  - Live webcam preview (getUserMedia)
 *  - Capture button → base64 thumbnails strip (3–5 images)
 *  - Real-time feedback per captured image
 *  - Enroll button → calls backend → success/error state
 *  - Re-enrollment warning if employee already has a profile
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Camera, CheckCircle2, XCircle, Trash2,
  AlertTriangle, Loader2, ScanFace, RefreshCcw
} from "lucide-react"
import { enrollFace } from "../../api/faceApi"

// Number of captures required before "Enroll" is enabled
const MIN_CAPTURES = 3
const MAX_CAPTURES = 5

export default function FaceEnrollModal({ employee, open, onClose, onEnrolled }) {
  /* ------------------------------------------------------------------ refs */
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  /* ---------------------------------------------------------------- state */
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [captures, setCaptures] = useState([])          // base64 strings
  const [enrolling, setEnrolling] = useState(false)
  const [result, setResult] = useState(null)            // { success, message }
  const [step, setStep] = useState("capture")           // "capture" | "done"

  /* -------------------------------------------------------- webcam helpers */
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
        setCameraError("Camera access denied. Please allow camera access in your browser settings and try again.")
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found. Please connect a camera and try again.")
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

  /* ---------------------------------------------------- lifecycle: open/close */
  useEffect(() => {
    if (open) {
      setCaptures([])
      setResult(null)
      setStep("capture")
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  /* ------------------------------------------------------------ capture frame */
  const captureFrame = () => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) return
    if (captures.length >= MAX_CAPTURES) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Scale down to max 640x480 for efficient payload size
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

    const ctx = canvas.getContext("2d")
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, w, h)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.80)
    setCaptures(prev => [...prev, dataUrl])
  }

  const removeCapture = (idx) => {
    setCaptures(prev => prev.filter((_, i) => i !== idx))
  }

  /* -------------------------------------------------------------- enrollment */
  const handleEnroll = async () => {
    if (captures.length < MIN_CAPTURES) return
    setEnrolling(true)
    setResult(null)
    try {
      stopCamera()
      const res = await enrollFace(employee._id, captures, employee.employeeId)
      setResult({ success: true, message: res.data.message, count: res.data.embeddings_created })
      setStep("done")
      onEnrolled?.()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || "Enrollment failed"
      setResult({ success: false, message: msg })
    } finally {
      setEnrolling(false)
    }
  }

  const handleRetry = () => {
    setCaptures([])
    setResult(null)
    setStep("capture")
    startCamera()
  }

  /* -------------------------------------------------------------- render guard */
  if (!open || !employee) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1526] shadow-2xl shadow-black/60"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-modal-title"
      >
        {/* Header gradient */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-violet-600/25 via-blue-500/15 to-cyan-400/20 pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>

        <div className="relative p-6 sm:p-8">
          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/30 text-violet-400">
              <ScanFace size={22} />
            </div>
            <div>
              <h2 id="enroll-modal-title" className="text-xl font-black tracking-tight text-white">
                Face Enrollment
              </h2>
              <p className="text-sm text-slate-400">
                {employee.name} &middot; {employee.employeeId}
              </p>
            </div>
          </div>

          {/* ============================================================ STEP: CAPTURE */}
          {step === "capture" && (
            <>
              {/* Camera preview */}
              <div className="relative mb-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900 aspect-video">
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
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                        <Loader2 size={30} className="animate-spin text-violet-400" />
                      </div>
                    )}
                    {/* Face guide overlay */}
                    {cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-60 rounded-full border-2 border-dashed border-violet-400/50" />
                      </div>
                    )}
                    {/* Capture counter badge */}
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {captures.length} / {MAX_CAPTURES} captured
                    </div>
                  </>
                )}
              </div>

              {/* Hidden canvas for frame extraction */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Instructions */}
              <p className="mb-4 text-center text-sm text-slate-400">
                Position your face inside the oval guide. Capture {MIN_CAPTURES}–{MAX_CAPTURES} images
                from slightly different angles for best results.
              </p>

              {/* Thumbnails */}
              {captures.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {captures.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        alt={`Capture ${idx + 1}`}
                        className="h-16 w-16 rounded-xl object-cover border border-white/10"
                      />
                      <button
                        onClick={() => removeCapture(idx)}
                        className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Capture + Enroll buttons */}
              <div className="flex gap-3">
                <button
                  onClick={captureFrame}
                  disabled={!cameraReady || captures.length >= MAX_CAPTURES}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera size={18} />
                  {captures.length >= MAX_CAPTURES ? "Max captures reached" : "Capture Photo"}
                </button>

                <button
                  onClick={handleEnroll}
                  disabled={captures.length < MIN_CAPTURES || enrolling}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enrolling ? (
                    <><Loader2 size={18} className="animate-spin" /> Enrolling…</>
                  ) : (
                    <><ScanFace size={18} /> Enroll Face{captures.length < MIN_CAPTURES ? ` (need ${MIN_CAPTURES - captures.length} more)` : ""}</>
                  )}
                </button>
              </div>

              {/* Error from a failed enrollment attempt (without leaving capture step) */}
              {result && !result.success && (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  <p className="font-bold mb-1">Enrollment failed</p>
                  <p>{result.message}</p>
                  <button onClick={handleRetry} className="mt-2 flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold text-xs">
                    <RefreshCcw size={13} /> Try again
                  </button>
                </div>
              )}
            </>
          )}

          {/* ============================================================ STEP: DONE */}
          {step === "done" && result?.success && (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Enrollment Complete</h3>
                <p className="text-slate-300 text-sm">{result.message}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {employee.name} can now use facial recognition to record attendance.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  <RefreshCcw size={15} /> Re-enroll
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
