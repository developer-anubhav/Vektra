import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./routes/ProtectedRoute"
import Loader from "./components/ui/Loader"

const Login = lazy(() => import("./pages/auth/Login"))
const OrganizationSignup = lazy(() => import("./pages/auth/OrganizationSignup"))
const LandingPage = lazy(() => import("./pages/LandingPage"))

const Dashboard = lazy(() => import("./pages/hr/Dashboard"))
const Employees = lazy(() => import("./pages/hr/Employees"))
const Attendance = lazy(() => import("./pages/hr/Attendance"))
const KioskMode = lazy(() => import("./pages/hr/KioskMode"))
const MobileCheckIn = lazy(() => import("./pages/employee/MobileCheckIn"))
const Payroll = lazy(() => import("./pages/hr/Payroll"))
const Reports = lazy(() => import("./pages/hr/Reports"))
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"))
const ManageStaff = lazy(() => import("./pages/admin/ManageStaff"))
const SuperLogin = lazy(() => import("./pages/auth/SuperLogin"))

export default function App() {

  return (
    <AuthProvider>

      <Router>
        <Suspense fallback={<Loader fullScreen={true} />}>

        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<OrganizationSignup />} />
          <Route path="/super-login" element={<SuperLogin />} />
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kiosk"
            element={
              <ProtectedRoute>
                <KioskMode />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mobile-checkin"
            element={
              <ProtectedRoute>
                <MobileCheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <Payroll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
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
