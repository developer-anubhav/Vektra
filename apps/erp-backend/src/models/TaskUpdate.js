import mongoose from "mongoose";

const taskUpdateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task ID is required"],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
    },
    updateMessage: {
      type: String,
      required: [true, "Update message is required"],
      trim: true,
    },
    progressBefore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    progressAfter: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Required index leading with companyId
taskUpdateSchema.index({ companyId: 1, taskId: 1, createdAt: -1 });

export default mongoose.model("TaskUpdate", taskUpdateSchema);
