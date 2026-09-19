import Company from "../models/Company.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";

// List all active companies
export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find().select('name email adminName status createdAt').sort({ createdAt: -1 });
        res.json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching companies", error: error.message });
    }
};

// Update company status (Suspend/Activate)
export const updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const company = await Company.findByIdAndUpdate(id, { status }, { new: true });
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        res.json({ success: true, message: `Company status updated to ${status}`, data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: "Update failed", error: error.message });
    }
};

// Get company details (stats)
export const getCompanyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        const stats = {
            employeeCount: company.employees.length,
            attendanceCount: company.attendance.length,
            payrollCount: company.payrolls.length,
            reportCount: company.reports.length
        };

        res.json({ success: true, company, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Search failed", error: error.message });
    }
};

// Approve a company (change status from Pending to Active)
export const approveCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        
        if (company.status !== "Pending") {
            return res.status(400).json({ success: false, message: "Company is not in Pending status" });
        }
        
        company.status = "Active";
        await company.save();
        
        res.json({ success: true, message: "Company approved and activated", data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: "Approval failed", error: error.message });
    }
};

// Reject a company (set status to Inactive/Suspended)
export const rejectCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        
        if (company.status !== "Pending") {
            return res.status(400).json({ success: false, message: "Company is not in Pending status" });
        }
        
        company.status = "Inactive";
        await company.save();
        
        res.json({ success: true, message: "Company rejected and set to Inactive", data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: "Rejection failed", error: error.message });
    }
};

// Global system health monitoring
export const getSystemHealth = async (req, res) => {
    try {
        const memory = process.memoryUsage();
        const uptime = process.uptime();
        
        // Basic metrics
        const health = {
            status: 'Operational',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            memoryUsage: `${Math.round(memory.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
            dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
        };

        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, message: "Health check failed", error: error.message });
    }
};

// Create a new announcement
export const createAnnouncement = async (req, res) => {
    try {
        const { message, priority, expiresAt } = req.body;
        
        // No longer deactivating previous announcements automatically 
        // as the user wants a full log of live messages.

        const announcement = new Announcement({
            message,
            priority,
            expiresAt,
            isActive: true
        });

        await announcement.save();
        res.json({ success: true, message: "Announcement broadcasted successfully", data: announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: "Broadcast failed", error: error.message });
    }
};

// Get all announcements
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed", error: error.message });
    }
};

// Get all active announcements (For user notification bars)
export const getActiveAnnouncements = async (req, res) => {
    try {
        const currentActive = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: currentActive });
    } catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed", error: error.message });
    }
};

// Delete/Clear current announcement
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.findByIdAndDelete(id);
        res.json({ success: true, message: "Announcement removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Deletion failed", error: error.message });
    }
};
// Export full company data trace
export const exportCompanyData = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        
        if (!company) return res.status(404).json({ success: false, message: "Company not found" });

        // Compile deep trace
        const trace = {
            organization: {
                name: company.name,
                email: company.email,
                joinedAt: company.createdAt
            },
            employees: company.employees,
            attendance: company.attendance,
            payroll: company.payrolls,
            reports: company.reports,
            metadata: {
                exportedAt: new Date(),
                scope: 'Full Sovereignty Trace'
            }
        };

        res.json({ success: true, data: trace });
    } catch (error) {
        res.status(500).json({ success: false, message: "Export failed", error: error.message });
    }
};

// Permanent Purge of organization data
export const purgeCompanyData = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find and delete
        const company = await Company.findByIdAndDelete(id);
        
        if (!company) return res.status(404).json({ success: false, message: "Company not found" });

        res.json({ success: true, message: "Organization and all associated records permanently purged." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Purge failed", error: error.message });
    }
};
