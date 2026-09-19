import express from "express"
import { loginUser, organizationSignup, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/login", loginUser)
router.post("/organization-signup", organizationSignup)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/change-password", protect, changePassword)

export default router
