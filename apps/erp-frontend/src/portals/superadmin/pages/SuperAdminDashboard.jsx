import { useState, useEffect } from "react"
import api from "../../../api/axios"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { 
    LayoutDashboard, 
    Building2, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    ShieldAlert, 
    ShieldCheck,
    ChevronRight,
    Users,
    Activity,
    Search,
    Filter
} from "lucide-react"
import CopilotDrawer from "../../../components/copilot/CopilotDrawer"

export default function SuperAdminDashboard() {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [activeTab, setActiveTab] = useState('active') // Default to 'active'
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCompany, setSelectedCompany] = useState(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [healthData, setHealthData] = useState(null)
    const [announcements, setAnnouncements] = useState([])
    const [newAnnouncement, setNewAnnouncement] = useState({ message: '', priority: 'Info' })

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            const [compRes, healthRes, annRes] = await Promise.all([
                api.get("/superadmin/companies"),
                api.get("/superadmin/health-stats"),
                api.get("/superadmin/announcements")
            ])
            setCompanies(compRes.data.data)
            setHealthData(healthRes.data.data)
            setAnnouncements(annRes.data.data)
        } catch (error) {
            console.error("Data fetch failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.message) return;
        
        setActionLoading('broadcast')
        try {
            await api.post("/superadmin/announcements", newAnnouncement)
            setNewAnnouncement({ message: '', priority: 'Info' })
            await fetchAllData()
        } catch (err) {
            console.error("Broadcast failed", err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteAnnouncement = async (id) => {
        try {
            await api.delete(`/superadmin/announcements/${id}`)
            await fetchAllData()
        } catch (err) {
            console.error("Delete failed", err)
        }
    }

    const fetchSystemHealth = async () => {
        try {
            const res = await api.get("/superadmin/health-stats")
            setHealthData(res.data.data)
        } catch (err) {
            console.error("Health fetch failed:", err)
        }
    }

    // Refresh health every 30s if on that tab
    useEffect(() => {
        let interval;
        if (activeTab === 'health') {
            interval = setInterval(fetchSystemHealth, 30000)
        }
        return () => clearInterval(interval)
    }, [activeTab])

    const fetchCompanyDetails = async (id) => {
        setDetailsLoading(true)
        try {
            const response = await api.get(`/superadmin/company-details/${id}`)
            setSelectedCompany(response.data)
        } catch (error) {
            console.error("Failed to load details:", error)
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'
        
        setActionLoading(id)
        try {
            await api.patch(`/superadmin/company-status/${id}`, { status: newStatus })
            await fetchAllData()
            if (selectedCompany && selectedCompany.company._id === id) {
                fetchCompanyDetails(id)
            }
        } catch (error) {
            console.error("Status update failed", error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleExportData = async (company) => {
        try {
            const res = await api.get(`/superadmin/export/${company._id}`)
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2))
            const downloadAnchorNode = document.createElement('a')
            downloadAnchorNode.setAttribute("href", dataStr)
            downloadAnchorNode.setAttribute("download", `Vektra_Trace_${company.name.replace(/\s+/g, '_')}.json`)
            document.body.appendChild(downloadAnchorNode)
            downloadAnchorNode.click()
            downloadAnchorNode.remove()
        } catch (err) {
            console.error("Export failed", err)
        }
    }

const handlePurgeData = async (id) => {
        // We keep purge alert because it is DESTRUCTIVE and IRREVERSIBLE
        if (!confirm("CRITICAL: Permanent Purge will IRREVERSIBLY DELETE all records for this organization. System recovery is NOT possible. Proceed?")) return

        setActionLoading(id)
        try {
            await api.delete(`/superadmin/purge/${id}`)
            setSelectedCompany(null)
            await fetchAllData()
        } catch (err) {
            console.error("Purge failed", err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleApproveCompany = async (id) => {
        setActionLoading(id)
        try {
            await api.post(`/superadmin/company/${id}/approve`)
            await fetchAllData()
        } catch (err) {
            console.error("Approval failed", err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleRejectCompany = async (id) => {
        if (!confirm("Are you sure you want to reject this organization? This will set their status to Inactive.")) return
        setActionLoading(id)
        try {
            await api.post(`/superadmin/company/${id}/reject`)
            await fetchAllData()
        } catch (err) {
            console.error("Rejection failed", err)
        } finally {
            setActionLoading(null)
        }
    }

const filteredData = companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const stats = {
        total: companies.length,
        active: companies.filter(c => c.status === 'Active').length,
        suspended: companies.filter(c => c.status === 'Suspended').length,
        pending: companies.filter(c => c.status === 'Pending').length
    }

    if (loading) return <Loader fullScreen={true} />

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 selection:bg-emerald-500/10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.01] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/[0.01] rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 p-8 md:p-12 max-w-[1600px] mx-auto">
                {/* Header */}
                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <img src="/Vektra.png" alt="Vektra" className="h-10 md:h-12 w-auto object-contain" />
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Super Admin Control</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-3">
                            Vektra Portal
                        </h1>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 shadow-sm">
                            <Activity size={16} />
                            SYSTEM OPERATIONAL
                        </div>
                    </motion.div>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {[
                        { label: 'Total Companies', value: stats.total, icon: Building2, color: 'blue' },
                        { label: 'Active Workspaces', value: stats.active, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Suspended Orgs', value: stats.suspended, icon: ShieldAlert, color: 'rose' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group"
                        >
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100 w-fit mb-6`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-4xl font-extrabold text-slate-800 mt-1">{stat.value}</h3>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                            <button 
                                onClick={() => setActiveTab('active')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Active Organizations
                            </button>
                            <button 
                                onClick={() => setActiveTab('health')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'health' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                System Health
                            </button>
                            <button 
                                onClick={() => setActiveTab('broadcast')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'broadcast' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Broadcast
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search organizations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-400 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Display */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid gap-6"
                            >
                                {activeTab === 'health' ? (
                                    <div className="max-w-4xl mx-auto space-y-6 w-full">
                                        {/* Real-time Metrics */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl">
                                                            <Activity size={24} />
                                                        </div>
                                                        <span className="text-emerald-600 text-xs font-black uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Live</span>
                                                    </div>
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Process Memory</p>
                                                    <h3 className="text-4xl font-extrabold text-slate-800">{healthData?.memoryUsage}</h3>
                                                    <div className="mt-6 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl">
                                                            <Clock size={24} />
                                                        </div>
                                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Stable</span>
                                                    </div>
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Server Uptime</p>
                                                    <h3 className="text-4xl font-extrabold text-slate-800">{healthData?.uptime}</h3>
                                                    <p className="text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">Since last deployment</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl shadow-sm">
                                                <h5 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-8">Node Infrastructure</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Heap Total</p>
                                                        <p className="text-xl font-bold text-slate-800">{healthData?.heapTotal}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Heap Used</p>
                                                        <p className="text-xl font-bold text-slate-800">{healthData?.heapUsed}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">DB Connections</p>
                                                        <p className="text-xl font-bold text-emerald-600">{healthData?.dbStatus}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'broadcast' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        {/* Broadcast Form */}
                                        <div className="bg-slate-50 border border-slate-200/60 p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm">
                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-bold text-slate-800 mb-8">System-Wide Broadcast</h3>
                                                <form onSubmit={handleBroadcast} className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Announcement Message</label>
                                                        <textarea 
                                                            rows="4"
                                                            required
                                                            placeholder="Enter system announcement..."
                                                            value={newAnnouncement.message}
                                                            onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-sm placeholder-slate-400 dark:placeholder-slate-400 font-medium"
                                                        ></textarea>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Priority Level</label>
                                                        <div className="flex gap-4">
                                                            {['Info', 'Warning', 'Urgent'].map((level) => (
                                                                <button 
                                                                    key={level}
                                                                    type="button"
                                                                    onClick={() => setNewAnnouncement({...newAnnouncement, priority: level})}
                                                                    className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all shadow-sm ${
                                                                        newAnnouncement.priority === level 
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <button 
                                                        type="submit"
                                                        disabled={actionLoading === 'broadcast'}
                                                        className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                                    >
                                                        {actionLoading === 'broadcast' ? 'Broadcasting...' : 'Publish Announcement'}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Broadcast History */}
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 ml-2">Recent Broadcasts</h4>
                                            {announcements.length === 0 ? (
                                                <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                                                    <p className="text-slate-500 font-medium">No past announcements.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {announcements.map((ann) => (
                                                        <div key={ann._id} className={`p-6 rounded-3xl border transition-all ${
                                                            ann.isActive 
                                                            ? 'bg-emerald-50 border-emerald-100 shadow-sm' 
                                                            : 'bg-slate-50 border-slate-200 opacity-60'
                                                        }`}>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                                                    ann.priority === 'Urgent' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                                    ann.priority === 'Warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                                                }`}>
                                                                    {ann.priority}
                                                                </span>
                                                                <button onClick={() => handleDeleteAnnouncement(ann._id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                            <p className="text-sm font-semibold text-slate-700 mb-4">{ann.message}</p>
                                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                <span>{new Date(ann.createdAt).toLocaleString()}</span>
                                                                {ann.isActive && <span className="text-emerald-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Active Now</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : filteredData.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                                        <p className="text-slate-500 font-medium">No results found in {activeTab} section.</p>
                                    </div>
                                ) : (
                                    filteredData.map((item, idx) => (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => activeTab === 'active' && fetchCompanyDetails(item._id)}
                                            className={`group bg-slate-50 border border-slate-200/60 p-6 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-8 hover:bg-slate-100/80 hover:border-slate-200 transition-all ${activeTab === 'active' ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex items-center gap-6 w-full lg:w-1/3">
                                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-slate-200 flex items-center justify-center text-emerald-600 text-2xl font-black font-heading shadow-sm">
                                                    {(item.companyName || item.name).charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-slate-800 leading-tight">{item.companyName || item.name}</h4>
                                                    <p className="text-slate-500 text-sm font-medium mt-1">Admin: {item.name || item.adminName}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-center gap-8 w-full lg:w-2/3 justify-end">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Status</p>
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                                            (item.status === 'Pending' || item.status === 'Suspended') ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                                            item.status === 'Approved' || item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                            'bg-slate-50 text-slate-500 border-slate-200'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Joined</p>
                                                        <span className="text-sm font-bold text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(item._id, item.status) }}
                                                        disabled={actionLoading === item._id}
                                                        className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 border shadow-sm ${
                                                            item.status === 'Active' 
                                                            ? 'bg-rose-50 text-rose-600 border-rose-150 hover:bg-rose-100' 
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {actionLoading === item._id ? '...' : (item.status === 'Active' ? 'Suspend' : 'Activate')}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Company Detail Modal */}
            <AnimatePresence>
                {selectedCompany && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCompany(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-12">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-black font-heading shadow-md">
                                            {selectedCompany.company.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-extrabold text-slate-800 leading-tight font-heading">{selectedCompany.company.name}</h2>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-slate-500 font-medium">{selectedCompany.company.email}</span>
                                                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCompany.company.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {selectedCompany.company.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCompany(null)}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                                    {[
                                        { label: 'Employees', value: selectedCompany.stats.employeeCount, icon: Users, color: 'blue' },
                                        { label: 'Attendance', value: selectedCompany.stats.attendanceCount, icon: Clock, color: 'emerald' },
                                        { label: 'Payrolls', value: selectedCompany.stats.payrollCount, icon: Building2, color: 'indigo' },
                                        { label: 'Reports', value: selectedCompany.stats.reportCount, icon: Activity, color: 'purple' }
                                    ].map((s) => (
                                        <div key={s.label} className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-center shadow-sm">
                                            <div className={`mx-auto p-3 rounded-2xl bg-${s.color}-50 text-${s.color}-600 border border-${s.color}-100 w-fit mb-4`}>
                                                <s.icon size={20} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
                                            <h4 className="text-2xl font-black text-slate-800">{s.value}</h4>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Governance & Sovereignty</h5>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button 
                                            onClick={() => handleToggleStatus(selectedCompany.company._id, selectedCompany.company.status)}
                                            className={`flex-1 py-4.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                                                selectedCompany.company.status === 'Active' 
                                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                            }`}
                                        >
                                            {selectedCompany.company.status === 'Active' ? 'Suspend Organization' : 'Activate Organization'}
                                        </button>
                                        <button 
                                            onClick={() => handleExportData(selectedCompany.company)}
                                            className="flex-1 py-4.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                        >
                                            <Activity size={16} /> Export Data Trace
                                        </button>
                                        <button 
                                            onClick={() => handlePurgeData(selectedCompany.company._id)}
                                            disabled={actionLoading === selectedCompany.company._id}
                                            className="flex-1 py-4.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-2xl font-black text-sm border border-rose-100 hover:border-rose-600 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                                        >
                                            {actionLoading === selectedCompany.company._id ? 'Purging...' : 'Permanent Purge'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Vektra AI Co-Pilot Floating Drawer */}
            <CopilotDrawer />
        </div>
    )
}
