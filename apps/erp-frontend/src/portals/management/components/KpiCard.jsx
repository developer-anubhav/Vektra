import { motion } from "framer-motion"

export default function KpiCard({ title, value, subtext, icon: Icon, color = "primary" }) {
  const colorMap = {
    primary: "from-blue-50 to-indigo-50/20 text-blue-600 border-blue-100/85",
    success: "from-emerald-50 to-teal-50/20 text-emerald-600 border-emerald-100/85",
    warning: "from-amber-50 to-orange-50/20 text-amber-600 border-amber-100/85",
    danger: "from-rose-50 to-red-50/20 text-rose-600 border-rose-100/85",
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-3xl border p-8 transition-all duration-300 bg-gradient-to-br ${colorMap[color]} shadow-sm group`}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{title}</p>
          <h3 className="text-4xl font-bold text-slate-800 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-inherit shadow-sm">
            <Icon size={24} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {subtext ? (
          <p className="text-sm font-medium text-slate-500">{subtext}</p>
        ) : (
          <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              className="h-full bg-current opacity-50 rounded-full"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

