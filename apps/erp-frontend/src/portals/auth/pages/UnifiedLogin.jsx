import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { loginUser, forgotPassword } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, AlertCircle, ArrowRight, User, Eye, EyeOff, Shield, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"

export default function UnifiedLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { value: "EMPLOYEE", label: "Employee", icon: User, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { value: "HR", label: "HR", icon: Shield, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { value: "MANAGER", label: "Manager", icon: Shield, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { value: "ADMIN", label: "Admin", icon: Shield, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  ]

  const currentRole = roles.find(r => r.value === selectedRole) || roles[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      // Trim email and password to avoid whitespace issues
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()
      console.log('[FRONTEND] Login attempt:', { email: trimmedEmail, passwordLength: trimmedPassword.length, passwordChars: Array.from(trimmedPassword).map(c => c.charCodeAt(0)) })
      const res = await loginUser({ email: trimmedEmail, password: trimmedPassword })
      if (res.data.role !== selectedRole) {
        setError(`Your account role is registered as "${res.data.role}". Please select "${res.data.role}" in the role dropdown above to sign in.`)
        setLoading(false)
        return
      }
      if (selectedRole === "SUPERADMIN") {
        setError("Super Admin access requires separate portal.")
        setLoading(false)
        return
      }
      sessionStorage.setItem("token", res.data.token)
      localStorage.setItem("token", res.data.token)
      login({ 
        role: res.data.role, 
        name: res.data.name,
        email: email
      })
      // Redirect based on role
      if (selectedRole === "EMPLOYEE") {
        navigate("/employee/dashboard")
      } else {
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess(false)
    setForgotLoading(true)
    try {
      await forgotPassword({ email: forgotEmail || email })
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send reset link. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  const roleOptions = roles.map(role => (
    <option key={role.value} value={role.value}>
      {role.label}
    </option>
  ))

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 overflow-hidden selection:bg-emerald-500/10 text-slate-700">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.01] rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/[0.01] rounded-full blur-[120px]"></div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <Loader fullScreen={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl relative z-10 px-4"
      >
        <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Branding & Info */}
          <div className="md:col-span-5 flex flex-col justify-between h-full border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
            <div>
              <Link to="/" className="inline-block mb-6 group">
                <img src="/Vektra.png" alt="Vektra" className="h-11 md:h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" />
              </Link>

              <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                Access your centralized organization portal, employee management workspace, and attendance node.
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                  <div className={`p-2 rounded-xl ${currentRole.bg} border`}>
                    <currentRole.icon size={16} className={currentRole.color} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Target</span>
                    <span>{currentRole.label} Portal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/signup" className="block text-xs font-semibold text-emerald-600 hover:underline">
                Need an organization workspace? Sign up →
              </Link>
              <Link to="/" className="inline-block text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors">
                ← Back to homepage
              </Link>
            </div>
          </div>

          {/* Right Column: Form Inputs */}
          <div className="md:col-span-7">
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Select Portal Role</label>
              <div className="relative group">
                <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value)
                    setError("")
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer shadow-sm"
                >
                  {roleOptions}
                </select>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2.5 rounded-xl flex items-center gap-3 mb-5 text-xs font-medium shadow-sm"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-14 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <Link 
                  to="/super-login" 
                  className="text-slate-400 hover:text-slate-700 transition-colors font-medium"
                >
                  Super Admin Access →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotPasswordOpen(true)
                  }}
                  className="text-emerald-600 hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50 active:scale-[0.98] text-sm"
                >
                  <span className="relative z-10">{loading ? "Signing in..." : "Access Workspace"}</span>
                  {loading ? (
                    <RotateCcw size={18} className="relative z-10 animate-spin" />
                  ) : (
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotPasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setForgotPasswordOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {forgotSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Link Sent!</h3>
                  <p className="text-slate-500 mb-6">
                    If an account with that email exists, a password reset link has been sent.
                    Please check your inbox (and spam folder).
                  </p>
                  <button
                    onClick={() => {
                      setForgotPasswordOpen(false)
                      setForgotSuccess(false)
                    }}
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCcw size={24} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Your Password</h3>
                    <p className="text-slate-500">Enter your email and we'll send you a reset link.</p>
                  </div>

                  {forgotError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 mb-6 text-sm font-medium shadow-sm"
                    >
                      <AlertCircle size={18} />
                      {forgotError}
                    </motion.div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50 active:scale-[0.98]"
                      >
                        <span className="relative z-10">{forgotLoading ? "Sending..." : "Send Reset Link"}</span>
                        {forgotLoading ? (
                          <RotateCcw size={18} className="relative z-10 animate-spin" />
                        ) : (
                          <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setForgotPasswordOpen(false)}
                      className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}