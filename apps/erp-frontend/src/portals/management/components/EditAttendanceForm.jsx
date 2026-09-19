import { useState } from "react"

export default function EditAttendanceForm({ initial, onSubmit }) {

  const [status, setStatus] = useState(initial.status)

  function handleSubmit(e) {
    e.preventDefault()

    onSubmit({
      status
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
      >
        <option>Present</option>
        <option>Absent</option>
        <option>Leave</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Update
      </button>

    </form>
  )
}
