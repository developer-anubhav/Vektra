import { createPortal } from "react-dom"

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-heading">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">✕</button>
        </div>
        <div className="text-slate-600 font-medium">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
