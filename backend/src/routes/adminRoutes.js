import express from "express";
import { registerAdmin, getWorkLocation, updateWorkLocation } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.get("/work-location", protect, getWorkLocation);
router.put("/work-location", protect, updateWorkLocation);

export default router;
