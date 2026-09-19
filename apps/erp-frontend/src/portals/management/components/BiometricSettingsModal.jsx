import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getBiometricSettings,
  updateBiometricSettings,
  cleanupAuditLogs,
} from "../../../api/faceApi";

export default function BiometricSettingsModal({ isOpen, onClose }) {
  const [matchThreshold, setMatchThreshold] = useState(0.7);
  const [retentionDays, setRetentionDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBiometricSettings();
      if (res.data?.settings) {
        setMatchThreshold(res.data.settings.matchThreshold ?? 0.7);
      }
    } catch (err) {
      console.error("Failed to load biometric settings:", err);
      setError("Failed to fetch settings from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await updateBiometricSettings({
        matchThreshold: Number(matchThreshold),
      });

      if (res.data?.success) {
        setSuccessMsg("Biometric model calibration saved successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.data?.message || "Failed to update security settings.");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError(err.response?.data?.message || err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeLogs = async () => {
    if (!window.confirm(`Are you sure you want to purge audit log records older than ${retentionDays} days?`)) {
      return;
    }
    try {
      setCleaning(true);
      setError(null);
      setSuccessMsg(null);

      const res = await cleanupAuditLogs({ retentionDays });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || `Purged ${res.data.purgedCount} log records.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to cleanup audit logs:", err);
      setError(err.response?.data?.message || err.message || "Failed to execute cleanup.");
    } finally {
      setCleaning(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Biometric Security & System Calibration</h3>
              <p className="text-xs text-indigo-200">Phase 9 Protection — AES Encryption, Microservice Auth & FAR/FRR Thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Security Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Biometric Encryption</span>
                <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full">ACTIVE</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">AES-256 (Fernet Cipher)</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Facial feature embeddings are encrypted before writing to storage.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Service API Auth</span>
                <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-full">SECURED</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">Header: X-Internal-Secret</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Internal calls between Node.js & Python are cryptographically signed.</p>
            </div>
          </div>

          {/* Threshold Calibration Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  FaceNet Cosine Match Threshold
                </label>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {Number(matchThreshold).toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0.55"
                max="0.85"
                step="0.01"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              {/* Threshold Presets */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setMatchThreshold(0.62)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    matchThreshold === 0.62
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                  }`}
                >
                  High Sensitivity (0.62)
                </button>

                <button
                  type="button"
                  onClick={() => setMatchThreshold(0.70)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    matchThreshold === 0.70
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Standard Balanced (0.70)
                </button>

                <button
                  type="button"
                  onClick={() => setMatchThreshold(0.78)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    matchThreshold === 0.78
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Strict Security (0.78)
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Higher thresholds minimize False Acceptance Rate (FAR) for strict security, while lower thresholds minimize False Rejection Rate (FRR) in poor lighting.
              </p>
            </div>

            {/* Retention Cleanup */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Automated Privacy Retention Policy
              </h4>
              <div className="flex items-center gap-3">
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
                >
                  <option value={30}>Purge logs older than 30 days</option>
                  <option value={60}>Purge logs older than 60 days</option>
                  <option value={90}>Purge logs older than 90 days</option>
                  <option value={180}>Purge logs older than 180 days</option>
                </select>

                <button
                  type="button"
                  onClick={handlePurgeLogs}
                  disabled={cleaning}
                  className="px-4 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl transition-all disabled:opacity-50"
                >
                  {cleaning ? "Purging..." : "Execute Cleanup Now"}
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {saving ? "Saving Calibration..." : "Save Calibration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
