/**
 * Entrance Kiosk Mode
 * ==================
 * Hands-free continuous entrance camera scanner for office reception/kiosk devices.
 *
 * Features:
 *   - Continuous frame auto-sampling every 1.5 seconds
 *   - 10-second duplicate scan cooldown per employee
 *   - Automatic Check-In vs Check-Out detection
 *   - Audio Voice Greetings (Web Speech API)
 *   - Real-time side activity feed of today's attendance scans
 *   - High-tech HUD camera overlay with facial target reticle
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ScanFace, ShieldCheck, UserCheck, AlertTriangle, ArrowLeft,
  Volume2, VolumeX, Maximize, Minimize, Activity, Sparkles, LogOut, CheckCircle2, Clock
} from "lucide-react"
import { verifyAndCheckIn } from "../../api/faceApi"
import { getAttendance } from "../../api/attendanceApi"

export default function KioskMode() {
  const navigate = useNavigate()

  /* ------------------------------------------------------------------ refs */
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const autoScanTimerRef = useRef(null)
  const lastFrameRef = useRef(null)

  /* ---------------------------------------------------------------- state */
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [isScanning, setIsScanning] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [activeScanResult, setActiveScanResult] = useState(null) // current banner popup
  const [activityFeed, setActivityFeed] = useState([])            // recent scan events
  const [framesProcessed, setFramesProcessed] = useState(0)
  const [lastCheckInTime, setLastCheckInTime] = useState(null)

  /* -------------------------------------------------------- Audio Speech Helper */
  const speakGreeting = useCallback((text) => {
    if (!soundEnabled || !("speechSynthesis" in window)) return
    try {
      window.speechSynthesis.cancel() // cancel previous utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      window.speechSynthesis.speak(utterance)
    } catch (_) { /* ignore speech synthesis block */ }
  }, [soundEnabled])

  /* -------------------------------------------------------- Camera setup */
  const startCamera = useCallback(async () => {
    setCameraError("")
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
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
        setCameraError("No camera detected. Please connect a webcam.")
      } else {
        setCameraError(`Camera error: ${err.message}`)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current)
      autoScanTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  /* -------------------------------------------------------- Fetch Today's Feed */
  const refreshFeed = useCallback(async () => {
    try {
      const res = await getAttendance()
      const today = new Date().toDateString()
      const todayRecords = res.data.filter(att => new Date(att.date).toDateString() === today)
      setActivityFeed(todayRecords.reverse()) // newest first
    } catch (_) { /* silence feed error */ }
  }, [])

  /* -------------------------------------------------------- Auto Scan Frame Loop */
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return
    const video = videoRef.current
    if (!video.videoWidth || !video.videoHeight) return

    try {
      const canvas = canvasRef.current

      // Size down for fast processing (640x480 max)
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

      // Frame 1 (prevFrame)
      const ctx = canvas.getContext("2d")
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, w, h)
      const prevFrame = canvas.toDataURL("image/jpeg", 0.80)

      // Wait 250ms for eye blink / facial movement
      await new Promise(r => setTimeout(r, 250))

      // Frame 2 (currentFrame)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, w, h)
      const currentFrame = canvas.toDataURL("image/jpeg", 0.80)

      setFramesProcessed(prev => prev + 1)

      // Send to backend verification with prevFrame for eye blink check
      const res = await verifyAndCheckIn(currentFrame, null, prevFrame)
      const data = res.data

      if (data.matched && data.actionType !== "COOLDOWN") {
        setActiveScanResult(data)
        setLastCheckInTime(new Date())

        // Audio announcement
        const empName = data.employee?.name || "Employee"
        if (data.actionType === "CHECK_OUT") {
          speakGreeting(`Goodbye ${empName}! Check-out recorded.`)
        } else {
          speakGreeting(`Welcome ${empName}! Check-in recorded.`)
        }

        // Refresh live feed
        refreshFeed()

        // Auto hide banner after 4 seconds
        setTimeout(() => {
          setActiveScanResult(null)
        }, 4000)
      }
    } catch (err) {
      // Ignore 422 ("no face detected") or 503 ("service unavailable") silently during continuous scanning loop
    }
  }, [isScanning, speakGreeting, refreshFeed])

  /* -------------------------------------------------------- Lifecycle */
  useEffect(() => {
    startCamera()
    refreshFeed()
    return () => stopCamera()
  }, [startCamera, stopCamera, refreshFeed])

  useEffect(() => {
    if (cameraReady && isScanning) {
      // Sample frame every 1500ms
      autoScanTimerRef.current = setInterval(processFrame, 1500)
    } else if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current)
      autoScanTimerRef.current = null
    }
    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current)
      }
    }
  }, [cameraReady, isScanning, processFrame])

  /* -------------------------------------------------------- Fullscreen */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#070d19] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* ============================================================ TOP BAR */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/attendance")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} /> Exit Kiosk
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              E-HRMS Kiosk Entrance Mode
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                <Sparkles size={11} /> LIVE SCANNER
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Hands-free continuous facial attendance scanner
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Activity size={14} className="text-cyan-400" />
              <span>Frames Processed: <strong className="text-white font-mono">{framesProcessed}</strong></span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Scanner Active</span>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            title={soundEnabled ? "Mute Voice Greetings" : "Enable Voice Greetings"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* ============================================================ MAIN CONTENT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        
        {/* LEFT 2 COLS: CAMERA SCANNER VIEWPORT */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative flex-1 overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950 shadow-2xl flex items-center justify-center min-h-[420px]">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <AlertTriangle size={42} className="text-amber-400" />
                <p className="text-base text-slate-300 max-w-md">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  Retry Camera
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

                <canvas ref={canvasRef} className="hidden" />

                {/* HIGH TECH HUD OVERLAY */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Bounding box reticle */}
                    <div className="relative w-64 h-80 rounded-[3.5rem] border-2 border-dashed border-cyan-400/50 animate-pulse flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                      
                      {/* Scanning laser line */}
                      <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-ping" />
                    </div>

                    {/* Instruction overlay */}
                    <div className="absolute bottom-6 rounded-full bg-slate-950/80 border border-white/10 px-6 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg">
                      Look directly into the camera to check in or out
                    </div>
                  </div>
                )}

                {/* RECOGNITION MATCH BANNER OVERLAY */}
                {activeScanResult && (
                  <div className="absolute inset-x-6 top-6 z-30 animate-in fade-in slide-in-from-top duration-300">
                    <div className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 ${
                      activeScanResult.actionType === "CHECK_OUT"
                        ? "bg-amber-950/85 border-amber-500/40 text-amber-200 shadow-amber-500/20"
                        : "bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-emerald-500/20"
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                          activeScanResult.actionType === "CHECK_OUT"
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        }`}>
                          {activeScanResult.actionType === "CHECK_OUT" ? <LogOut size={28} /> : <CheckCircle2 size={28} />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest opacity-75">
                            {activeScanResult.actionType === "CHECK_OUT" ? "Check-Out Recorded" : "Check-In Recorded"}
                          </p>
                          <h3 className="text-2xl font-black text-white">{activeScanResult.employee?.name}</h3>
                          <p className="text-xs opacity-90">{activeScanResult.employee?.role} &middot; {activeScanResult.employee?.department}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                          <ShieldCheck size={14} />
                          <span>{activeScanResult.verification?.confidence}% Match</span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-75 font-mono">{new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COL: REAL-TIME ENTRANCE FEED */}
        <div className="flex flex-col rounded-[2.5rem] border border-white/10 bg-slate-950/60 backdrop-blur-md p-6 overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Today's Entrance Feed
            </h2>
            <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
              {activityFeed.length} Events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                <ScanFace size={32} className="mb-2 opacity-50" />
                <p className="text-xs">No attendance scans recorded today yet.</p>
              </div>
            ) : (
              activityFeed.map((item) => {
                const isCheckOut = Boolean(item.checkOutTime)
                const eventTime = item.checkOutTime || item.checkInTime || item.createdAt || item.date

                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 text-sm font-black text-primary">
                        {item.employee?.name?.[0] || "E"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.employee?.name || "Employee"}</p>
                        <p className="text-[11px] text-slate-400">{item.employee?.employeeId}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        isCheckOut
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {isCheckOut ? "Check-Out" : "Check-In"}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-500 font-mono">
                        {new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
