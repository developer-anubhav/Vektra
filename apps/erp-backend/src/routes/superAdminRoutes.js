import express from "express";
import { 
    getCompanies,
    updateCompanyStatus,
    getCompanyDetails,
    getSystemHealth,
    createAnnouncement,
    getAnnouncements,
    getActiveAnnouncements,
    deleteAnnouncement,
    exportCompanyData,
    purgeCompanyData,
    approveCompany,
    rejectCompany
} from "../controllers/superAdminController.js";

const router = express.Router();

router.get("/companies", getCompanies);
router.post("/company/:id/approve", approveCompany);
router.post("/company/:id/reject", rejectCompany);
router.patch("/company-status/:id", updateCompanyStatus);
router.get("/company-details/:id", getCompanyDetails);
router.get("/health-stats", getSystemHealth);

// Data Sovereignty
router.get("/export/:id", exportCompanyData);
router.delete("/purge/:id", purgeCompanyData);

// Announcements
router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);
router.get("/announcements/active", getActiveAnnouncements);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
