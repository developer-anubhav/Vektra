/**
 * Face Enrollment API
 * Talks to Node.js /api/face/* which proxies to the Python face-service.
 * Uses the shared axios instance (auto-attaches JWT token).
 */

import api from "./axios";

/**
 * Enroll face images for an employee.
 * @param {string} employeeMongoId  - Employee MongoDB _id
 * @param {string[]} images         - Array of base64-encoded image strings
 * @param {string} employeeIdStr    - Human-readable employee ID (e.g. "EMP102")
 */
export const enrollFace = (employeeMongoId, images, employeeIdStr = "") =>
  api.post(`/face/enroll/${employeeMongoId}`, {
    images,
    employee_id_str: employeeIdStr,
  });

/**
 * Get face enrollment profile for an employee.
 * @param {string} employeeMongoId - Employee MongoDB _id
 */
export const getFaceProfile = (employeeMongoId) =>
  api.get(`/face/profile/${employeeMongoId}`);

/**
 * Delete face profile for an employee.
 * @param {string} employeeMongoId - Employee MongoDB _id
 */
export const deleteFaceProfile = (employeeMongoId) =>
  api.delete(`/face/profile/${employeeMongoId}`);

/**
 * Verify face image frame(s) and record attendance for the recognized employee.
 * @param {string} image - Base64 encoded image frame (current)
 * @param {string} [employeeMongoId] - Optional employee MongoDB _id for 1:1 check
 * @param {string} [prevImage] - Optional previous frame base64 (~250ms prior) for eye blink check
 */
export const verifyAndCheckIn = (image, employeeMongoId = null, prevImage = null) =>
  api.post("/face/verify-checkin", {
    image,
    prevImage,
    employeeId: employeeMongoId,
  });

/**
 * Perform Mobile Selfie Check-In with GPS Geofencing verification.
 * @param {object} payload - { image, prevImage, latitude, longitude, accuracy, employeeId }
 */
export const mobileCheckIn = (payload) => api.post("/face/mobile-checkin", payload);

/**
 * Fetch company work location & geofence settings.
 */
export const getWorkLocation = () => api.get("/admin/work-location");

/**
 * Update company work location & geofence settings.
 * @param {object} locationData - { name, latitude, longitude, radiusMeters, enabled }
 */
export const updateWorkLocation = (locationData) => api.put("/admin/work-location", locationData);

/**
 * Fetch aggregate facial attendance metrics for HR Analytics Dashboard.
 */
export const getFacialAnalytics = () => api.get("/face/analytics");

/**
 * Fetch facial verification audit logs.
 * @param {object} [params] - Optional query params { search, limit }
 */
export const getFacialAuditLogs = (params = {}) => api.get("/face/audit-logs", { params });

/**
 * Fetch biometric security & model calibration settings.
 */
export const getBiometricSettings = () => api.get("/face/settings");

/**
 * Update face recognition match threshold settings.
 * @param {object} settings - { matchThreshold }
 */
export const updateBiometricSettings = (settings) => api.post("/face/settings", settings);

/**
 * Purge old facial audit log records older than N days.
 * @param {object} payload - { retentionDays }
 */
export const cleanupAuditLogs = (payload) => api.post("/face/cleanup-audit", payload);

