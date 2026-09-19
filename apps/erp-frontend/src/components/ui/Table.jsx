import { Edit2, Trash2, MoreHorizontal } from "lucide-react"

export default function Table({ columns, data, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((col, idx) => (
              <th 
                key={col} 
                className={`p-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-200 ${idx === 0 ? 'rounded-tl-[2rem]' : ''}`}
              >
                {col}
              </th>
            ))}
            <th className="p-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-200 text-right rounded-tr-[2rem]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((emp) => (
            <tr key={emp._id} className="group hover:bg-slate-50/50 transition-all duration-300">
              <td className="p-6 text-sm font-mono text-primary font-bold whitespace-nowrap">{emp.employeeId}</td>
              <td className="p-6 whitespace-nowrap">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-primary border border-blue-100">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                </div>
              </td>
              <td className="p-6 text-sm font-medium text-slate-500 whitespace-nowrap">{emp.department}</td>
              <td className="p-6 text-sm font-medium text-slate-500 whitespace-nowrap">{emp.role}</td>
              <td className="p-6 whitespace-nowrap">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                   emp.status?.toLowerCase() === 'active' || emp.status?.toLowerCase() === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                   emp.status?.toLowerCase() === 'leave' || emp.status?.toLowerCase() === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                   'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                   {emp.status || 'N/A'}
                </span>
              </td>

              <td className="p-6 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2 transition-all">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                      title="Edit Record"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(emp._id)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="p-20 text-center">
           <MoreHorizontal size={40} className="mx-auto text-slate-700 mb-4 animate-pulse" />
           <p className="text-slate-500 font-medium">No records found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

