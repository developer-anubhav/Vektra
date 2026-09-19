import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
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

export default mongoose.model("Employee", employeeSchema);
