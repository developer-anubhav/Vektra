import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    document: {
      type: String,
      trim: true,
      default: "",
    },
    source_doc: {
      type: String,
      trim: true,
      default: "",
    },
    page: {
      type: Number,
      default: 1,
    },
    page_number: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system", "tool"],
      required: [true, "Message role is required"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const copilotConversationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "companyId is required for multi-tenant isolation"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["SUPERADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      required: [true, "User role is required"],
    },
    sessionId: {
      type: String,
      required: [true, "sessionId is required"],
      index: true,
    },
    thread: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast multi-tenant user thread retrieval
copilotConversationSchema.index({ companyId: 1, userId: 1, sessionId: 1 });
copilotConversationSchema.index({ companyId: 1, userId: 1 });

export default mongoose.model("CopilotConversation", copilotConversationSchema);
