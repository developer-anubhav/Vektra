/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import MainLayout from "../../../layouts/MainLayout"
import KpiCard from "../components/KpiCard"
import AttendanceSummary from "../components/AttendanceSummary"
import EmployeeStatus from "../components/EmployeeStatus"
import { getDashboardStats } from "../../../api/dashboardApi"
import Loader from "../../../components/ui/Loader"
import { Users, UserCheck, UserX, Banknote, LayoutDashboard } from "lucide-react"


export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    monthlyPayroll: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <LayoutDashboard size={14} />
                Overview
              </div>
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 font-medium">Welcome back! Here's what's happening today.</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
                  Last updated: Just now
               </div>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              title="Total Employees" 
              value={stats.totalEmployees} 
              icon={Users}
              color="primary"
            />
            <KpiCard 
              title="Present Today" 
              value={stats.presentToday} 
              icon={UserCheck}
              color="success"
              subtext={`${((stats.presentToday/stats.totalEmployees)*100).toFixed(1)}% availability`}
            />
            <KpiCard 
              title="Absent Today" 
              value={stats.absentToday} 
              icon={UserX}
              color="danger"
              subtext="Needs attention"
            />
            <KpiCard 
              title="Monthly Payroll" 
              value={`₹${stats.monthlyPayroll.toLocaleString()}`} 
              icon={Banknote}
              color="warning"
              subtext="Next run in 12 days"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={{hidden: {opacity:0, x:-20}, show: {opacity:1, x:0}}}>
              <AttendanceSummary />
            </motion.div>
            <motion.div variants={{hidden: {opacity:0, x:20}, show: {opacity:1, x:0}}}>
              <EmployeeStatus />
            </motion.div>
          </div>
        </motion.div>
      )}
    </MainLayout>
  )
}

