import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { mobileCheckIn } from "../../../api/faceApi";

export default function MobileCheckIn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // State management
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const [gpsData, setGpsData] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null,
  });

  const [verifying, setVerifying] = useState(false);
  const [livenessPrompt, setLivenessPrompt] = useState("Please blink your eyes naturally");
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraActive(false);

    try {
      let stream;
      try {
        // Try user facing camera (ideal for mobile front camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
      } catch (fallbackErr) {
        console.warn("Front camera constraint failed, trying default camera...", fallbackErr);
        // Fallback for laptops/desktops without facingMode constraint support
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => console.error("Play error:", e));
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Failed to access camera:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera access denied. Please grant camera permission in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device detected. Please attach or enable a camera.");
      } else {
        setCameraError(`Camera error: ${err.message || "Failed to start camera video feed."}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start Camera and GPS on mount
  useEffect(() => {
    startCamera();
    fetchGpsLocation();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsData((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setGpsData((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.error("GPS error:", err);
        setGpsData((prev) => ({
          ...prev,
          loading: false,
          error: "Location access denied. Please enable GPS permissions to verify geofencing.",
        }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Capture Base64 frame from canvas
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Perform Selfie Check-In
  const handleMobileCheckIn = async () => {
    if (verifying || !cameraActive) return;
    setErrorMsg(null);
    setVerificationResult(null);

    // Validate GPS
    if (!gpsData.latitude || !gpsData.longitude) {
      setErrorMsg("GPS location is missing. Please enable location services and retry.");
      fetchGpsLocation();
      return;
    }

    try {
      setVerifying(true);
      setLivenessPrompt("Capturing selfie & testing eye-blink liveness...");

      // Capture frame 1
      const frame1 = captureFrame();
      if (!frame1) {
        throw new Error("Failed to capture video frame.");
      }

      // Wait 250ms and capture frame 2 for eye-blink verification
      await new Promise((resolve) => setTimeout(resolve, 250));
      const frame2 = captureFrame();

      const payload = {
        image: frame2,
        prevImage: frame1,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        accuracy: gpsData.accuracy,
      };

      const res = await mobileCheckIn(payload);
      if (res.data && res.data.success) {
        setVerificationResult(res.data);
      }
    } catch (err) {
      console.error("Mobile check-in error:", err);
      const data = err.response?.data;
      if (data) {
        setVerificationResult(data);
        setErrorMsg(data.message || "Attendance verification failed.");
      } else {
        setErrorMsg(err.message || "Attendance verification failed.");
      }
    } finally {
      setVerifying(false);
      setLivenessPrompt("Please blink your eyes naturally");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Mobile Self Check-In</h1>
            <p className="text-[11px] text-slate-500">AI Face Recognition & GPS Geofence</p>
          </div>
        </div>

        <button
          onClick={fetchGpsLocation}
          className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-all font-semibold shadow-sm active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh GPS</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-between gap-4">
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* GPS Geofence Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${gpsData.error ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">GPS Geolocation</span>
                {gpsData.loading ? (
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold">Locating...</span>
                ) : gpsData.error ? (
                  <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-bold">Denied</span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">Acquired</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {gpsData.error
                  ? gpsData.error
                  : gpsData.latitude
                  ? `Lat: ${gpsData.latitude.toFixed(4)}, Long: ${gpsData.longitude.toFixed(4)} (±${Math.round(gpsData.accuracy || 0)}m)`
                  : "Acquiring GPS position..."}
              </p>
            </div>
          </div>
        </div>

        {/* Camera Viewport Container */}
        <div className="relative aspect-[3/4] bg-slate-950 rounded-3xl border border-slate-200 overflow-hidden shadow-md flex items-center justify-center">
          {/* Always render <video> so ref is attached to DOM element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? "block" : "hidden"}`}
          />

          {!cameraActive && (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500">
                {cameraError ? (
                  <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 animate-pulse text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium px-4">{cameraError || "Initializing camera stream..."}</p>
              <button
                onClick={startCamera}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                {cameraError ? "Grant Permission & Retry" : "Start Camera Feed"}
              </button>
            </div>
          )}

          {/* Facial Alignment Oval Guide Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              {/* Top Prompt Banner */}
              <div className="bg-slate-905/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-center shadow-lg animate-pulse">
                <span className="text-[11px] font-medium text-blue-300">{livenessPrompt}</span>
              </div>

              {/* Center Face Oval Target */}
              <div className="w-48 h-64 border-2 border-dashed border-blue-400/85 rounded-[50%] shadow-[0_0_40px_rgba(59,130,246,0.2)] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-[10px] font-bold text-white px-2 py-0.5 rounded-full">
                  CENTER FACE
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] text-slate-300">
                Keep face well-lit & within circle
              </div>
            </div>
          )}
        </div>

        {/* Verification Messages & Results */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 shadow-sm animate-shake">
            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {verificationResult && verificationResult.success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-slate-700 text-xs space-y-2 shadow-sm animate-bounce-short">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {verificationResult.actionType === "CHECK_OUT" ? "Check-Out Successful!" : "Check-In Successful!"}
                  </h4>
                  <p className="text-[11px] text-slate-500">{verificationResult.employee?.name} ({verificationResult.employee?.employeeId})</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full">
                {verificationResult.verification?.confidence}% Match
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-100/60 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Geofence Status:</span>
                <span className="font-bold text-emerald-600">
                  Passed ({verificationResult.geofence?.distanceMeters}m from HQ)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Method:</span>
                <span className="font-bold text-slate-700">Mobile Self Check-In</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2">
          <button
            onClick={handleMobileCheckIn}
            disabled={verifying || !cameraActive || gpsData.loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-755 hover:to-indigo-755 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Verifying Face & Geofence...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Verify & Record Mobile Attendance</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
