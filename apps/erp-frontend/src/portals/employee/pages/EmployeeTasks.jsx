import { useState, useEffect } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { fetchMyTasksApi } from "../../../api/projectApi";
import Loader from "../../../components/ui/Loader";
import TaskProgressModal from "./TaskProgressModal";
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function EmployeeTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadMyTasks();
  }, []);

  async function loadMyTasks() {
    setLoading(true);
    try {
      const res = await fetchMyTasksApi();
      setTasks(res.data.data || []);
    } catch (err) {
      console.error("Failed to load employee tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((t) => statusFilter === "ALL" || t.status === statusFilter);

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <ListTodo size={14} />
                My Workspace
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">My Tasks</h1>
              <p className="text-slate-500 font-medium text-sm">
                Deliverables assigned to you. Click on any task to update progress and view audit history.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {["ALL", "TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTask(t)}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary">
                      {t.projectId?.name || "Project Deliverable"}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{t.title}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      t.priority === "URGENT"
                        ? "bg-rose-100 text-rose-700"
                        : t.priority === "HIGH"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{t.description || "No description."}</p>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Status: {t.status}</span>
                    <span>{t.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        t.progress === 100 ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${t.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No deadline"}</span>
                  <span className="font-bold text-primary hover:underline">Update Progress ➔</span>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ListTodo size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No tasks found under this filter.</p>
            </div>
          )}

          {selectedTask && (
            <TaskProgressModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdated={() => {
                loadMyTasks();
              }}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
}
