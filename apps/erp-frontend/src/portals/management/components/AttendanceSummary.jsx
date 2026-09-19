/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import Card from "../../../components/ui/Card"
import { getAttendanceSummary } from "../../../api/dashboardApi"
import { motion } from "framer-motion"
import { Users, UserMinus, Clock } from "lucide-react"

export default function AttendanceSummary() {
  const [present, setPresent] = useState(0)
  const [absent, setAbsent] = useState(0)
  const [leave, setLeave] = useState(0)

  useEffect(() => {
    fetchSummary()
  }, [])

  async function fetchSummary() {
    try {
      const res = await getAttendanceSummary()
      let p = 0, a = 0, l = 0
      res.data.forEach((item) => {
        if (item._id === "Present") p = item.count
        if (item._id === "Absent") a = item.count
        if (item._id === "Leave") l = item.count
      })
      setPresent(p)
      setAbsent(a)
      setLeave(l)
    } catch (err) {
      console.log(err)
    }
  }

  const items = [
    { label: "Present", value: present, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: Users },
    { label: "Absent", value: absent, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: UserMinus },
    { label: "Leave", value: leave, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: Clock },
  ]

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight font-heading">
          Daily Attendance
        </h2>
        <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-3xl ${item.bg} border ${item.border} flex flex-col items-center justify-center gap-3 group hover:scale-[1.02] transition-transform shadow-sm`}
          >
            <div className={`p-2 rounded-xl bg-white border border-slate-100 ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
               <item.icon size={20} />
            </div>
            <div className="text-center">
               <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${item.color} mb-1`}>{item.label}</p>
               <p className="text-3xl font-bold text-slate-800 tracking-tight">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}