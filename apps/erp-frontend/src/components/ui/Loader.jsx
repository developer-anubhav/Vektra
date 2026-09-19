import { motion } from "framer-motion"

export default function Loader({ fullScreen = true, text }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
        <div className="relative flex flex-col items-center justify-center">
          {/* Outer glowing spinning ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-32 h-32 md:w-36 md:h-36 rounded-full border-2 border-transparent border-t-blue-500 border-r-emerald-500 absolute drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
          />

          {/* Reverse subtle dashed ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full border border-dashed border-slate-700/60 absolute"
          />

          {/* Central Vektra Logo Container - Circular Shape */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.9, 1, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-20 h-20 md:w-24 md:h-24 relative flex items-center justify-center p-3.5 rounded-full bg-slate-900/90 border border-slate-800/80 shadow-2xl shadow-blue-500/20 backdrop-blur-sm"
          >
            <img
              src="/VektraLazyLoading.png"
              alt="Vektra Loading..."
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-full"
            />
          </motion.div>
        </div>

        {/* Loading text indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 animate-pulse">
            {text || "Loading Workspace..."}
          </p>
        </motion.div>
      </div>
    )
  }

  // Inline / Section Content Loader
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px] select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-20 h-20 rounded-full border-2 border-transparent border-t-blue-500 border-r-emerald-500 absolute drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]"
        />

        {/* Inner Pulsing Vektra Logo - Circular Shape */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-12 h-12 relative flex items-center justify-center p-2 rounded-full bg-slate-900/80 border border-slate-800 shadow-lg"
        >
          <img
            src="/VektraLazyLoading.png"
            alt="Loading..."
            className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(59,130,246,0.5)] rounded-full"
          />
        </motion.div>
      </div>
      {text && (
        <p className="mt-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}
