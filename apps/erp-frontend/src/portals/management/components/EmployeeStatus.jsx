/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import Card from "../../../components/ui/Card"
import { getEmployeeStatus } from "../../../api/dashboardApi"
import { motion } from "framer-motion"
import { Activity, ShieldOff } from "lucide-react"

export default function EmployeeStatus() {
  const [active, setActive] = useState(0)
  const [inactive, setInactive] = useState(0)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await getEmployeeStatus()
      setActive(res.data.active)
      setInactive(res.data.inactive)
    } catch (err) {
      console.log(err)
    }
  }

  const total = active + inactive
  const activePercent = total ? (active / total) * 100 : 0
  const inactivePercent = total ? (inactive / total) * 100 : 0

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight font-heading">
          Workforce Health
        </h2>
        <Activity size={20} className="text-primary opacity-50" />
      </div>

      <div className="space-y-10">
        <div className="group">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Staff</p>
            </div>
            <p className="text-xl font-bold text-slate-800 font-heading">
              {active} <span className="text-xs text-slate-400 font-semibold ml-1">({activePercent.toFixed(0)}%)</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[2px] border border-slate-200/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${activePercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full relative"
            >
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-[4px]"></div>
            </motion.div>
          </div>
        </div>

        <div className="group">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldOff size={14} />
              <p className="text-sm font-bold uppercase tracking-widest">Off-boarded</p>
            </div>
            <p className="text-xl font-bold text-slate-800 font-heading">
              {inactive} <span className="text-xs text-slate-400 font-semibold ml-1">({inactivePercent.toFixed(0)}%)</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[2px] border border-slate-200/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${inactivePercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="bg-slate-300 h-full rounded-full"
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100">
           <p className="text-[11px] text-slate-500 text-center italic">
             Workforce metrics are calculated based on current department assignments.
           </p>
        </div>
      </div>
    </Card>
  )
}