import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../config/env.js";
import Company from "../models/Company.js";

/**
 * Validates JWT, extracts authentication claims, and injects context into request.
 */
export const requireCopilotAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required: No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwtSecret);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload: missing user identifier.",
      });
    }

    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
      companyId: decoded.companyId,
      role: decoded.role || "EMPLOYEE",
    };

    // Inject structured authContext downstream
    req.authContext = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      role: req.user.role,
    };

    // Verify company active status if DB is connected and companyId is present
    if (mongoose.connection.readyState === 1 && req.user.companyId && req.user.role === "ADMIN") {
      try {
        const company = await Company.findById(req.user.companyId);
        if (!company) {
          return res.status(403).json({ success: false, message: "Company not found" });
        }
        if (company.status !== "Active") {
          return res.status(403).json({
            success: false,
            message: "Organization is pending approval.",
          });
        }
      } catch (dbErr) {
        return res.status(500).json({ success: false, message: dbErr.message });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: err.message,
    });
  }
};

/**
 * Reusable RBAC guard for Copilot routes:
 * - EMPLOYEE: strictly scoped to own userId only, cannot pass another user's ID or aggregate scopes.
 * - HR / ADMIN / SUPERADMIN: allowed aggregate queries and target scoping.
 */
export const copilotRbacGuard = (req, res, next) => {
  const { role, userId, companyId } = req.authContext || req.user || {};
  const requestedUserId =
    req.body?.userId ||
    req.body?.targetUserId ||
    req.body?.employeeId ||
    req.query?.userId ||
    req.query?.targetUserId ||
    req.query?.employeeId;

  const requestedScope =
    req.body?.scope ||
    req.body?.targetScope ||
    req.query?.scope ||
    req.query?.targetScope;

  const requestedCompanyId = req.body?.companyId || req.query?.companyId;

  // Tenant isolation check
  if (
    requestedCompanyId &&
    role !== "SUPERADMIN" &&
    String(requestedCompanyId) !== String(companyId)
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Cross-tenant access is strictly prohibited.",
    });
  }

  // RBAC checks for EMPLOYEE
  if (role === "EMPLOYEE") {
    // Cannot request data for another user
    if (requestedUserId && String(requestedUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Employees can only access their own records.",
      });
    }

    // Cannot request aggregate / tenant-wide reports
    if (
      requestedScope &&
      ["aggregate", "company", "tenant", "all"].includes(
        String(requestedScope).toLowerCase()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Employees cannot perform aggregate tenant-level queries.",
      });
    }
  }

  next();
};

/**
 * Validates chat request body payload shape.
 */
export const validateChatPayload = (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: Payload must be a valid JSON object.",
    });
  }

  const message = req.body.message ?? req.body.prompt ?? req.body.query;

  if (message === undefined || message === null) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: 'message' field is required.",
    });
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: 'message' must be a non-empty string.",
    });
  }

  if (req.body.sessionId !== undefined && typeof req.body.sessionId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Bad Request: 'sessionId' must be a string if provided.",
    });
  }

  next();
};

/**
 * Validates payroll analysis request body payload shape.
 */
export const validatePayrollPayload = (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: Payload must be a valid JSON object.",
    });
  }

  const { month, year, payrollRunId, query, scope } = req.body;

  // Must provide at least one query parameter or analysis filter
  if (!month && !year && !payrollRunId && !query && !scope) {
    return res.status(400).json({
      success: false,
      message:
        "Bad Request: Must provide payroll analysis criteria (e.g. month, year, payrollRunId, or query).",
    });
  }

  if (month !== undefined && (typeof month !== "number" && isNaN(Number(month)))) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: 'month' must be a valid number.",
    });
  }

  if (year !== undefined && (typeof year !== "number" && isNaN(Number(year)))) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: 'year' must be a valid number.",
    });
  }

  next();
};
