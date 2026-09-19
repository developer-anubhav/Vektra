/**
 * Face Controller
 * ===============
 * Proxies face enrollment/profile requests from the HR frontend
 * to the Python face-service running on FACE_SERVICE_URL (default: http://localhost:8000).
 *
 * On successful enrollment, the employee's faceProfile mirror fields
 * in MongoDB are updated so the HR dashboard can display status
 * without querying the face-service on every page load.
 */

import Company from "../models/Company.js";
import { evaluateShiftAttendance } from "../utils/shiftEvaluator.js";
import { validateGeofence } from "../utils/geofenceValidator.js";
import { acquireCooldownLock } from "../config/redis.js";
import { faceServiceBreaker } from "../utils/circuitBreaker.js";
import { syncAttendanceToCollection } from "../utils/attendanceSync.js";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "ehrms_face_service_secret_2026";

// ---------------------------------------------------------------------------
// Helper: forward a request to the face-service and return JSON
// ---------------------------------------------------------------------------
const callFaceService = async (path, options = {}) => {
  return await faceServiceBreaker.execute(async (signal) => {
    const url = `${FACE_SERVICE_URL}${path}`;

    const headers = {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
      signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.detail || `Face service error (${res.status})`);
      err.status = res.status;
      throw err;
    }

    return data;
  });
};

