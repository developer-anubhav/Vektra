import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, RotateCcw } from "lucide-react"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(true)

  useEffect(() => {
    if (!token || !email) {
      setValidToken(false)
    }
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, email, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Token may be expired.")
    } finally {
      setLoading(false)
    }
  }

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
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center"
          >
            <Loader fullScreen={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[90%] max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="inline-block mb-4 group">
            <img src="/Vektra.png" alt="Vektra" className="h-11 md:h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-lg relative overflow-hidden">
          {!validToken ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Invalid Reset Link</h3>
              <p className="text-slate-500 mb-6">
                This password reset link is invalid or has expired. 
                Please request a new one.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95 text-sm"
              >
                Request New Reset Link
              </button>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Password Reset Successful!</h3>
              <p className="text-slate-500 mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95 text-sm"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Set New Password</h3>
                <p className="text-slate-500">Enter your new password below.</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 mb-8 text-sm font-medium shadow-sm"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={8}
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
                  <p className="text-[11px] text-slate-500 ml-1">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50 active:scale-[0.98] text-sm"
                  >
                    <span className="relative z-10">{loading ? "Resetting..." : "Reset Password"}</span>
                    {loading ? (
                      <RotateCcw size={18} className="relative z-10 animate-spin" />
                    ) : (
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}