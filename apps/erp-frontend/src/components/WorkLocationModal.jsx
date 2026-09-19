import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getWorkLocation, updateWorkLocation } from "../api/faceApi";

export default function WorkLocationModal({ isOpen, onClose, onSaveSuccess }) {
  const [name, setName] = useState("Main Office / HQ");
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkLocation();
    }
  }, [isOpen]);

  const fetchWorkLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkLocation();
      if (res.data?.workLocation) {
        const loc = res.data.workLocation;
        setName(loc.name || "Main Office / HQ");
        setLatitude(loc.latitude ?? 12.9716);
        setLongitude(loc.longitude ?? 77.5946);
        setRadiusMeters(loc.radiusMeters ?? 200);
        setEnabled(loc.enabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load work location:", err);
      setError("Failed to fetch location settings. Default values loaded.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    setError(null);
    setSuccessMsg(null);

    const onGpsSuccess = (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lon = Number(position.coords.longitude.toFixed(6));
      setLatitude(lat);
      setLongitude(lon);
      setDetectingGps(false);
      setSuccessMsg(`Acquired GPS: ${lat}, ${lon}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    };

    const onGpsError = (err) => {
      console.warn("High accuracy GPS failed, attempting network fallback...", err);
      // Fallback with enableHighAccuracy: false
      navigator.geolocation.getCurrentPosition(
        onGpsSuccess,
        (fallbackErr) => {
          setDetectingGps(false);
          console.error("GPS detection error:", fallbackErr);
          if (fallbackErr.code === 1) {
            setError("Location permission denied. Please allow location access in your browser settings.");
          } else {
            setError("Could not detect device GPS. Please check browser permissions or enter coordinates manually.");
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      onGpsError,
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        enabled,
      };

      const res = await updateWorkLocation(payload);
      if (res.data?.success) {
        setSuccessMsg("Work location & Geofence saved successfully!");
        if (onSaveSuccess) onSaveSuccess(res.data.workLocation);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to update work location:", err);
      setError(err.response?.data?.message || "Failed to update work location.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
        {/* Header - Matches BiometricSettingsModal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Work Location & Geofence</h3>
              <p className="text-xs text-indigo-200">Set approved workplace coordinates for mobile check-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Enable Toggle Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Enforce GPS Geofencing</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Require employees to be within allowed distance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Work Location Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Office / HQ"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Detect Coordinates Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-xl transition-all"
            >
              {detectingGps ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Detecting GPS...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>Use My Current Device GPS</span>
                </>
              )}
            </button>
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 12.9716"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 77.5946"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Radius Range Slider */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">Allowed Radius (Meters)</label>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800">
                {radiusMeters} meters
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="25"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
              <span>50m (Strict)</span>
              <span>200m (Standard)</span>
              <span>1000m (Campus)</span>
              <span>2000m (Wide Area)</span>
            </div>
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
              {saving ? "Saving Location..." : "Save Work Location"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
