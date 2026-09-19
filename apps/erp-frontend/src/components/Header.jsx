import { useState, useRef, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { 
  Menu, Search, Bell, LogOut, User as UserIcon, 
  Settings, ChevronDown, Shield, Mail, Calendar, 
  DollarSign, Loader2, X 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { globalSearch } from "../api/searchApi"
import api from "../api/axios"

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const menuRef = useRef(null)

  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ employees: [], attendance: [], payroll: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem('dismissed_broadcasts')
    return saved ? JSON.parse(saved) : []
  })
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    fetchActiveAnnouncements()
    const interval = setInterval(fetchActiveAnnouncements, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await api.get("/superadmin/announcements/active")
      setAnnouncements(res.data.data)
    } catch (err) {
      console.error("Failed to fetch announcements:", err)
    }
  }

  const handleClearNotifications = () => {
    const allIds = announcements.map(a => a._id)
    const newDismissed = [...new Set([...dismissedIds, ...allIds])]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissed_broadcasts', JSON.stringify(newDismissed))
    setIsNotificationsOpen(false)
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a._id))

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ employees: [], attendance: [], payroll: [] })
      setShowSearchResults(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      setShowSearchResults(true)
      try {
        const res = await globalSearch(searchQuery)
        setSearchResults(res.data)
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleResultClick = (type, item) => {
    setShowSearchResults(false)
    setSearchQuery("")
    
    // Extract employee name for filtering the target page
    const nameQuery = item.name || item.employeeName || ""
    const queryParam = nameQuery ? `?search=${encodeURIComponent(nameQuery)}` : ""
    
    switch(type) {
      case 'employee':
        navigate(`/employees${queryParam}`)
        break
      case 'attendance':
        navigate(`/attendance${queryParam}`)
        break
      case 'payroll':
        navigate(`/payroll${queryParam}`)
        break
      default:
        break
    }
  }

  const hasResults = searchResults.employees.length > 0 || 
                     searchResults.attendance.length > 0 || 
                     searchResults.payroll.length > 0

  return (
    <header className="relative h-20 flex-shrink-0 bg-white border-b border-slate-200 text-slate-700 flex items-center justify-between px-6 md:px-10 w-full z-50">
      <div className="flex items-center gap-6 flex-1">
        {toggleSidebar && (
          <button onClick={toggleSidebar} className="md:hidden text-slate-500 hover:text-slate-800 transition-colors focus:outline-none">
            <Menu size={24} />
          </button>
        )}
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
          <div className={`flex items-center gap-3 px-4 py-2.5 bg-slate-50 border rounded-xl w-full group transition-all duration-300 ${showSearchResults ? "border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.05)] mb-0" : "border-slate-200"}`}>
            <Search size={18} className={`${searchQuery ? "text-primary" : "text-slate-400"} transition-colors`} />
            <input 
              type="text" 
              placeholder="Search people, records, months..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={14} />
              </button>
            )}
            {isSearching && (
              <Loader2 size={16} className="text-primary animate-spin" />
            )}
          </div>
 
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto"
              >
                {!isSearching && !hasResults ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No matches found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Employees Section */}
                    {searchResults.employees.length > 0 && (
                      <div className="px-2 pb-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <UserIcon size={12} className="text-primary" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employees</span>
                        </div>
                        {searchResults.employees.map((emp) => (
                          <button
                            key={emp._id}
                            onClick={() => handleResultClick('employee', emp)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <UserIcon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{emp.department} • {emp.employeeId}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
 
                    {/* Attendance Section */}
                    {searchResults.attendance.length > 0 && (
                      <div className="px-2 pb-2 border-t border-slate-100 pt-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <Calendar size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Records</span>
                        </div>
                        {searchResults.attendance.map((att) => (
                          <button
                            key={att._id}
                            onClick={() => handleResultClick('attendance', att)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                              <Calendar size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{att.employeeName}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${att.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{att.status}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{new Date(att.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
 
                    {/* Payroll Section */}
                    {searchResults.payroll.length > 0 && (
                      <div className="px-2 pb-2 border-t border-slate-100 pt-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <DollarSign size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payroll Documents</span>
                        </div>
                        {searchResults.payroll.map((pay) => (
                          <button
                            key={pay._id}
                            onClick={() => handleResultClick('payroll', pay)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-[10px]">
                              $
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{pay.employeeName}</p>
                              <p className="text-[11px] text-slate-400">{pay.month} • Net: ₹{pay.netSalary?.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-6">
          {/* Notification Bell with Broadcasts */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2.5 rounded-xl transition-all ${isNotificationsOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Bell size={20} />
              {visibleAnnouncements.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-[8px] font-black text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] border-2 border-white">
                  {visibleAnnouncements.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-[22rem] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-55/50">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800">Notifications</span>
                    {visibleAnnouncements.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black">{visibleAnnouncements.length} NEW</span>}
                  </div>

                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {visibleAnnouncements.length > 0 ? (
                      visibleAnnouncements.map((ann) => (
                        <div key={ann._id} className={`p-4 rounded-2xl border transition-all ${
                          ann.priority === 'Urgent' ? 'bg-rose-50 border-rose-100' :
                          ann.priority === 'Warning' ? 'bg-amber-50 border-amber-100' :
                          'bg-blue-50 border-blue-100'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${
                              ann.priority === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                              ann.priority === 'Warning' ? 'bg-amber-100 text-amber-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Shield size={14} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              ann.priority === 'Urgent' ? 'text-rose-600' :
                              ann.priority === 'Warning' ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>SYSTEM {ann.priority}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-3">
                            {ann.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                             {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nothing New Here</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={handleClearNotifications}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      Clear all Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

          <div className="relative" ref={menuRef}>
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all border border-transparent hover:border-slate-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name || "User"}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{user.role}</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-blue-600/10 border border-slate-200 flex items-center justify-center text-primary group-hover:border-primary/50 transition-all shadow-inner">
                  <UserIcon size={20} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`} />
            </div>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50"
                >
                  {/* Dropdown Header */}
                  <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <UserIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-bold truncate">{user.name || "Administrator"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Online</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-slate-600 group/item">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/50 text-slate-500 flex items-center justify-center group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                          <Mail size={14} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 truncate">{user.email || "admin@Vektra.com"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 group/item">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/50 text-slate-500 flex items-center justify-center group-hover/item:bg-blue-500/10 group-hover/item:text-blue-500 transition-colors">
                          <Shield size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="p-3">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all group">
                      <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
                      <span className="text-sm font-semibold">Account Settings</span>
                    </button>
                    
                    <div className="h-[1px] bg-slate-100 my-2 mx-2"></div>
                    
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-all group"
                    >
                      <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                      <span className="text-sm font-bold">Sign Out</span>
                    </button>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="bg-slate-50 p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Vektra Pro v1.0</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </header>
  )
}


