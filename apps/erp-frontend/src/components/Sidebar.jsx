import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ShieldCheck,
  DollarSign,
  BarChart3,
  X,
  ChevronRight,
  FolderKanban,
  ListTodo,
  FileText
} from "lucide-react"

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth()

  const menu = [
    { name: "Dashboard", path: "/dashboard", roles: ["ADMIN", "HR", "MANAGER"], icon: LayoutDashboard },
    { name: "Projects & Analytics", path: "/projects", roles: ["ADMIN", "HR", "MANAGER"], icon: FolderKanban },
    { name: user?.role === "ADMIN" ? "View Employees" : "Employees", path: "/employees", roles: ["ADMIN", "HR"], icon: Users },
    { name: "Attendance", path: "/attendance", roles: ["ADMIN", "HR", "MANAGER"], icon: CalendarCheck },
    { name: "Company Documents", path: "/documents", roles: ["ADMIN", "HR", "MANAGER"], icon: FileText },
    { name: "Manage Staff", path: "/admin/manage-staff", roles: ["ADMIN"], icon: ShieldCheck },
    { name: "Payroll", path: "/payroll", roles: ["ADMIN", "HR"], icon: DollarSign },
    { name: "Reports", path: "/reports", roles: ["ADMIN", "HR"], icon: BarChart3 },
    
    // Employee Portal items
    { name: "My Dashboard", path: "/employee/dashboard", roles: ["EMPLOYEE"], icon: LayoutDashboard },
    { name: "My Projects", path: "/employee/projects", roles: ["EMPLOYEE"], icon: FolderKanban },
    { name: "My Tasks", path: "/employee/tasks", roles: ["EMPLOYEE"], icon: ListTodo },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          ></motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#161a29] border-r border-slate-800/80 text-slate-400 w-72 z-50 transform transition-transform duration-500 md:relative md:translate-x-0 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-8 pb-10 border-b border-slate-800/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/Vektra-dark.png" alt="Vektra" className="h-9 md:h-10 w-auto object-contain" />
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Main Menu</p>
          {menu
            .filter(item => user && item.roles.includes(user.role))
            .map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                    ? "bg-primary/15 text-primary font-bold shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]"
                    : "hover:bg-white/5 hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={`${isActive ? "text-primary" : "group-hover:text-slate-200"} transition-colors`} />
                      <span className="font-medium text-[14px]">{item.name}</span>
                    </div>
                    {isActive && <motion.div layoutId="activeInd" className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                    {!isActive && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-slate-400 group-hover:text-slate-200" />}
                  </>
                )}
              </NavLink>
            ))}
        </nav>
      </aside>
    </>
  )
}
