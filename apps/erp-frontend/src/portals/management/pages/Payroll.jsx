import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Modal from "../../../components/ui/Modal"
import Loader from "../../../components/ui/Loader"

import {
  getPayroll,
  addPayroll,
  updatePayroll,
  deletePayroll
} from "../../../api/payrollApi"

import { getEmployees } from "../../../api/employeeApi"

import EditPayrollForm from "../components/EditPayrollForm"

export default function Payroll() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get("search") || ""

  const [payroll, setPayroll] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState(initialSearch)

  const [employee, setEmployee] = useState("")
  const [month, setMonth] = useState("")
  const [basicSalary, setBasicSalary] = useState("")
  const [allowances, setAllowances] = useState("")
  const [deductions, setDeductions] = useState("")

  const [selected, setSelected] = useState(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([fetchPayroll(), fetchEmployees()])
      setLoading(false)
    }
    loadAll()
  }, [])

  async function fetchPayroll() {
    const res = await getPayroll()
    setPayroll(res.data)
  }

  async function fetchEmployees() {
    const res = await getEmployees()
    setEmployees(res.data)
  }

  async function handleAdd() {

    await addPayroll({
      employee,
      month,
      basicSalary,
      allowances,
      deductions
    })

    await fetchPayroll()
  }

  function handleEdit(item) {
    setSelected(item)
    setOpenEdit(true)
  }

  async function handleUpdate(updated) {

    await updatePayroll(selected._id, updated)

    await fetchPayroll()

    setOpenEdit(false)
  }

  async function handleDelete(id) {

    await deletePayroll(id)

    await fetchPayroll()
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
      <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">
        Payroll
      </h1>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search payroll by employee name..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

          <select
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
            onChange={e => setEmployee(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.employeeId} - {emp.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Month"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            onChange={e => setMonth(e.target.value)}
          />

          <input
            type="number"
            placeholder="Basic Salary"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            onChange={e => setBasicSalary(e.target.value)}
          />

          <input
            type="number"
            placeholder="Allowances"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            onChange={e => setAllowances(e.target.value)}
          />

          <input
            type="number"
            placeholder="Deductions"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            onChange={e => setDeductions(e.target.value)}
          />

          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95 text-sm"
          >
            Add
          </button>

        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left border-collapse">

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Employee</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Month</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Net Salary</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">

              {payroll
                .filter(item => 
                  item.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
                  item.employee?.employeeId.toLowerCase().includes(search.toLowerCase())
                )
                .map(item => (

                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">

                  <td className="p-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                    {item.employee?.employeeId} - {item.employee?.name}
                  </td>

                  <td className="p-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                    {item.month}
                  </td>

                  <td className="p-4 text-emerald-600 font-bold font-mono text-sm whitespace-nowrap">
                    ₹{item.netSalary?.toLocaleString()}
                  </td>

                  <td className="p-4 text-right space-x-3 whitespace-nowrap">

                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold text-xs uppercase tracking-wider"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-rose-600 hover:text-rose-700 hover:underline transition-colors font-bold text-xs uppercase tracking-wider"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>
        </div>

      </Card>

      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Payroll"
      >
        {selected && (
          <EditPayrollForm
            initial={selected}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>
        </>
      )}
    </MainLayout>
  )
}
