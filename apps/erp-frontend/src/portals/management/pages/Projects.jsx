import { useState, useEffect } from "react";
import MainLayout from "../../../layouts/MainLayout";
import {
  fetchProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
  fetchProjectAnalyticsApi,
  addTeamMembersApi,
  removeTeamMemberApi,
  createMilestoneApi,
  createTaskApi,
  fetchTasksApi,
} from "../../../api/projectApi";
import { getEmployees } from "../../../api/employeeApi";
import Loader from "../../../components/ui/Loader";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ChevronRight,
  UserCheck,
  Calendar,
  X,
  TrendingUp,
  ListTodo,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function Projects() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, projects, tasks, workload, overdue
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    projectCode: "",
    name: "",
    description: "",
    priority: "MEDIUM",
    status: "PLANNING",
    projectManager: "",
    teamMembers: [],
    startDate: "",
    endDate: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: [],
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, analyticsRes, empRes, tasksRes] = await Promise.all([
        fetchProjectsApi(),
        fetchProjectAnalyticsApi(),
        getEmployees(),
        fetchTasksApi(),
      ]);

      setProjects(projRes.data.data || []);
      setAnalytics(analyticsRes.data.data || null);
      setEmployees(empRes.data || []);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      console.error("Failed to load project management data:", err);
    } finally {
      setLoading(false);
    }
  }

  const managersList = employees.filter((e) => ["MANAGER", "ADMIN"].includes((e.role || "").toUpperCase()));

  async function handleCreateProject(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await createProjectApi(projectForm);
      setSuccessMsg("Project created successfully!");
      setShowCreateModal(false);
      setProjectForm({
        projectCode: "",
        name: "",
        description: "",
        priority: "MEDIUM",
        status: "PLANNING",
        projectManager: "",
        teamMembers: [],
        startDate: "",
        endDate: "",
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create project");
    }
  }

  async function handleAddMembers(e) {
    e.preventDefault();
    if (!selectedProject || selectedMembers.length === 0) return;
    setErrorMsg("");
    try {
      await addTeamMembersApi(selectedProject._id, selectedMembers);
      setSuccessMsg("Team members updated successfully!");
      setShowMemberModal(false);
      setSelectedMembers([]);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to add members");
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!selectedProject) return;
    setErrorMsg("");
    try {
      await createTaskApi({
        ...taskForm,
        projectId: selectedProject._id,
      });
      setSuccessMsg("Task created successfully!");
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        assignedTo: [],
        priority: "MEDIUM",
        status: "TODO",
        dueDate: "",
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create task");
    }
  }

  async function handleArchiveProject(projectId) {
    if (!window.confirm("Are you sure you want to archive this project?")) return;
    try {
      await deleteProjectApi(projectId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to archive project");
    }
  }

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Recharts colours for task distribution
  const COLORS = ["#94a3b8", "#3b82f6", "#a855f7", "#22c55e", "#ef4444"];
  const pieData = analytics?.taskDistribution
    ? [
        { name: "To Do", value: analytics.taskDistribution.TODO },
        { name: "In Progress", value: analytics.taskDistribution.IN_PROGRESS },
        { name: "In Review", value: analytics.taskDistribution.IN_REVIEW },
        { name: "Completed", value: analytics.taskDistribution.COMPLETED },
        { name: "Blocked", value: analytics.taskDistribution.BLOCKED },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <FolderKanban size={14} />
                Project Management
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Projects & Analytics
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                Track delivery health, team workload, and project milestones across your company.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
              >
                <Plus size={18} />
                New Project
              </button>
            </div>
          </header>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex justify-between items-center">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Overview & Analytics", icon: TrendingUp },
              { id: "projects", label: "All Projects", icon: FolderKanban },
              { id: "tasks", label: "Team Tasks", icon: ListTodo },
              { id: "workload", label: "Employee Workload", icon: Users },
              { id: "overdue", label: `Overdue Tasks (${analytics?.summary?.overdueTasksCount || 0})`, icon: AlertTriangle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-900 dark:hover:bg-slate-100"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Projects</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {analytics?.summary?.totalProjects || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <FolderKanban size={24} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {analytics?.summary?.completionRate || 0}%
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Tasks</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {analytics?.summary?.totalTasks || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                <ListTodo size={24} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Deliverables</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {analytics?.summary?.overdueTasksCount || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Project Health Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Flame className="text-amber-500" size={20} />
                    Project Delivery Health
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Computed per company metrics</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Health</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Manager</th>
                        <th className="py-3 px-4">Progress</th>
                        <th className="py-3 px-4">Tasks</th>
                        <th className="py-3 px-4">Overdue</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {analytics?.projectHealth?.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            {p.health === "GREEN" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold">
                                🟢 On Track
                              </span>
                            )}
                            {p.health === "YELLOW" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-bold">
                                🟡 At Risk
                              </span>
                            )}
                            {p.health === "RED" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400 text-xs font-bold">
                                🔴 Critical
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                            <div className="text-xs text-slate-400">{p.projectCode}</div>
                          </td>
                          <td className="py-3 px-4">{p.projectManager?.name || "Unassigned"}</td>
                          <td className="py-3 px-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>{p.completionRate}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    p.completionRate >= 75
                                      ? "bg-emerald-500"
                                      : p.completionRate >= 40
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${p.completionRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {p.completedTasks}/{p.totalTasks} Done
                          </td>
                          <td className="py-3 px-4">
                            {p.overdueTasksCount > 0 ? (
                              <span className="font-bold text-rose-600">{p.overdueTasksCount} overdue</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setShowTaskModal(true);
                              }}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              + Add Task
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Distribution */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Task Status Distribution</h3>
                  {pieData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm py-10 text-center">No tasks available for chart</p>
                  )}
                </div>

                {/* Workload Bar Chart */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Top Employee Workload</h3>
                  {analytics?.employeeWorkload?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.employeeWorkload.slice(0, 6)}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="assignedTasksCount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Assigned Tasks" />
                          <Bar dataKey="completedTasksCount" fill="#22c55e" radius={[6, 6, 0, 0]} name="Completed Tasks" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm py-10 text-center">No workload data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS DIRECTORY */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {["ALL", "PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === status
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((p) => (
                  <div
                    key={p._id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
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

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Manager:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.projectManager?.name || "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Team Size:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.teamMembers?.length || 0} members
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          setShowMemberModal(true);
                        }}
                        className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary flex items-center gap-1"
                      >
                        <UserCheck size={14} /> Assign Team
                      </button>

                      <button
                        onClick={() => handleArchiveProject(p._id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TEAM TASKS */}
          {activeTab === "tasks" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Company Tasks</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {tasks.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.title}</td>
                        <td className="py-3 px-4">{t.projectId?.name || "N/A"}</td>
                        <td className="py-3 px-4">
                          {t.assignedTo?.map((emp) => emp.name).join(", ") || "Unassigned"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              t.priority === "URGENT"
                                ? "bg-rose-100 text-rose-700"
                                : t.priority === "HIGH"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{t.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EMPLOYEE WORKLOAD */}
          {activeTab === "workload" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Capacity & Workload</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Assigned Tasks</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">In Progress</th>
                      <th className="py-3 px-4">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {analytics?.employeeWorkload?.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                        <td className="py-3 px-4">{emp.department}</td>
                        <td className="py-3 px-4 font-bold text-primary">{emp.assignedTasksCount}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">{emp.completedTasksCount}</td>
                        <td className="py-3 px-4 text-amber-600 font-bold">{emp.inProgressTasksCount}</td>
                        <td className="py-3 px-4 text-rose-600 font-bold">{emp.overdueTasksCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: OVERDUE TASKS */}
          {activeTab === "overdue" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle size={20} />
                Critical Overdue Deliverables
              </h3>
              {analytics?.overdueTasks?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.overdueTasks.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-900/10 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Due: {new Date(t.dueDate).toLocaleDateString()} | Priority: {t.priority}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">OVERDUE</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-6">🎉 No overdue tasks! All deliverables are on time.</p>
              )}
            </div>
          )}

          {/* CREATE PROJECT MODAL */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Project</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PRJ-2026-01"
                      value={projectForm.projectCode}
                      onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Enterprise HR Automation"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Manager *</label>
                    <select
                      required
                      value={projectForm.projectManager}
                      onChange={(e) => setProjectForm({ ...projectForm, projectManager: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Select Manager</option>
                      {managersList.map((m) => (
                        <option key={m._id} value={m._id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                      <select
                        value={projectForm.priority}
                        onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="LOW" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">LOW</option>
                        <option value="MEDIUM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">MEDIUM</option>
                        <option value="HIGH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">HIGH</option>
                        <option value="URGENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">URGENT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                      <select
                        value={projectForm.status}
                        onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="PLANNING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">PLANNING</option>
                        <option value="IN_PROGRESS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">IN_PROGRESS</option>
                        <option value="ON_HOLD" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">ON_HOLD</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90"
                    >
                      Save Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ASSIGN TEAM MEMBERS MODAL */}
          {showMemberModal && selectedProject && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Assign Team: {selectedProject.name}
                  </h3>
                  <button onClick={() => setShowMemberModal(false)} className="text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddMembers} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Select Employees to Add
                    </label>
                    <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                      {employees.map((emp) => (
                        <label key={emp._id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(emp._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers([...selectedMembers, emp._id]);
                              } else {
                                setSelectedMembers(selectedMembers.filter((id) => id !== emp._id));
                              }
                            }}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{emp.name}</span>
                            <span className="text-xs text-slate-400">{emp.department} • {emp.role}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold">
                      Add Members
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CREATE TASK MODAL */}
          {showTaskModal && selectedProject && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Add Task for {selectedProject.name}
                  </h3>
                  <button onClick={() => setShowTaskModal(false)} className="text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Build authentication endpoints"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Employees</label>
                    <select
                      multiple
                      value={taskForm.assignedTo}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          assignedTo: Array.from(e.target.selectedOptions, (option) => option.value),
                        })
                      }
                      className="w-full h-28 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="LOW" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">LOW</option>
                        <option value="MEDIUM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">MEDIUM</option>
                        <option value="HIGH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">HIGH</option>
                        <option value="URGENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">URGENT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold">
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
