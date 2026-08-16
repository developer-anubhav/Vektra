import mongoose from "mongoose";

// Sub-schema for Employee
const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
    trim: true,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: "",
  },
  department: {
    type: String,
    required: [true, "Department is required"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
  },
  monthlySalary: {
    type: Number,
    min: [0, "Monthly salary cannot be negative"],
    default: 0,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },

  // --- Face Profile Mirror ---
  // The actual embeddings live in the Python face-service (face-service/data/embeddings.json).
  // This sub-document mirrors the enrollment STATUS so the HR dashboard can
  // display it without calling the face-service on every employee list request.
  faceProfile: {
    enrolled: {
      type: Boolean,
      default: false,
    },
    embeddingCount: {
      type: Number,
      default: 0,
    },
    modelVersion: {
      type: String,
      default: "",
    },
    enrolledAt: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
}, { timestamps: true });

// Sub-schema for Attendance
const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to internal employee _id
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Late", "Half Day", "Absent", "Leave"],
    default: "Present"
  },
  remarks: {
    type: String,
    default: ""
  },
  workDurationMinutes: {
    type: Number,
    default: null
  },
  verificationMethod: {
    type: String,
    enum: ["Manual", "Facial Recognition", "Mobile Self Check-In", "Camera Kiosk"],
    default: "Manual"
  },
  confidence: {
    type: Number,
    default: null
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  gpsLatitude: {
    type: Number,
    default: null
  },
  gpsLongitude: {
    type: Number,
    default: null
  },
  gpsAccuracy: {
    type: Number,
    default: null
  },
  geofenceStatus: {
    type: String,
    enum: ["PASSED", "FAILED", "NOT_REQUIRED"],
    default: "NOT_REQUIRED"
  },
  distanceFromLocationMeters: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Sub-schema for Payroll
const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number
  }
}, { timestamps: true });

// Sub-schema for Saved Reports
const reportSchema = new mongoose.Schema({
  title: String,
  type: String,
  data: mongoose.Schema.Types.Mixed,
  generatedBy: String
}, { timestamps: true });

// Main Company Schema
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Company email is required"],
      unique: true,
      lowercase: true,
    },
    adminName: {
      type: String,
      required: [true, "Admin name is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    
    shiftSettings: {
      startTime: {
        type: String,
        default: "09:00",
      },
      endTime: {
        type: String,
        default: "17:00",
      },
      gracePeriodMinutes: {
        type: Number,
        default: 15,
      },
    },

    workLocation: {
      name: {
        type: String,
        default: "Main Office / HQ",
      },
      latitude: {
        type: Number,
        default: 12.9716, // Default to Bangalore HQ coordinates (configurable)
      },
      longitude: {
        type: Number,
        default: 77.5946,
      },
      radiusMeters: {
        type: Number,
        default: 200, // Allowed radius in meters
      },
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    // Embedded Sub-collections
    employees: [employeeSchema],
    attendance: [attendanceSchema],
    payrolls: [payrollSchema],
    reports: [reportSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Company", companySchema);
