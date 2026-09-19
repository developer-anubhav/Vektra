import { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { organizationSignup } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Building2, AlertCircle, ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react"

export default function OrganizationSignup() {
    const location = useLocation()
    const [formData, setFormData] = useState({
        companyName: "",
        name: location.state?.name || "",
        email: location.state?.email || "",
        password: location.state?.password || ""
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [pending, setPending] = useState(false)
    const [approved, setApproved] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await organizationSignup(formData)
            // Show pending state with response recorded confirmation
            setPending(true)
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-700">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-lg text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-slate-800 mb-4">Success!</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        Your workspace has been created. Redirecting you to login...
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-emerald-600"
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    if (pending) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-emerald-500/10">
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-white border border-slate-200 p-10 md:p-14 rounded-[3rem] shadow-xl text-center max-w-lg w-full relative overflow-hidden"
                >
                    <div className="w-24 h-24 bg-amber-50 border border-amber-200/60 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                        <Clock size={48} className="text-amber-600 relative z-10" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-slate-800 mb-3 font-heading">
                        Response Recorded
                    </h2>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-widest mb-6">
                        <ShieldCheck size={14} /> Workspace Authorization Pending
                    </div>

                    <p className="text-slate-600 font-medium text-base leading-relaxed mb-6">
                        Thank you for registering <span className="font-bold text-slate-900">{formData.companyName}</span>. Your response has been recorded.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-8 text-left space-y-3">
                        <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Estimated Setup Time</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Up to 4 – 5 Hours</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Admin Account</span>
                            <span className="font-semibold text-slate-800">{formData.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold">Status</span>
                            <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Super Admin Verification
                            </span>
                        </div>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed mb-8">
                        Once authorized by the super admin team, your workspace credentials will be activated and you can log in directly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                            <span>Go to Login Portal</span>
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-slate-100 text-slate-600 font-semibold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-sm border border-slate-200"
                        >
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-slate-50 overflow-hidden selection:bg-emerald-500/10 py-4 md:py-8 px-4 md:px-8 text-slate-700">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.01] rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.01] rounded-full blur-[120px]"></div>

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
                className="w-full max-w-5xl relative z-10"
            >
                <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left Column: Branding & Features */}
                    <div className="md:col-span-5 flex flex-col justify-between h-full border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                        <div>
                            <Link to="/" className="inline-block mb-6 group">
                                <img src="/Vektra.png" alt="Vektra" className="h-11 md:h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" />
                            </Link>

                            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3 font-heading">
                                Empower Your Organization
                            </h2>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                                Join 4,000+ enterprise companies managing workforce, attendance, and payroll with precision.
                            </p>

                            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs font-medium text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Instant Workspace Provisioning</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>No Credit Card Required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Guaranteed Data Sovereignty</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <Link to="/login" className="block text-xs font-semibold text-emerald-600 hover:underline">
                                Already have an organization? Sign in →
                            </Link>
                            <Link to="/" className="inline-block text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors">
                                ← Back to homepage
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Form Container */}
                    <div className="md:col-span-7">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Create Workspace</h3>
                            <p className="text-slate-400 text-xs font-medium">Setting up private enterprise infrastructure.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2.5 rounded-xl flex items-center gap-3 mb-4 text-xs font-medium shadow-sm"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Organization Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Organization Name</label>
                                    <div className="relative group">
                                        <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Acme Corp"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Full Name</label>
                                    <div className="relative group">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email Address */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Corporate Email</label>
                                    <div className="relative group">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="admin@company.com"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-12 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium shadow-sm"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 group overflow-hidden relative active:scale-[0.98] text-sm"
                                >
                                    <span className="relative z-10">Initialize Workspace</span>
                                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}