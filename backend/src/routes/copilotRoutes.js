import express from "express";
import mongoose from "mongoose";
import {
  requireCopilotAuth,
  copilotRbacGuard,
  validateChatPayload,
  validatePayrollPayload,
} from "../middleware/copilotMiddleware.js";
import CopilotConversation from "../models/CopilotConversation.js";
import AuditLog from "../models/AuditLog.js";
import Employee from "../models/Employee.js";
import User from "../models/userModel.js";
import config from "../config/env.js";

const router = express.Router();

/**
 * Persists messages and citations into MongoDB CopilotConversation.
 */
async function saveConversationTurn({
  companyId,
  userId,
  role,
  sessionId,
  userMessage,
  assistantMessage,
  citations = [],
}) {
  if (mongoose.connection.readyState !== 1) {
    return; // DB offline, skip persistence in detached tests
  }

  try {
    const validSessionId = sessionId || "default_session";
    await CopilotConversation.findOneAndUpdate(
      { companyId, userId, sessionId: validSessionId },
      {
        $setOnInsert: { role: role || "EMPLOYEE" },
        $push: {
          thread: [
            {
              role: "user",
              content: userMessage,
              timestamp: new Date(),
            },
            {
              role: "assistant",
              content: assistantMessage,
              citations: citations || [],
              timestamp: new Date(),
            },
          ],
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Failed to persist CopilotConversation:", err.message);
  }
}

/**
 * @route   POST /api/copilot/chat
 * @desc    Chat with Vektra AI Co-Pilot (Live proxy to copilot-service with SSE streaming)
 * @access  Private (JWT + RBAC guarded)
 */
router.post(
  "/chat",
  requireCopilotAuth,
  copilotRbacGuard,
  validateChatPayload,
  async (req, res) => {
    const { userId, companyId, role } = req.authContext;
    const { message, query, sessionId, stream = false, history = [] } = req.body;
    const userPrompt = message || query;
    const activeSessionId = sessionId || "session_" + Date.now();

    // Query live Employee record from MongoDB matching the employee section on the left
    let employeeData = null;
    if (mongoose.connection.readyState === 1) {
      try {
        let userEmail = req.user?.email;
        if (!userEmail && mongoose.Types.ObjectId.isValid(userId)) {
          const u = await User.findById(userId).lean();
          userEmail = u?.email;
        }

        let emp = null;
        if (userEmail) {
          emp = await Employee.findOne({ email: userEmail.toLowerCase() }).lean();
        }
        if (!emp && mongoose.Types.ObjectId.isValid(userId)) {
          emp = await Employee.findById(userId).lean();
        }
        if (!emp && userEmail) {
          const u = await User.findOne({ email: userEmail.toLowerCase() }).lean();
          if (u) {
            emp = {
              name: u.name,
              email: u.email,
              role: u.role,
              department: u.department || "General",
              monthlySalary: u.monthlySalary !== undefined ? u.monthlySalary : 0,
              phoneNumber: u.phone || u.phoneNumber || "Not available",
              employeeId: u.employeeId || "Not assigned",
              status: u.status || "Active",
            };
          }
        }

        if (emp) {
          employeeData = {
            name: emp.name,
            employeeId: emp.employeeId || "Not assigned",
            department: emp.department || "General",
            role: emp.role || role,
            email: emp.email,
            phoneNumber: emp.phoneNumber || "Not available",
            monthlySalary: emp.monthlySalary !== undefined ? emp.monthlySalary : 0,
            status: emp.status || "Active",
          };
        }
      } catch (dbErr) {
        console.warn("[Copilot DB Lookup Warning]:", dbErr.message);
      }
    }

    // Phase 5 Requirement 4: Record audit log entry when salary field is accessed
    const isSalaryQuery = /\b(salary|compensation|wage|wages|payslip|pay|earnings)\b/i.test(userPrompt);
    if (isSalaryQuery && mongoose.connection.readyState === 1) {
      try {
        await AuditLog.create({
          accessorUserId: userId,
          targetUserId: req.body?.targetUserId || userId,
          companyId: companyId,
          field: "salary",
          status: "GRANTED",
          timestamp: new Date(),
        });
      } catch (auditErr) {
        console.warn("[AuditLog Warning]:", auditErr.message);
      }
    }

    const forwardPayload = {
      company_id: String(companyId),
      user_id: String(userId),
      role: String(role),
      query: userPrompt,
      session_id: activeSessionId,
      history: history,
      employee_data: employeeData,
    };


    const isStreaming = stream || req.headers.accept === "text/event-stream";

    try {
      const endpoint = isStreaming
        ? `${config.copilotServiceUrl}/agent/chat/stream`
        : `${config.copilotServiceUrl}/agent/chat`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": config.internalServiceSecret,
        },
        body: JSON.stringify(forwardPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: "AI Microservice error",
          detail: errText,
        });
      }

      if (isStreaming) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        let accumulatedAnswer = "";
        let accumulatedCitations = [];

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value, { stream: true });
          res.write(chunkStr);

          // Parse SSE lines to accumulate final answer for DB saving
          const lines = chunkStr.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.replace("data: ", ""));
                if (parsed.token) {
                  accumulatedAnswer += parsed.token;
                }
                if (parsed.citations) {
                  accumulatedCitations = parsed.citations;
                }
              } catch (_) {}
            }
          }
        }

        res.end();

        // Asynchronously persist conversation
        await saveConversationTurn({
          companyId,
          userId,
          role,
          sessionId: activeSessionId,
          userMessage: userPrompt,
          assistantMessage: accumulatedAnswer,
          citations: accumulatedCitations,
        });
      } else {
        const data = await response.json();
        const agentData = data.data || data;

        await saveConversationTurn({
          companyId,
          userId,
          role,
          sessionId: activeSessionId,
          userMessage: userPrompt,
          assistantMessage: agentData.answer || "",
          citations: agentData.citations || [],
        });

        return res.json({
          success: true,
          sessionId: activeSessionId,
          data: agentData,
        });
      }
    } catch (error) {
      console.error("[Copilot Proxy Error]:", error.message);
      return res.status(502).json({
        success: false,
        message: "Unable to reach AI Copilot microservice.",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/copilot/analyze-payroll
 * @desc    Analyze payroll run details via AI Co-Pilot
 * @access  Private (JWT + RBAC guarded)
 */
router.post(
  "/analyze-payroll",
  requireCopilotAuth,
  copilotRbacGuard,
  validatePayrollPayload,
  async (req, res) => {
    const { userId, companyId, role } = req.authContext;
    const { month, year, payrollRunId, query } = req.body;
    const analysisQuery =
      query ||
      `Analyze payroll run ${payrollRunId || ""} for month ${month || ""}/${year || ""}`;

    const forwardPayload = {
      company_id: String(companyId),
      user_id: String(userId),
      role: String(role),
      query: analysisQuery,
    };

    try {
      const response = await fetch(`${config.copilotServiceUrl}/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": config.internalServiceSecret,
        },
        body: JSON.stringify(forwardPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: "AI Microservice error",
          detail: errText,
        });
      }

      const data = await response.json();
      return res.json({
        success: true,
        data: data.data || data,
      });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: "Unable to reach AI Copilot microservice.",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/copilot/conversations
 * @desc    Retrieve conversation history for current session / user
 * @access  Private (JWT + multi-tenant isolation)
 */
router.get("/conversations", requireCopilotAuth, async (req, res) => {
  try {
    const { companyId, userId } = req.authContext;
    const filter = { companyId, userId };

    const conversations = await CopilotConversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation history.",
      error: error.message,
    });
  }
});

export default router;
