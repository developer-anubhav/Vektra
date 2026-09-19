import Attendance from "../models/Attendance.js";

/**
 * Dual-write helper to keep standalone Attendance collection in sync with embedded array writes.
 */
export const syncAttendanceToCollection = async (companyId, attRecord) => {
  if (!companyId || !attRecord || !attRecord.employeeId) return;

  try {
    const filter = {
      companyId,
      employeeId: attRecord.employeeId,
      date: new Date(attRecord.date),
    };

    const update = {
      companyId,
      employeeId: attRecord.employeeId,
      date: new Date(attRecord.date),
      status: attRecord.status || "Present",
      remarks: attRecord.remarks || "",
      workDurationMinutes: attRecord.workDurationMinutes ?? null,
      verificationMethod: attRecord.verificationMethod || "Manual",
      confidence: attRecord.confidence ?? null,
      checkInTime: attRecord.checkInTime ? new Date(attRecord.checkInTime) : null,
      checkOutTime: attRecord.checkOutTime ? new Date(attRecord.checkOutTime) : null,
      gpsLatitude: attRecord.gpsLatitude ?? null,
      gpsLongitude: attRecord.gpsLongitude ?? null,
      gpsAccuracy: attRecord.gpsAccuracy ?? null,
      geofenceStatus: attRecord.geofenceStatus || "NOT_REQUIRED",
      distanceFromLocationMeters: attRecord.distanceFromLocationMeters ?? null,
    };

    await Attendance.updateOne(filter, { $set: update }, { upsert: true });
  } catch (err) {
    console.error("[DualWrite Error] Failed to sync to Attendance collection:", err.message);
  }
};

export const deleteAttendanceFromCollection = async (companyId, attRecordOrId) => {
  if (!companyId) return;
  try {
    if (typeof attRecordOrId === "object" && attRecordOrId.employeeId && attRecordOrId.date) {
      await Attendance.deleteOne({
        companyId,
        employeeId: attRecordOrId.employeeId,
        date: new Date(attRecordOrId.date),
      });
    } else {
      await Attendance.deleteOne({ _id: attRecordOrId });
    }
  } catch (err) {
    console.error("[DualWrite Error] Failed to delete from Attendance collection:", err.message);
  }
};

export const deleteEmployeeAttendanceFromCollection = async (companyId, employeeId) => {
  if (!companyId || !employeeId) return;
  try {
    await Attendance.deleteMany({ companyId, employeeId });
  } catch (err) {
    console.error("[DualWrite Error] Failed to delete employee attendance:", err.message);
  }
};
