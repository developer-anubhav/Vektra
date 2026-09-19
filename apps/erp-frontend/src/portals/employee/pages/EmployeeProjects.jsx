import { useState, useEffect } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { fetchProjectsApi } from "../../../api/projectApi";
import Loader from "../../../components/ui/Loader";
import { FolderKanban, Users, Calendar, Clock } from "lucide-react";

export default function EmployeeProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetchProjectsApi();
      setProjects(res.data.data || []);
    } catch (err) {
      console.error("Failed to load employee projects:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <div className="space-y-6">
          <header>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <FolderKanban size={14} />
              My Workspace
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">My Projects</h1>
            <p className="text-slate-500 font-medium text-sm">
              Projects you are assigned to as a team member or manager.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p._id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {p.projectCode}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{p.name}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{p.description || "No description provided."}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Project Manager:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.projectManager?.name || "Unassigned"}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Team Members:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.teamMembers?.length || 0} members</span>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Progress</span>
                    <span>{p.actualProgress || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${p.actualProgress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FolderKanban size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">You are not currently assigned to any active projects.</p>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
