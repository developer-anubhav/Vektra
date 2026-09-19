import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "TASK_UPDATED", "DEADLINE_APPROACHING", "TASK_OVERDUE", "PROJECT_COMPLETED", "GENERAL"],
      default: "GENERAL",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Required indexes leading with companyId
notificationSchema.index({ companyId: 1, recipientId: 1, isRead: 1 });
notificationSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
