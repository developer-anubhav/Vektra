import { useState, useEffect } from "react";
import { updateTaskProgressApi, fetchTaskUpdatesApi } from "../../../api/projectApi";
import { X, CheckCircle2, History, Send } from "lucide-react";

export default function TaskProgressModal({ task, onClose, onUpdated }) {
  const [progress, setProgress] = useState(task.progress || 0);
  const [status, setStatus] = useState(task.status || "TODO");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updatesHistory, setUpdatesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (task?._id) {
      loadHistory();
    }
  }, [task?._id]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetchTaskUpdatesApi(task._id);
      setUpdatesHistory(res.data.data || []);
    } catch (err) {
      console.error("Failed to load task updates history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitProgress(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      await updateTaskProgressApi(task._id, {
        progress: Number(progress),
        updateMessage: updateMessage.trim() || `Progress updated to ${progress}%`,
      });
      setUpdateMessage("");
      await loadHistory();
      if (onUpdated) onUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update progress");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {task.projectId?.name || "Project Task"}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{task.title}</h3>
            {task.dueDate && (
              <p className="text-xs text-slate-400 mt-1">Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Update Progress Form */}
        <form onSubmit={handleSubmitProgress} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-slate-700 dark:text-slate-300">Progress: {progress}%</label>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {progress === 100 ? "COMPLETED" : "IN PROGRESS"}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Update Message / Activity Note *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. Completed API endpoints, preparing unit tests"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 flex items-center gap-1"
              >
                <Send size={16} />
                {saving ? "Saving..." : "Log Progress"}
              </button>
            </div>
          </div>
        </form>

        {/* Append-Only Activity History Trail */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <History size={16} className="text-primary" />
            Append-Only Audit History ({updatesHistory.length})
          </h4>

          {loading ? (
            <p className="text-xs text-slate-400">Loading update history...</p>
          ) : updatesHistory.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {updatesHistory.map((upd) => (
                <div
                  key={upd._id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {upd.employeeId?.name || "Employee"}
                    </span>
                    <span>{new Date(upd.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{upd.updateMessage}</p>
                  <div className="text-[11px] text-primary font-bold">
                    Shift: {upd.progressBefore}% ➔ {upd.progressAfter}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No activity history recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
