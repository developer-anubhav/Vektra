import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Announcement message is required"],
    },
    priority: {
      type: String,
      enum: ["Info", "Warning", "Urgent"],
      default: "Info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Announcement", announcementSchema);
