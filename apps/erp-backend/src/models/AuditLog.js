import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    accessorUserId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: [true, "accessorUserId is required"],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: [true, "targetUserId is required"],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Company",
      required: [true, "companyId is required for multi-tenant isolation"],
      index: true,
    },
    field: {
      type: String,
      required: [true, "Audited field name is required"],
      default: "salary",
      index: true,
    },
    status: {
      type: String,
      enum: ["GRANTED", "DENIED"],
      default: "GRANTED",
    },
    reason: {
      type: String,
      default: "Salary inspection",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ companyId: 1, field: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
