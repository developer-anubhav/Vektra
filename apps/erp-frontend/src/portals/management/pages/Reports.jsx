/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Select from "../../../components/ui/Select"
import Loader from "../../../components/ui/Loader"
import { getAttendanceReport, getPayrollReport } from "../../../api/reportApi"
import { exportToCsv } from "../../../utils/exportCsv"
import { deleteAttendance } from "../../../api/attendanceApi"
import { deletePayroll } from "../../../api/payrollApi"

export default function Reports() {

  const [type, setType] = useState("attendance")
  const [data, setData] = useState([])
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)



  useEffect(() => {
    fetchReports()
  }, [type])

  async function fetchReports() {
    setLoading(true)
    try {

      if (type === "attendance") {

        const res = await getAttendanceReport()
        setRawData(res.data)

        const formatted = res.data.map(item => ({
          id: item.employee?.employeeId || "",
          name: item.employee?.name || "",
          date: item.date
            ? new Date(item.date).toLocaleDateString()
            : "",
          status: item.status || ""
        }))
        

        setData(formatted)

      } else {

        const res = await getPayrollReport()
        setRawData(res.data)

        const formatted = res.data.map(item => ({
          id: item.employee?.employeeId || "",
          name: item.employee?.name || "",
          month: item.month || "",
          netSalary: item.netSalary || ""
        }))

        setData(formatted)
      }

    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    exportToCsv(`${type}_report.csv`, data)
  }



  async function handleDelete(index) {
    const item = rawData[index]
    if (type === "attendance") {
      await deleteAttendance(item._id)
    } else {
      await deletePayroll(item._id)
    }
    await fetchReports()
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
      <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">Reports</h1>

      <Card>

        <div className="flex justify-between items-center mb-10 gap-4">

          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="attendance">Attendance Report</option>
            <option value="payroll">Payroll Report</option>
          </Select>

          <button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 text-sm h-11 flex items-center justify-center whitespace-nowrap"
          >
              Export CSV
          </button>
          
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left border-separate border-spacing-0">

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Employee ID</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Name</th>

                {type === "attendance" ? (
                  <>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Date</th>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Month</th>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200">Net Salary</th>
                  </>
                )}

                <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">

            {data.map((row, index) => (

              <tr key={index} className="hover:bg-slate-50/50 transition-colors">

                <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">{row.id}</td>
                <td className="p-4 text-slate-700 font-bold text-sm whitespace-nowrap">{row.name}</td>

                {type === "attendance" ? (
                  <>
                    <td className="p-4 text-slate-500 font-semibold text-xs whitespace-nowrap">{row.date}</td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        row.status?.toLowerCase() === 'active' || row.status?.toLowerCase() === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        row.status?.toLowerCase() === 'leave' || row.status?.toLowerCase() === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                        {row.status || 'N/A'}
                        </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 text-slate-500 font-semibold text-xs whitespace-nowrap">{row.month}</td>
                    <td className="p-4 text-slate-700 font-medium whitespace-nowrap">{row.netSalary}</td>
                  </>
                )}

                <td className="p-4 text-right whitespace-nowrap">
                  <span onClick={() => handleDelete(index)} className="text-rose-600 hover:text-rose-700 hover:underline transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer">
                    Delete
                  </span>
                </td>

              </tr>

            ))}

          </tbody>

          </table>
        </div>

      </Card>

        </>
      )}
    </MainLayout>
  )
}
