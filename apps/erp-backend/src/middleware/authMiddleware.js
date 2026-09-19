import jwt from "jsonwebtoken"
import Company from "../models/Company.js"

export const protect = async (req, res, next) => {

  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    console.warn(`[Auth] Rejected: No token provided for ${req.method} ${req.url}`);
    return res.status(401).json({ message: "No Token" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    
    // Check if company is active
    if (req.user.role === "ADMIN" && req.user.companyId) {
      const company = await Company.findById(req.user.companyId)
      if (!company) {
        return res.status(403).json({ message: "Company not found" })
      }
      if (company.status !== "Active") {
        return res.status(403).json({ message: "Your organization is pending approval. Please wait for super admin approval." })
      }
    }
    
    next()
  } catch (err) {
    console.error(`[Auth] Rejected: Invalid token. Error: ${err.message}`);
    res.status(401).json({ message: "Invalid Token" })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." })
    }
    next()
  }
}

