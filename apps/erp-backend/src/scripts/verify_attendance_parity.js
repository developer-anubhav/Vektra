import "dotenv/config";
import { connectDB } from "../config/db.js";
import Company from "../models/Company.js";
import Attendance from "../models/Attendance.js";

export const verifyAttendanceParity = async () => {
  await connectDB();
  console.log("🔍 Running Attendance collection Parity Verification...");

  const companies = await Company.find();
  let totalEmbedded = 0;
  let totalCollection = 0;
  let isParityMatch = true;

  for (const company of companies) {
    const embeddedRecords = company.attendance || [];
    const collectionRecords = await Attendance.find({ companyId: company._id });

    totalEmbedded += embeddedRecords.length;
    totalCollection += collectionRecords.length;

    console.log(
      `🏢 Company "${company.name}" (_id: ${company._id}): embedded=${embeddedRecords.length}, collection=${collectionRecords.length}`
    );

    if (embeddedRecords.length !== collectionRecords.length) {
      console.warn(
        `⚠️ Mismatch in record counts for company ${company._id}: embedded=${embeddedRecords.length} vs collection=${collectionRecords.length}`
      );
      isParityMatch = false;
    }
  }

  console.log(`📊 Total embedded: ${totalEmbedded}, Total collection: ${totalCollection}`);
  if (isParityMatch) {
    console.log("✅ PARITY PASSED: Embedded array and standalone collection match 100%.");
  } else {
    console.warn("❌ PARITY MISMATCH detected.");
  }

  return { isParityMatch, totalEmbedded, totalCollection };
};

if (process.argv[1]?.includes("verify_attendance_parity.js")) {
  verifyAttendanceParity()
    .then((res) => process.exit(res.isParityMatch ? 0 : 1))
    .catch((err) => {
      console.error("Parity check error:", err);
      process.exit(1);
    });
}
