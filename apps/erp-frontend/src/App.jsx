import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./routes/ProtectedRoute"
import Loader from "./components/ui/Loader"

const UnifiedLogin = lazy(() => import("./portals/auth/pages/UnifiedLogin"))
const ResetPassword = lazy(() => import("./portals/auth/pages/ResetPassword"))
const OrganizationSignup = lazy(() => import("./portals/auth/pages/OrganizationSignup"))
const LandingPage = lazy(() => import("./pages/LandingPage"))

const Dashboard = lazy(() => import("./portals/management/pages/Dashboard"))
const Projects = lazy(() => import("./portals/management/pages/Projects"))
const Employees = lazy(() => import("./portals/management/pages/Employees"))
const Attendance = lazy(() => import("./portals/management/pages/Attendance"))
const KioskMode = lazy(() => import("./portals/management/pages/KioskMode"))
const MobileCheckIn = lazy(() => import("./portals/employee/pages/MobileCheckIn"))
const EmployeeDashboard = lazy(() => import("./portals/employee/pages/EmployeeDashboard"))
const EmployeeProjects = lazy(() => import("./portals/employee/pages/EmployeeProjects"))
const EmployeeTasks = lazy(() => import("./portals/employee/pages/EmployeeTasks"))
const Payroll = lazy(() => import("./portals/management/pages/Payroll"))
const Reports = lazy(() => import("./portals/management/pages/Reports"))
const Documents = lazy(() => import("./portals/management/pages/Documents"))
const SuperAdminDashboard = lazy(() => import("./portals/superadmin/pages/SuperAdminDashboard"))
const ManageStaff = lazy(() => import("./portals/management/pages/ManageStaff"))
const SuperLogin = lazy(() => import("./portals/auth/pages/SuperLogin"))

export default function App() {

  return (
    <AuthProvider>

      <Router>
        <Suspense fallback={<Loader fullScreen={true} />}>
        <Routes>
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<OrganizationSignup />} />
          <Route path="/super-login" element={<SuperLogin />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />

          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/projects"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <EmployeeProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <EmployeeTasks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                <Projects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute roles={["ADMIN", "HR"]}>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kiosk"
            element={
              <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                <KioskMode />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mobile-checkin"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <MobileCheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payroll"
            element={
              <ProtectedRoute roles={["ADMIN", "HR"]}>
                <Payroll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={["ADMIN", "HR"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin-dashboard"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-staff"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <ManageStaff />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>

      </Router>

    </AuthProvider>
  )
}
