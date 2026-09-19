import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowRight,
    Clock,
    Banknote,
    BarChart3,
    CheckCircle2,
    Zap,
    Activity,
    ChevronRight,
    ShieldAlert,
    Users,
    Lock,
    Shield,
    Award,
    Briefcase,
    Globe,
    Check,
    Play,
    User,
    Mail,
    TrendingUp,
    Search,
    Menu,
    X,
    Filter,
    Calendar,
    Download,
    FileSpreadsheet,
    FileText,
    Percent,
    Sparkles
} from "lucide-react"

export default function LandingPage() {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("people")

    // Hero Signup Form State
    const [signupForm, setSignupForm] = useState({
        name: "",
        email: "",
        password: "",
        agree: false
    })
    const [formError, setFormError] = useState("")

    // Interactive Demo States
    const [clockedIn, setClockedIn] = useState(false)
    const [clockTime, setClockTime] = useState("09:00 AM")
    const [attendances, setAttendances] = useState([
        { day: "Mon", status: "On Time", checkIn: "08:58 AM", checkOut: "06:02 PM", hours: "9.0h" },
        { day: "Tue", status: "On Time", checkIn: "09:01 AM", checkOut: "06:05 PM", hours: "9.0h" },
        { day: "Wed", status: "Late Entry", checkIn: "09:22 AM", checkOut: "06:00 PM", hours: "8.6h" },
    ])
    const [employees, setEmployees] = useState([
        { id: 1, name: "Amit Sharma", role: "Software Engineer", dept: "Engineering", status: "Active" },
        { id: 2, name: "Neha Patel", role: "HR Manager", dept: "People Ops", status: "Active" },
        { id: 3, name: "Rajesh Kumar", role: "QA Lead", dept: "QA", status: "Active" },
        { id: 4, name: "Priya Singh", role: "UX Designer", dept: "Design", status: "On Leave" },
    ])
    const [employeeSearch, setEmployeeSearch] = useState("")

    const handleQuickSignupSubmit = (e) => {
        e.preventDefault()
        setFormError("")
        if (!signupForm.name || !signupForm.email || !signupForm.password) {
            setFormError("All fields are required")
            return
        }
        if (!signupForm.agree) {
            setFormError("You must agree to the Terms of Service")
            return
        }
        // Redirect to main signup page and pass the fields in state
        navigate("/signup", {
            state: {
                name: signupForm.name,
                email: signupForm.email,
                password: signupForm.password
            }
        })
    }

    const toggleClockIn = () => {
        if (!clockedIn) {
            setClockedIn(true)
            const now = new Date()
            setClockTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            // Add new mock row
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            const currentDay = days[now.getDay()]
            setAttendances([
                {
                    day: currentDay,
                    status: "On Time",
                    checkIn: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    checkOut: "--",
                    hours: "--"
                },
                ...attendances
            ])
        } else {
            setClockedIn(false)
            // Update last row checkout
            const updated = [...attendances]
            if (updated.length > 0) {
                updated[0].checkOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                updated[0].hours = "8.2h"
            }
            setAttendances(updated)
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.role.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.dept.toLowerCase().includes(employeeSearch.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600/20 flex flex-col relative overflow-x-hidden">
            
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-2 px-4 text-center text-xs font-semibold tracking-wide relative z-50">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold mr-2">New</span>
                Vektra 2.0 is live! Introducing automated facial recognition kiosk verification. 
                <Link to="/signup" className="underline ml-1 hover:text-blue-200 transition-colors">Start Free Trial →</Link>
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img 
                            src="/Vektra.png" 
                            alt="Vektra" 
                            className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className="text-[11px] bg-blue-100/80 text-blue-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs">HRMS</span>
                    </Link>

                    {/* Desktop Navigation Link Menu */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#demo" className="hover:text-blue-600 transition-colors">Interactive Demo</a>
                        <a href="#security" className="hover:text-blue-600 transition-colors">Security & Privacy</a>
                        <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                    </nav>

                    {/* Nav Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            to="/super-login"
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all uppercase tracking-wider group"
                        >
                            <ShieldAlert size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                            Super Login
                        </Link>
                        <Link
                            to="/login"
                            className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2.5 text-sm font-bold text-white bg-[#E53935] hover:bg-[#d32f2f] rounded-xl hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all"
                        >
                            SIGN UP FOR FREE
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden border-t border-slate-200 bg-white"
                        >
                            <div className="p-6 flex flex-col gap-4 font-semibold text-slate-600 text-sm">
                                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1 transition-colors">Features</a>
                                <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1 transition-colors">Interactive Demo</a>
                                <a href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1 transition-colors">Security & Privacy</a>
                                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1 transition-colors">Pricing</a>
                                <hr className="border-slate-100" />
                                <Link to="/super-login" onClick={() => setMobileMenuOpen(false)} className="text-amber-600 flex items-center gap-2 py-1">
                                    <ShieldAlert size={14} /> Super Login
                                </Link>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Sign In</Link>
                                <Link 
                                    to="/signup" 
                                    onClick={() => setMobileMenuOpen(false)} 
                                    className="bg-[#E53935] hover:bg-[#d32f2f] text-white text-center py-3 rounded-xl transition-all"
                                >
                                    SIGN UP FOR FREE
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Split Hero Section with Built-in Signup Form (Zoho Style) */}
            <section className="relative pt-16 pb-24 px-6 md:px-12 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
                    
                    {/* Hero Left Content */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                            <Sparkles size={14} className="text-blue-500 animate-pulse" />
                            Unified Enterprise HR Operating System
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-slate-900 font-heading leading-[1.08]">
                            Manage your workforce. <br />
                            <span className="text-slate-800 font-light">
                                Minus the friction.
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            An integrated, secure platform built to automate employee records, instant attendance, customized payroll cycles, and performance BI. Your human resource management, automated.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-8 gap-y-4 pt-4 border-t border-slate-200">
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 font-heading">10k+</h4>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Organizations</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 font-heading">99.98%</h4>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">System Uptime</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 font-heading">100%</h4>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Secure & Compliant</p>
                            </div>
                        </div>

                        {/* Customer Logos - Monochromatic & Elegant */}
                        <div className="pt-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted by leading enterprises</p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-45 grayscale contrast-200">
                                <span className="font-heading font-black text-lg tracking-wider">MICROSOFT</span>
                                <span className="font-heading font-black text-lg tracking-wider">STRIPE</span>
                                <span className="font-heading font-black text-lg tracking-wider">SLACK</span>
                                <span className="font-heading font-black text-lg tracking-wider">AIRBNB</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Right: Integrated Signup Card */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100 relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#E53935] via-[#43A047] to-[#1E88E5]"></div>
                            
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Get Started for Free</h3>
                            <p className="text-slate-500 text-sm mb-6 font-medium">Create your organization portal in less than 2 minutes.</p>
                            
                            {formError && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-semibold">
                                    <ShieldAlert size={16} />
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleQuickSignupSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Amit Sharma"
                                            value={signupForm.name}
                                            onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            placeholder="amit@company.com"
                                            value={signupForm.email}
                                            onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={signupForm.password}
                                            onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 mt-4 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={signupForm.agree}
                                        onChange={(e) => setSignupForm({...signupForm, agree: e.target.checked})}
                                        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-xs text-slate-500 font-medium leading-relaxed">
                                        I agree to the <span className="text-blue-600 hover:underline">Terms of Service</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    className="w-full mt-2 py-3 bg-[#E53935] hover:bg-[#d32f2f] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    SIGN UP FOR FREE
                                    <ArrowRight size={16} />
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">Or Connect With</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => navigate("/signup")}
                                        className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2a6.3 6.3 0 110-12.6c1.666 0 3.2.553 4.417 1.63L21.54 4.5A9.9 9.9 0 0012.24 2C6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.262 0 10.24-4.4 10.24-10.24 0-.663-.075-1.282-.196-1.955H12.24z"/></svg>
                                        Google
                                    </button>
                                    <button 
                                        onClick={() => navigate("/signup")}
                                        className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 23 23"><path fill="#f25022" d="M0 0h11v11H0z"/><path fill="#7fba00" d="M12 0h11v11H12z"/><path fill="#00a4ef" d="M0 12h11v11H0z"/><path fill="#ffb900" d="M12 12h11v11H12z"/></svg>
                                        Microsoft
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* Interactive Demo Browser Tabs Section (The Highlight) */}
            <section id="demo" className="py-24 px-6 md:px-12 bg-white border-y border-slate-200/80">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
                            One Integrated Suite. Zero Complexity.
                        </h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            Click through our core modules below to see how Vektra runs your entire employee life cycle in real time.
                        </p>
                    </div>

                    {/* Tab Navigation Switches */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
                        {[
                            { id: "people", label: "Vektra People", desc: "Core HR & Directory", color: "#1E88E5", icon: Users },
                            { id: "attendance", label: "Vektra Attendance", desc: "Clock-In & Shifts", color: "#43A047", icon: Clock },
                            { id: "payroll", label: "Vektra Payroll", desc: "Compensation & Taxes", color: "#E53935", icon: Banknote },
                            { id: "analytics", label: "Vektra Analytics", desc: "BI & Performance Reports", color: "#FDD835", icon: BarChart3 },
                        ].map((tab) => {
                            const TabIcon = tab.icon
                            const isSelected = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 rounded-2xl flex items-center gap-3 border text-left transition-all ${
                                        isSelected 
                                            ? "bg-white border-slate-300 shadow-md shadow-slate-100 scale-102" 
                                            : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300"
                                    }`}
                                >
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: tab.color }}
                                    >
                                        <TabIcon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{tab.label}</h4>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{tab.desc}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Simulated Browser Dashboard Preview Window */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-4 md:p-6 shadow-2xl relative border-4 border-slate-800 overflow-hidden">
                        
                        {/* Browser Bar */}
                        <div className="flex items-center gap-6 pb-4 border-b border-slate-800 mb-6">
                            <div className="flex gap-2">
                                <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></span>
                                <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></span>
                                <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></span>
                            </div>
                            <div className="bg-slate-800 rounded-lg py-1 px-4 text-xs font-semibold text-slate-400 font-mono flex items-center gap-2 max-w-sm w-full">
                                <Lock size={12} className="text-[#27c93f]" />
                                secure.Vektra.io/portal/dashboard
                            </div>
                        </div>

                        {/* Interactive Dynamic Previews */}
                        <div className="min-h-[400px] text-white">
                            
                            {/* PEOPLE TAB MOCKUP */}
                            {activeTab === "people" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                                >
                                    <div className="lg:col-span-1 bg-slate-800/40 rounded-2xl p-4 border border-slate-800 space-y-4">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Departments</h5>
                                        <div className="space-y-1 text-sm font-semibold">
                                            {["All Staff", "Engineering", "People Ops", "Design", "QA", "Finance"].map((dept, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => setEmployeeSearch(dept === "All Staff" ? "" : dept)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                                        (employeeSearch === dept || (dept === "All Staff" && employeeSearch === ""))
                                                            ? "bg-blue-600 text-white" 
                                                            : "text-slate-300 hover:bg-slate-800"
                                                    }`}
                                                >
                                                    {dept}
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                        (employeeSearch === dept || (dept === "All Staff" && employeeSearch === ""))
                                                            ? "bg-blue-700 text-white" 
                                                            : "bg-slate-700 text-slate-400"
                                                    }`}>
                                                        {dept === "All Staff" ? employees.length : employees.filter(e => e.dept === dept).length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3 space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                                            <div className="relative w-full sm:max-w-xs">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search staff directory..." 
                                                    value={employeeSearch}
                                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                Showing {filteredEmployees.length} of {employees.length} Staff
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {filteredEmployees.map((emp) => (
                                                <div key={emp.id} className="bg-slate-800/30 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-900/40 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg border border-blue-800">
                                                        {emp.name.split(" ").map(n => n[0]).join("")}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-white truncate">{emp.name}</h4>
                                                        <p className="text-xs text-slate-400 font-medium truncate">{emp.role}</p>
                                                        <span className="inline-block mt-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-900/30">{emp.dept}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-900/20 self-start">
                                                        <span className={`w-2 h-2 rounded-full ${emp.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                                                        {emp.status}
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredEmployees.length === 0 && (
                                                <div className="col-span-2 text-center py-12 text-slate-500 font-semibold">
                                                    No employee records found matching "{employeeSearch}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ATTENDANCE TAB MOCKUP (Fully Interactive Demo) */}
                            {activeTab === "attendance" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1 text-center md:text-left">
                                            <h4 className="text-lg font-bold">Good Day, User</h4>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Timing: 09:00 AM - 06:00 PM</p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today Check-In</span>
                                                <span className="text-lg font-bold font-mono text-[#43A047]">{clockedIn ? clockTime : "--"}</span>
                                            </div>
                                            <button 
                                                onClick={toggleClockIn}
                                                className={`px-8 py-3 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                                                    clockedIn 
                                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/20" 
                                                        : "bg-[#43A047] hover:bg-[#388e3c] text-white shadow-emerald-950/20"
                                                }`}
                                            >
                                                <Clock size={16} />
                                                {clockedIn ? "CLOCK OUT" : "CLOCK IN NOW"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl overflow-hidden">
                                        <div className="p-4 border-b border-slate-800/80 bg-slate-800/40 flex justify-between items-center">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Recent Attendance Logs</h4>
                                            <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded">Avg On-Time Rate: 94.6%</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                                                        <th className="p-4">Day</th>
                                                        <th className="p-4">Status</th>
                                                        <th className="p-4">Check-In</th>
                                                        <th className="p-4">Check-Out</th>
                                                        <th className="p-4">Work Hours</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/60 font-semibold font-mono text-slate-300">
                                                    {attendances.map((att, i) => (
                                                        <tr key={i} className="hover:bg-slate-800/10">
                                                            <td className="p-4 text-slate-400 font-bold">{att.day}</td>
                                                            <td className="p-4">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    att.status === "On Time" 
                                                                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                                                                        : "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                                                                }`}>
                                                                    {att.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">{att.checkIn}</td>
                                                            <td className="p-4">{att.checkOut}</td>
                                                            <td className="p-4 text-white">{att.hours}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PAYROLL TAB MOCKUP */}
                            {activeTab === "payroll" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                                >
                                    <div className="lg:col-span-5 bg-slate-800/40 rounded-2xl p-6 border border-slate-800 space-y-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Billing Cycle</span>
                                            <h4 className="text-xl font-bold font-heading">August 2026</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disbursement Date</span>
                                                    <p className="text-sm font-bold mt-0.5">30-Aug-2026</p>
                                                </div>
                                                <span className="px-3 py-1 rounded bg-[#E53935]/10 text-[#ff5f56] text-[10px] font-bold uppercase tracking-wider border border-[#E53935]/20">Processing</span>
                                            </div>

                                            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Payroll Value</span>
                                                    <p className="text-sm font-bold font-mono mt-0.5">₹18,42,500.00</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-7 bg-slate-800/20 border border-slate-800/60 rounded-2xl p-6 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Earnings & Deductions Breakdown</h4>
                                            <span className="text-xs text-slate-400 font-semibold font-mono">14 Active Staff Payouts</span>
                                        </div>

                                        <div className="space-y-4 font-semibold text-xs text-slate-300">
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Basic Salary (60%)</span>
                                                    <span className="font-mono text-white">₹11,05,500</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "60%" }}></div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>House Rent Allowance (20%)</span>
                                                    <span className="font-mono text-white">₹3,68,500</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "20%" }}></div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Special Allowance (15%)</span>
                                                    <span className="font-mono text-white">₹2,76,375</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "15%" }}></div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-rose-400">
                                                    <span>Deductions & Taxes (5%)</span>
                                                    <span className="font-mono">₹92,125</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: "5%" }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ANALYTICS TAB MOCKUP */}
                            {activeTab === "analytics" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        {[
                                            { title: "Staff Attrition", value: "3.2%", label: "vs 4.8% average", trend: "down" },
                                            { title: "Avg Performance", value: "91.8%", label: "+2.4% vs last Q", trend: "up" },
                                            { title: "Absence Rate", value: "1.4%", label: "-0.6% this month", trend: "down" },
                                            { title: "Onboarding Score", value: "96.4%", label: "+1.2% year-on-year", trend: "up" },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.title}</span>
                                                <h4 className="text-xl font-bold font-mono mt-1 text-white">{stat.value}</h4>
                                                <span className={`text-[10px] font-semibold block mt-1 ${stat.trend === "up" ? "text-emerald-400" : "text-blue-400"}`}>
                                                    {stat.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Department Performance Trend</h4>
                                            <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded">Analytics Target Met</span>
                                        </div>

                                        {/* Mock SVG Graph */}
                                        <div className="h-44 w-full relative flex items-end gap-1">
                                            {[45, 62, 50, 75, 90, 85, 95, 88, 92, 100].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                                                        <motion.div 
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h}%` }}
                                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                                            className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-indigo-500 group-hover:to-violet-500 transition-all rounded-t-lg"
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-500 font-mono">Q{i+1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </div>

                    </div>

                </div>
            </section>

            {/* Modular Features Grid Section (Clean & Colorful, Zoho Style) */}
            <section id="features" className="py-24 px-6 md:px-12 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
                            Built for complete organizational control.
                        </h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            A single platform designed to replace fragmented spreadsheets and tools. Full scale features out of the box.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { 
                                title: "Smart Attendance", 
                                desc: "Real-time presence tracking, shifts scheduler, and face-recognition check-in verification.", 
                                icon: Clock, 
                                bg: "bg-emerald-50 border-emerald-100", 
                                text: "text-emerald-600",
                                shadow: "hover:shadow-emerald-500/5 hover:border-emerald-300"
                            },
                            { 
                                title: "Automated Payroll", 
                                desc: "Dynamic salary structures, direct payout exports, tax compliance, and automated payslip delivery.", 
                                icon: Banknote, 
                                bg: "bg-rose-50 border-rose-100", 
                                text: "text-rose-600",
                                shadow: "hover:shadow-rose-500/5 hover:border-rose-300"
                            },
                            { 
                                title: "Employee Directory", 
                                desc: "Centralized database of staff records, role structures, reporting hierarchies, and documents.", 
                                icon: Users, 
                                bg: "bg-blue-50 border-blue-100", 
                                text: "text-blue-600",
                                shadow: "hover:shadow-blue-500/5 hover:border-blue-300"
                            },
                            { 
                                title: "Analytics & BI Reports", 
                                desc: "Rich graphical dashboard analysis, attrition reviews, departmental stats, and custom export tables.", 
                                icon: BarChart3, 
                                bg: "bg-amber-50 border-amber-100", 
                                text: "text-amber-600",
                                shadow: "hover:shadow-amber-500/5 hover:border-amber-300"
                            },
                            { 
                                title: "Role-Based Security", 
                                desc: "Fine-grained permission nodes separating Admin, HR, Manager, and Staff views dynamically.", 
                                icon: Shield, 
                                bg: "bg-violet-50 border-violet-100", 
                                text: "text-violet-600",
                                shadow: "hover:shadow-violet-500/5 hover:border-violet-300"
                            },
                            { 
                                title: "Kiosk Clock-In", 
                                desc: "Dedicated on-premise attendance kiosk terminals supporting verified QR codes and face match inputs.", 
                                icon: Activity, 
                                bg: "bg-cyan-50 border-cyan-100", 
                                text: "text-cyan-600",
                                shadow: "hover:shadow-cyan-500/5 hover:border-cyan-300"
                            },
                            { 
                                title: "Self Service Portals", 
                                desc: "Mobile-friendly check-in dashboards, profile updates, and payslip downloads for staff.", 
                                icon: Globe, 
                                bg: "bg-teal-50 border-teal-100", 
                                text: "text-teal-600",
                                shadow: "hover:shadow-teal-500/5 hover:border-teal-300"
                            },
                            { 
                                title: "Audit Log Control", 
                                desc: "Complete cryptographic audit logs documenting every admin record change and approval action.", 
                                icon: Lock, 
                                bg: "bg-slate-100 border-slate-200", 
                                text: "text-slate-700",
                                shadow: "hover:shadow-slate-500/5 hover:border-slate-400"
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`bg-white border border-slate-200 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feature.shadow}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${feature.bg} border flex items-center justify-center mb-6 text-xl`}>
                                    <feature.icon className={feature.text} size={22} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">{feature.title}</h3>
                                <p className="text-slate-500 text-xs font-semibold leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* Privacy Guarantee & Compliance Section (Inspired by Zoho's No Ads pledge) */}
            <section id="security" className="py-24 px-6 md:px-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Lock size={12} />
                            Zero Compromises On Privacy
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                            Your Employees. Your Data. <br />
                            <span className="text-blue-400">Strictly Encrypted.</span>
                        </h2>

                        <p className="text-slate-400 text-sm md:text-base leading-relaxed font-semibold">
                            At Vektra, we believe privacy is a fundamental human right. Inspired by Zoho's absolute commitment to security, we pledge:
                        </p>

                        <div className="space-y-4 pt-2">
                            {[
                                "We never display advertisements. Ever.",
                                "We never monetize or sell your organization’s employee records or analytics.",
                                "All salaries and tax documents are stored using zero-knowledge TLS 1.3 encryption.",
                                "Full compliance with GDPR standards and data export rights at any moment."
                            ].map((pledge, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-300 font-semibold text-sm">
                                    <div className="bg-blue-500/20 text-blue-400 p-1 rounded-full flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                    {pledge}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm font-heading tracking-wide">Enterprise Compliance</h4>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest font-mono">Active</span>
                        </div>

                        <div className="space-y-4 text-xs font-semibold">
                            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                <span className="text-slate-400">TLS Encryption</span>
                                <span className="text-emerald-400 font-mono">1.3 Enabled</span>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                <span className="text-slate-400">SOC2 Readiness</span>
                                <span className="text-emerald-400 font-mono">Audit Complete</span>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                <span className="text-slate-400">Database Hosting</span>
                                <span className="text-white">Isolated Private VPC</span>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <Link 
                                to="/signup" 
                                className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors uppercase tracking-widest"
                            >
                                Read Security Whitepaper
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                </div>
            </section>

            {/* Simple Pricing CTA Section */}
            <section id="pricing" className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-heading text-slate-900">
                        Start simplifying your workforce today.
                    </h2>
                    
                    <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Join thousands of companies using Vektra to orchestrate core HR operations. Free 14-day trial. No credit card required.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link 
                            to="/signup"
                            className="px-10 py-5 bg-[#E53935] hover:bg-[#d32f2f] text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center"
                        >
                            GET STARTED FOR FREE
                            <ArrowRight size={18} />
                        </Link>
                        <a 
                            href="#demo"
                            className="px-10 py-5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-lg rounded-2xl transition-all w-full sm:w-auto text-center"
                        >
                            Explore Interactive Demo
                        </a>
                    </div>

                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        No setup costs. No hidden fees. Cancel at any time.
                    </p>
                </div>
            </section>

            {/* Structured Sitemap Corporate Footer (Zoho style) */}
            <footer className="bg-slate-50 border-t border-slate-200/80 pt-20 pb-10 px-6">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
                        
                        {/* Footer Brand Info */}
                        <div className="col-span-2 space-y-6">
                            <Link to="/" className="inline-block group">
                                <img 
                                    src="/Vektra.png" 
                                    alt="Vektra" 
                                    className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                            </Link>

                            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
                                Vektra provides enterprise-grade human resource management systems, automated attendance verification modules, dynamic payroll integrations, and reports analytics.
                            </p>

                            <div className="flex gap-4">
                                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                </a>
                            </div>
                        </div>

                        {/* Sitemap Columns */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-heading">Core Modules</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                                <a href="#demo" className="hover:text-blue-600 transition-colors">Vektra People</a>
                                <a href="#demo" className="hover:text-blue-600 transition-colors">Vektra Attendance</a>
                                <a href="#demo" className="hover:text-blue-600 transition-colors">Vektra Payroll</a>
                                <a href="#demo" className="hover:text-blue-600 transition-colors">Vektra Analytics</a>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-heading">Portals</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                                <Link to="/login" className="hover:text-blue-600 transition-colors">Employee Logins</Link>
                                <Link to="/login" className="hover:text-blue-600 transition-colors">HR Manager Portal</Link>
                                <Link to="/login" className="hover:text-blue-600 transition-colors">Administrator Console</Link>
                                <Link to="/super-login" className="hover:text-amber-600 transition-colors text-amber-600/80">Super Admin Portal</Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-heading">Security</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                                <a href="#security" className="hover:text-blue-600 transition-colors">Privacy Guarantee</a>
                                <a href="#security" className="hover:text-blue-600 transition-colors">Data Encryption</a>
                                <a href="#security" className="hover:text-blue-600 transition-colors">GDPR & SOC2 Compliance</a>
                                <a href="#security" className="hover:text-blue-600 transition-colors">Audit Trails</a>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-heading">Company</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                                <a href="#" className="hover:text-blue-600 transition-colors">About Us</a>
                                <a href="#" className="hover:text-blue-600 transition-colors">Customers</a>
                                <a href="#" className="hover:text-blue-600 transition-colors">Support Desk</a>
                                <a href="#" className="hover:text-blue-600 transition-colors">Contact Sales</a>
                            </div>
                        </div>

                    </div>

                    <hr className="border-slate-200" />

                    <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
                        <p>© {new Date().getFullYear()} Vektra Engineering. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-slate-600 transition-colors">Cookie Preferences</a>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    )
}
