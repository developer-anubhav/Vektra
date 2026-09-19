import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { loginUser } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"

export default function SuperLogin() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await loginUser({
        email,
        password
      })

      // Check if role is SUPERADMIN
      if (res.data.role !== "SUPERADMIN") {
        setError("Access Denied: Only Super Admin can access this portal.")
        setLoading(false)
        return
      }

      // Store JWT Token
      sessionStorage.setItem("token", res.data.token)
      localStorage.setItem("token", res.data.token)

      // Store user role & name in AuthContext
      login({
        role: res.data.role,
        name: res.data.name,
        email: email // Store email for display
      })

      // Redirect to Super Admin Dashboard
      navigate("/superadmin-dashboard")

    } catch (err) {
      setError(err.response?.data?.message || "Super Admin Login Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 selection:bg-emerald-500/10 text-slate-700 relative overflow-hidden">
      {loading && <div className="fixed inset-0 z-[100]"><Loader fullScreen={true} /></div>}
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/[0.01] rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-200 shadow-lg w-full"
        >
          <div className="text-center mb-10">
              <img src="/Vektra.png" alt="Vektra" className="h-14 md:h-16 w-auto object-contain mx-auto mb-4 hover:scale-105 transition-transform duration-300" />
              <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
                Super Admin
              </h2>
              <p className="text-slate-500 font-medium">Root Access Node</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl relative mb-8 animate-pulse text-center font-semibold shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                placeholder="Super Admin Credential"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <input
                type="password"
                placeholder="Security Phrase"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-10 bg-emerald-600 text-white font-bold py-5 rounded-2xl hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
          >
            Authorize Access
          </button>

          <div className="mt-10 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold">Secure Connection Established</p>
          </div>

        </form>
        
        <div className="mt-8 text-center">
            <button 
                onClick={() => navigate("/")}
                className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l-7-7m7-7H3"></path></svg>
                Return to Surface
            </button>
        </div>
      </div>

    </div>
  )
}