// ---------------------------------------------------------------------------
// POST /api/face/enroll/:employeeId
// ---------------------------------------------------------------------------
export const enrollFace = async (req, res) => {
  try {
    const { employeeId } = req.params;   // MongoDB _id of employee subdocument
    const { images, employee_id_str } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Find the employee in this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Forward to face-service
    const result = await callFaceService(`/face/enroll/${employeeId}`, {
      method: "POST",
      body: JSON.stringify({
        images,
        employee_id_str: employee_id_str || employee.employeeId,
      }),
    });

    // Mirror the enrollment status back into MongoDB
    employee.faceProfile = {
      enrolled: true,
      embeddingCount: result.embeddings_created,
      modelVersion: "vggface2",
      enrolledAt: employee.faceProfile?.enrolledAt || new Date(),
      updatedAt: new Date(),
    };

    await company.save();

    return res.json({
      success: true,
      employee_id: employeeId,
      embeddings_created: result.embeddings_created,
      message: result.message,
    });
  } catch (err) {
    console.error("[FaceController] enrollFace error:", err.message);

    if (err.status === 422) {
      return res.status(422).json({ message: err.message });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable. Please ensure the face-service is running.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/face/profile/:employeeId
// ---------------------------------------------------------------------------
export const getFaceProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Get live status from face-service
    const profile = await callFaceService(`/face/profile/${employeeId}`);

    return res.json({
      employee_id: employeeId,
      employee_id_str: employee.employeeId,
      ...profile,
      // Also include the MongoDB mirror for offline/fallback use
      mirror: employee.faceProfile,
    });
  } catch (err) {
    console.error("[FaceController] getFaceProfile error:", err.message);

    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      // Face service is down — return the MongoDB mirror as fallback
      try {
        const company = await Company.findById(req.user.companyId);
        const employee = company?.employees.id(req.params.employeeId);
        if (employee) {
          return res.json({
            employee_id: req.params.employeeId,
            employee_id_str: employee.employeeId,
            enrolled: employee.faceProfile?.enrolled || false,
            embedding_count: employee.faceProfile?.embeddingCount || 0,
            model_version: employee.faceProfile?.modelVersion || "",
            created_at: employee.faceProfile?.enrolledAt?.toISOString() || "",
            updated_at: employee.faceProfile?.updatedAt?.toISOString() || "",
            mirror: employee.faceProfile,
            _source: "mirror",
          });
        }
      } catch (_) { /* fall through */ }

      return res.status(503).json({
        message: "Face recognition service is unavailable.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/face/profile/:employeeId
// ---------------------------------------------------------------------------
export const deleteFaceProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Delete from face-service
    await callFaceService(`/face/profile/${employeeId}`, { method: "DELETE" });

    // Clear the MongoDB mirror
    employee.faceProfile = {
      enrolled: false,
      embeddingCount: 0,
      modelVersion: "",
      enrolledAt: null,
      updatedAt: new Date(),
    };

    await company.save();

    return res.json({ success: true, message: "Face profile deleted successfully" });
  } catch (err) {
    console.error("[FaceController] deleteFaceProfile error:", err.message);

    if (err.status === 404) {
      return res.status(404).json({ message: "No face profile found for this employee" });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/face/verify-checkin
// ---------------------------------------------------------------------------
export const verifyAndCheckInFace = async (req, res) => {
  try {
    const { image, prevImage, employeeId } = req.body; // image: base64, prevImage: base64 (~250ms prior)

    if (!image) {
      return res.status(400).json({ message: "No image frame provided for verification" });
    }

    // 1. Call Python face-service /face/verify
    const pyPayload = { image };
    if (prevImage) {
      pyPayload.prev_image = prevImage;
    }
    if (employeeId) {
      pyPayload.employee_id = employeeId;
    }

    const verificationResult = await callFaceService("/face/verify", {
      method: "POST",
      body: JSON.stringify(pyPayload),
    });

    if (!verificationResult.matched || !verificationResult.employee_id) {
      return res.status(422).json({
        matched: false,
        message: verificationResult.message || "Face not recognized",
      });
    }

    const matchedEmployeeId = verificationResult.employee_id;

    // --- 10-Second Cooldown Check (Redis-backed with in-memory fallback) ---
    const lockAcquired = await acquireCooldownLock(matchedEmployeeId, 10000);

    if (!lockAcquired) {
      // Cooldown active — fetch employee info for UI without saving duplicate record
      const company = await Company.findById(req.user.companyId);
      const employee = company?.employees.id(matchedEmployeeId);
      return res.json({
        success: true,
        matched: true,
        actionType: "COOLDOWN",
        employee: employee ? {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
          role: employee.role,
        } : null,
        message: `Cooldown active for ${employee?.name || 'employee'}. Please wait a few seconds before scanning again.`,
      });
    }

    // 2. Fetch company & verify matched employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const employee = company.employees.id(matchedEmployeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Matched employee does not belong to your company",
      });
    }

    // 3. Mark / update today's attendance record (Check-In vs Check-Out)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingAttIndex = company.attendance.findIndex(
      (att) =>
        att.employeeId.toString() === matchedEmployeeId.toString() &&
        new Date(att.date).setUTCHours(0, 0, 0, 0) === today.getTime()
    );

    let attRecord;
    const now = new Date();
    let actionType = "CHECK_IN";

    if (existingAttIndex >= 0) {
      attRecord = company.attendance[existingAttIndex];
      const checkInMs = attRecord.checkInTime ? new Date(attRecord.checkInTime).getTime() : 0;
      
      // If checkInTime exists and > 1 minute has elapsed, set checkOutTime
      if (attRecord.checkInTime && (!attRecord.checkOutTime || (now.getTime() - checkInMs > 60000))) {
        attRecord.checkOutTime = now;
        actionType = "CHECK_OUT";
      } else {
        attRecord.checkInTime = attRecord.checkInTime || now;
        actionType = "CHECK_IN";
      }
    } else {
      attRecord = {
        employeeId: matchedEmployeeId,
        date: today,
        checkInTime: now,
        checkOutTime: null,
      };
      company.attendance.push(attRecord);
      actionType = "CHECK_IN";
    }

    // Evaluate shift status, remarks, and work duration
    const shiftEval = evaluateShiftAttendance(
      attRecord.checkInTime,
      attRecord.checkOutTime,
      company.shiftSettings || {}
    );

    attRecord.status = shiftEval.status;
    attRecord.remarks = shiftEval.remarks;
    attRecord.workDurationMinutes = shiftEval.workDurationMinutes;
    attRecord.verificationMethod = "Facial Recognition";
    attRecord.confidence = verificationResult.confidence;

    await company.save();

    const savedRecord = company.attendance[existingAttIndex >= 0 ? existingAttIndex : company.attendance.length - 1];
    await syncAttendanceToCollection(company._id, savedRecord);

    const actionText = actionType === "CHECK_OUT" ? "Check-Out recorded" : "Check-In recorded";

    return res.json({
      success: true,
      matched: true,
      actionType,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        email: employee.email,
      },
      verification: {
        confidence: verificationResult.confidence,
        similarity: verificationResult.similarity,
        distance: verificationResult.distance,
      },
      attendance: savedRecord,
      message: `${actionText} for ${employee.name} (${verificationResult.confidence}% match)!`,
    });
  } catch (err) {
    console.error("[FaceController] verifyAndCheckInFace error:", err.message);

    if (err.status === 422) {
      return res.status(422).json({ matched: false, message: err.message });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable. Please check if face-service is running.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/face/mobile-checkin
// Mobile selfie check-in with GPS Geofencing & Face Verification
// ---------------------------------------------------------------------------
export const mobileCheckIn = async (req, res) => {
  try {
    const { image, prevImage, latitude, longitude, accuracy, employeeId } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No selfie camera frame provided" });
    }

    let company;
    if (req.user?.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne();
    }
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 1. Geofence Verification Check
    const geofenceResult = validateGeofence(
      { latitude, longitude, accuracy },
      company.workLocation || {}
    );

    if (!geofenceResult.insideGeofence) {
      return res.status(422).json({
        success: false,
        matched: false,
        geofencePassed: false,
        geofenceResult,
        message: geofenceResult.message || "Attendance rejected: Device is outside approved workplace geofence radius.",
      });
    }

    // 2. Call Face Recognition Service (FaceNet + Eye Blink Liveness)
    const pyPayload = { image };
    if (prevImage) pyPayload.prev_image = prevImage;
    if (employeeId) pyPayload.employee_id = employeeId;

    const verificationResult = await callFaceService("/face/verify", {
      method: "POST",
      body: JSON.stringify(pyPayload),
    });

    if (!verificationResult.matched || !verificationResult.employee_id) {
      return res.status(422).json({
        success: false,
        matched: false,
        geofencePassed: true,
        geofenceResult,
        message: verificationResult.message || "Face not recognized. Please capture a clear selfie.",
      });
    }

    const matchedEmployeeId = verificationResult.employee_id;
    const employee = company.employees.id(matchedEmployeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Matched employee does not belong to your company",
      });
    }

    // 3. Attendance Cooldown Check (10 seconds, Redis-backed with in-memory fallback)
    const lockAcquired = await acquireCooldownLock(matchedEmployeeId, 10000);

    if (!lockAcquired) {
      return res.json({
        success: true,
        matched: true,
        actionType: "COOLDOWN",
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
          role: employee.role,
        },
        message: `Cooldown active for ${employee.name}. Please wait a few seconds before checking in again.`,
      });
    }

    // 4. Update or Record Attendance in Company DB
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingAttIndex = company.attendance.findIndex(
      (att) =>
        att.employeeId.toString() === matchedEmployeeId.toString() &&
        new Date(att.date).setUTCHours(0, 0, 0, 0) === today.getTime()
    );

    let attRecord;
    const now = new Date();
    let actionType = "CHECK_IN";

    if (existingAttIndex >= 0) {
      attRecord = company.attendance[existingAttIndex];
      const checkInMs = attRecord.checkInTime ? new Date(attRecord.checkInTime).getTime() : 0;

      if (attRecord.checkInTime && (!attRecord.checkOutTime || (now.getTime() - checkInMs > 60000))) {
        attRecord.checkOutTime = now;
        actionType = "CHECK_OUT";
      } else {
        attRecord.checkInTime = attRecord.checkInTime || now;
        actionType = "CHECK_IN";
      }
    } else {
      attRecord = {
        employeeId: matchedEmployeeId,
        date: today,
        checkInTime: now,
        checkOutTime: null,
      };
      company.attendance.push(attRecord);
      actionType = "CHECK_IN";
    }

    // Evaluate shift timings
    const shiftEval = evaluateShiftAttendance(
      attRecord.checkInTime,
      attRecord.checkOutTime,
      company.shiftSettings || {}
    );

    attRecord.status = shiftEval.status;
    attRecord.remarks = shiftEval.remarks;
    attRecord.workDurationMinutes = shiftEval.workDurationMinutes;
    attRecord.verificationMethod = "Mobile Self Check-In";
    attRecord.confidence = verificationResult.confidence;
    attRecord.gpsLatitude = Number(latitude) || null;
    attRecord.gpsLongitude = Number(longitude) || null;
    attRecord.gpsAccuracy = Number(accuracy) || null;
    attRecord.geofenceStatus = geofenceResult.geofenceStatus;
    attRecord.distanceFromLocationMeters = geofenceResult.distanceMeters;

    await company.save();

    const savedRecord = company.attendance[existingAttIndex >= 0 ? existingAttIndex : company.attendance.length - 1];
    await syncAttendanceToCollection(company._id, savedRecord);
    const actionText = actionType === "CHECK_OUT" ? "Mobile Check-Out" : "Mobile Check-In";

    return res.json({
      success: true,
      matched: true,
      actionType,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        email: employee.email,
      },
      verification: {
        confidence: verificationResult.confidence,
        similarity: verificationResult.similarity,
        distance: verificationResult.distance,
        liveness: verificationResult.liveness,
      },
      geofence: geofenceResult,
      attendance: savedRecord,
      message: `${actionText} verified for ${employee.name}! (${geofenceResult.distanceMeters}m from ${company.workLocation?.name || 'office'})`,
    });
  } catch (err) {
    console.error("[FaceController] mobileCheckIn error:", err.message);
    if (err.status === 422) {
      return res.status(422).json({ matched: false, message: err.message });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable. Please check if face-service is running.",
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/face/analytics
// Aggregate facial recognition attendance metrics for HR Dashboard
// ---------------------------------------------------------------------------
export const getFacialAnalytics = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const allRecords = company.attendance || [];
    const todayStr = new Date().toDateString();

    const todayRecords = allRecords.filter(att => new Date(att.date).toDateString() === todayStr);

    let facialToday = 0;
    let manualToday = 0;
    let facialTotal = 0;
    let manualTotal = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    const confDist = { high: 0, normal: 0, borderline: 0 };
    const methodBreakdown = { facial: 0, mobile: 0, manual: 0 };
    const hourlyCounts = Array(24).fill(0);
    let geofencePassedCount = 0;

    allRecords.forEach(att => {
      const isFacial = att.verificationMethod === "Facial Recognition" || att.verificationMethod === "Camera Kiosk";
      const isMobile = att.verificationMethod === "Mobile Self Check-In";

      if (isFacial || isMobile) {
        facialTotal++;
        if (isMobile) methodBreakdown.mobile++;
        else methodBreakdown.facial++;

        if (att.geofenceStatus === "PASSED") {
          geofencePassedCount++;
        }

        if (att.confidence) {
          confidenceSum += att.confidence;
          confidenceCount++;
          if (att.confidence >= 90) confDist.high++;
          else if (att.confidence >= 80) confDist.normal++;
          else confDist.borderline++;
        }

        if (att.checkInTime) {
          const hour = new Date(att.checkInTime).getHours();
          if (hour >= 0 && hour < 24) hourlyCounts[hour]++;
        }
      } else {
        manualTotal++;
        methodBreakdown.manual++;
      }

      if (new Date(att.date).toDateString() === todayStr) {
        if (isFacial || isMobile) facialToday++;
        else manualToday++;
      }
    });

    const totalToday = facialToday + manualToday;
    const roundNumber = (num, decimals) => Number(Math.round(num + "e" + decimals) + "e-" + decimals);
    const adoptionRate = totalToday > 0 ? roundNumber((facialToday / totalToday) * 100, 1) : 0;
    const avgConfidence = confidenceCount > 0 ? roundNumber(confidenceSum / confidenceCount, 1) : 0;

    // Enrolled employees vs total employees
    const employees = company.employees || [];
    const enrolledEmployees = employees.filter(e => e.faceProfile?.enrolled).length;
    const totalEmployees = employees.length;

    return res.json({
      success: true,
      metrics: {
        facialToday,
        manualToday,
        totalToday,
        adoptionRate,
        avgConfidence,
        enrolledEmployees,
        totalEmployees,
        enrollmentPercentage: totalEmployees > 0 ? roundNumber((enrolledEmployees / totalEmployees) * 100, 1) : 0,
        geofencePassedCount,
      },
      workLocation: company.workLocation || {},
      confidenceDistribution: confDist,
      methodBreakdown,
      hourlyCheckIns: hourlyCounts,
    });
  } catch (err) {
    console.error("[FaceController] getFacialAnalytics error:", err);
    return res.status(500).json({ message: "Error loading facial analytics" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/face/audit-logs
// Audit logs of facial recognition check-in events
// ---------------------------------------------------------------------------
export const getFacialAuditLogs = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const { search = "", limit = 50 } = req.query;

    const empMap = new Map();
    company.employees.forEach(emp => {
      empMap.set(emp._id.toString(), emp);
    });

    const logs = [];

    company.attendance.forEach(att => {
      if (att.verificationMethod === "Facial Recognition") {
        const emp = empMap.get(att.employeeId?.toString());

        if (!search || (emp && (emp.name.toLowerCase().includes(search.toLowerCase()) || emp.employeeId?.toLowerCase().includes(search.toLowerCase())))) {
          logs.push({
            _id: att._id,
            date: att.date,
            checkInTime: att.checkInTime,
            checkOutTime: att.checkOutTime,
            status: att.status,
            remarks: att.remarks,
            confidence: att.confidence || 95.0,
            verificationMethod: att.verificationMethod,
            workDurationMinutes: att.workDurationMinutes,
            employee: emp ? {
              _id: emp._id,
              employeeId: emp.employeeId,
              name: emp.name,
              department: emp.department,
              role: emp.role,
            } : null,
          });
        }
      }
    });

    // Newest first
    logs.sort((a, b) => new Date(b.checkInTime || b.date) - new Date(a.checkInTime || a.date));

    return res.json({
      success: true,
      total: logs.length,
      logs: logs.slice(0, Number(limit)),
    });
  } catch (err) {
    console.error("[FaceController] getFacialAuditLogs error:", err);
    return res.status(500).json({ message: "Error loading facial audit logs" });
  }
};

function roundNumber(num, decimals) {
  return Number(Math.round(num + "e" + decimals) + "e-" + decimals);
}

// GET /api/face/settings
export const getBiometricSettings = async (req, res) => {
  try {
    const faceServiceRes = await callFaceService("/face/threshold", { method: "GET" }).catch(() => ({ threshold: 0.70 }));
    return res.json({
      success: true,
      settings: {
        matchThreshold: faceServiceRes.threshold ?? 0.70,
        encryptionEnabled: true,
        encryptionAlgorithm: "AES-256 (Fernet Cipher)",
        serviceAuthEnabled: true,
        retentionDays: 90,
      },
    });
  } catch (err) {
    console.error("Get Biometric Settings Error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch biometric settings" });
  }
};

// POST /api/face/settings
export const updateBiometricSettings = async (req, res) => {
  try {
    const { matchThreshold } = req.body;
    if (matchThreshold !== undefined) {
      await callFaceService("/face/threshold", {
        method: "POST",
        body: JSON.stringify({ threshold: Number(matchThreshold) }),
      });
    }

    return res.json({
      success: true,
      message: "Biometric security and recognition settings updated successfully!",
      settings: {
        matchThreshold: Number(matchThreshold) || 0.70,
        encryptionEnabled: true,
        serviceAuthEnabled: true,
      },
    });
  } catch (err) {
    console.error("Update Biometric Settings Error:", err);
    return res.status(500).json({ message: err.message || "Failed to update biometric settings" });
  }
};

// POST /api/face/cleanup-audit
export const cleanupAuditLogs = async (req, res) => {
  try {
    const { retentionDays = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(retentionDays));

    let company;
    if (req.user?.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne();
    }

    let purgedCount = 0;
    if (company && company.attendance) {
      const originalLen = company.attendance.length;
      company.attendance = company.attendance.filter(
        (att) => new Date(att.date) >= cutoffDate
      );
      purgedCount = originalLen - company.attendance.length;
      company.markModified("attendance");
      await company.save();
    }

    return res.json({
      success: true,
      message: `Successfully purged ${purgedCount} attendance audit logs older than ${retentionDays} days.`,
      purgedCount,
      cutoffDate,
    });
  } catch (err) {
    console.error("Cleanup Audit Logs Error:", err);
    return res.status(500).json({ message: err.message || "Failed to cleanup audit logs" });
  }
};

