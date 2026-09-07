import "dotenv/config";
import { connectDB } from "../config/db.js";
import Company from "../models/Company.js";
import Attendance from "../models/Attendance.js";

export const backfillAttendance = async () => {
  await connectDB();
  console.log("🔄 Starting Attendance collection backfill...");

  const companies = await Company.find();
  let totalInserted = 0;
  let totalUpdated = 0;

  for (const company of companies) {
    if (!company.attendance || company.attendance.length === 0) continue;

    for (const attRecord of company.attendance) {
      if (!attRecord.employeeId || !attRecord.date) continue;

      const filter = {
        companyId: company._id,
        employeeId: attRecord.employeeId,
        date: new Date(attRecord.date),
      };

      const update = {
        companyId: company._id,
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

      const res = await Attendance.updateOne(filter, { $set: update }, { upsert: true });
      if (res.upsertedCount > 0) totalInserted++;
      else totalUpdated++;
    }
  }

  console.log(`✅ Backfill complete. Inserted: ${totalInserted}, Updated: ${totalUpdated}`);
  return { totalInserted, totalUpdated };
};

if (process.argv[1]?.includes("backfill_attendance.js")) {
  backfillAttendance()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}
