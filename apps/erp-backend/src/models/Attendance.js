import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Half Day", "Absent", "Leave"],
      default: "Present",
    },
    remarks: {
      type: String,
      default: "",
    },
    workDurationMinutes: {
      type: Number,
      default: null,
    },
    verificationMethod: {
      type: String,
      enum: ["Manual", "Facial Recognition", "Mobile Self Check-In", "Camera Kiosk"],
      default: "Manual",
    },
    confidence: {
      type: Number,
      default: null,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    gpsLatitude: {
      type: Number,
      default: null,
    },
    gpsLongitude: {
      type: Number,
      default: null,
    },
    gpsAccuracy: {
      type: Number,
      default: null,
    },
    geofenceStatus: {
      type: String,
      enum: ["PASSED", "FAILED", "NOT_REQUIRED"],
      default: "NOT_REQUIRED",
    },
    distanceFromLocationMeters: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ companyId: 1, date: -1 });
attendanceSchema.index({ companyId: 1, employeeId: 1, date: -1 });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export default Attendance;
