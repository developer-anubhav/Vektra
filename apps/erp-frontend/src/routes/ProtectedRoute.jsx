import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    // Redirect based on user's actual role
    switch (user.role) {
      case "EMPLOYEE":
        return <Navigate to="/employee/dashboard" replace />
      case "SUPERADMIN":
        return <Navigate to="/superadmin-dashboard" replace />
      case "ADMIN":
        return <Navigate to="/admin/manage-staff" replace />
      default:
        return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
