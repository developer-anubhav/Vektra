import { useState } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import CopilotDrawer from "../components/copilot/CopilotDrawer"

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/30">
      {/* Ambient background glows */}
      <div className="ambient-glow top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full animate-pulse-slow"></div>
      <div className="ambient-glow bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full animate-slow-drift"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.15] pointer-events-none"></div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 md:p-8 flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Vektra AI Co-Pilot Floating Drawer */}
      <CopilotDrawer />
    </div>
  )
}


