import { useParams } from "react-router-dom"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import { employees } from "../../../data/employees"

export default function EmployeeProfile() {
  const { id } = useParams()
  const emp = employees.find(e => e.id === id)

  if (!emp) return null

  return (
    <MainLayout>
      <h1 className="text-2xl font-semibold mb-4">
        Employee Profile
      </h1>

      <Card>
        <p><b>ID:</b> {emp.id}</p>
        <p><b>Name:</b> {emp.name}</p>
        <p><b>Department:</b> {emp.department}</p>
        <p><b>Role:</b> {emp.role}</p>
        <p><b>Status:</b> {emp.status}</p>
      </Card>
    </MainLayout>
  )
}
