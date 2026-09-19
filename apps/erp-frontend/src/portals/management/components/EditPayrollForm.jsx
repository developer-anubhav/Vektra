import { useState } from "react"

export default function EditPayrollForm({ initial, onSubmit }) {

  const [basicSalary, setBasicSalary] = useState(initial.basicSalary)
  const [allowances, setAllowances] = useState(initial.allowances)
  const [deductions, setDeductions] = useState(initial.deductions)

  function handleSubmit(e) {
    e.preventDefault()

    onSubmit({
      basicSalary,
      allowances,
      deductions
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <input
        type="number"
        value={basicSalary}
        onChange={e => setBasicSalary(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        placeholder="Basic Salary"
      />

      <input
        type="number"
        value={allowances}
        onChange={e => setAllowances(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        placeholder="Allowances"
      />

      <input
        type="number"
        value={deductions}
        onChange={e => setDeductions(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        placeholder="Deductions"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Update
      </button>

    </form>
  )
}
