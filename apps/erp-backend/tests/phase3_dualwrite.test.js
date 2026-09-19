import "dotenv/config";
import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import Company from "../src/models/Company.js";
import Attendance from "../src/models/Attendance.js";
import { syncAttendanceToCollection } from "../src/utils/attendanceSync.js";
import { backfillAttendance } from "../src/scripts/backfill_attendance.js";
import { verifyAttendanceParity } from "../src/scripts/verify_attendance_parity.js";

describe("Phase 3 Dual-Write & Parity Verification", () => {
  let testCompanyId;
  let testEmployeeId;

  before(async () => {
    await connectDB();
    const testCompany = await Company.create({
      name: `Phase3 DualWrite Company ${Date.now()}`,
      adminName: "Test Admin",
      email: `p3dw_${Date.now()}@test.com`,
      employees: [
        {
          employeeId: "P3DW-EMP-01",
          name: "Test Employee DualWrite",
          email: "p3dw_emp@test.com",
          department: "Engineering",
          role: "Developer",
        },
      ],
    });

    testCompanyId = testCompany._id;
    testEmployeeId = testCompany.employees[0]._id;
  });

  after(async () => {
    if (testCompanyId) {
      await Company.deleteOne({ _id: testCompanyId });
      await Attendance.deleteMany({ companyId: testCompanyId });
    }
    await mongoose.connection.close();
  });

  test("3a & 3b: Dual-write creates record in both embedded array and Attendance collection", async () => {
    const company = await Company.findById(testCompanyId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attRecord = {
      employeeId: testEmployeeId,
      date: today,
      status: "Present",
      verificationMethod: "Facial Recognition",
      confidence: 98.5,
      checkInTime: new Date(),
    };

    company.attendance.push(attRecord);
    await company.save();

    const savedRecord = company.attendance[company.attendance.length - 1];
    await syncAttendanceToCollection(company._id, savedRecord);

    const colRecord = await Attendance.findOne({
      companyId: testCompanyId,
      employeeId: testEmployeeId,
    });

    assert.ok(colRecord, "Record exists in standalone Attendance collection");
    assert.equal(colRecord.status, "Present");
    assert.equal(colRecord.verificationMethod, "Facial Recognition");
    assert.equal(colRecord.confidence, 98.5);
  });

  test("3c & 3d: Backfill script and parity check verify 100% match", async () => {
    const backfillRes = await backfillAttendance();
    assert.ok(backfillRes, "Backfill executed successfully");

    const parityRes = await verifyAttendanceParity();
    assert.equal(parityRes.isParityMatch, true, "Parity check passed with 100% match");
  });
});
