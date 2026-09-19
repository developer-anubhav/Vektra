export default function Card({ children, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 shadow-sm ${className}`}>
      {/* Subtle corner glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10 text-slate-800">
        {children}
      </div>
    </div>
  )
}

