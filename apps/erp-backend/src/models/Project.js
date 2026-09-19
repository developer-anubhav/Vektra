import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
    },
    projectCode: {
      type: String,
      required: [true, "Project code is required"],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"],
      default: "PLANNING",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Project manager is required"],
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    estimatedProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    actualProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Required indexes with companyId leading
projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, projectManager: 1 });

export default mongoose.model("Project", projectSchema);
