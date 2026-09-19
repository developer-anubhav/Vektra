import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Loader } from "../../../components/ui/Loader"
import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

export default function OrganizationPending() {
    const location = useLocation()
    const [status, setStatus] = useState("")

    useEffect(() => {
        // Check if there's a status query parameter
        const urlParams = new URLSearchParams(location.search)
        const statusFromQuery = urlParams.get("status")
        if (statusFromQuery) {
            setStatus(statusFromQuery)
        }
    }, [location])

    if (status === "approved") {
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
                    <h2 className="text-3xl font-heading font-bold text-slate-800 mb-4">Approved!</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        Your organization has been approved by the super admin. 
                        You can now access your workspace.
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-emerald-600"
                        />
                    </div>
                    <p className="text-slate-500 text-sm mt-4">
                        Redirecting you to the login page...
                    </p>
                </motion.div>
            </div>
        )
    }

    if (status === "rejected") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-700">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-lg text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertCircle size={48} />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-slate-800 mb-4">Rejected</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        Your organization's registration was rejected by the super admin.
                    </p>
                    <p className="text-slate-500 text-sm mb-4">
                        Please contact the super admin for more information or to reapply.
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-rose-500"
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    // Default state - show waiting message
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-700">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-lg text-center max-w-md w-full"
            >
                <div className="w-20 h-20 bg-amber-50 border border-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Clock size={48} />
                </div>
                <h2 className="text-3xl font-heading font-bold text-slate-800 mb-4">Waiting for Approval</h2>
                <p className="text-slate-500 font-medium mb-8">
                    Your organization is awaiting super admin approval. 
                    Once approved, you will be able to access your workspace.
                </p>
                <p className="text-slate-500 text-sm font-medium">
                    This process typically takes up to 4 – 5 hours for complete workspace setup and authorization.
                </p>
            </motion.div>
        </div>
    )
}