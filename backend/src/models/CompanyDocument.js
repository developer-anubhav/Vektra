import mongoose from "mongoose";

export const CANONICAL_CATEGORIES = [
  "terms_and_conditions",
  "company_policies",
  "employee_handbooks",
  "compliance_regulatory",
];

export const CATEGORY_MAP = {
  TERMS_AND_CONDITIONS: "terms_and_conditions",
  POLICY: "company_policies",
  HANDBOOK: "employee_handbooks",
  COMPLIANCE: "compliance_regulatory",
  OTHER: "company_policies",
  terms_and_conditions: "terms_and_conditions",
  company_policies: "company_policies",
  employee_handbooks: "employee_handbooks",
  compliance_regulatory: "compliance_regulatory",
};

export const normalizeCategory = (category) => {
  if (!category) return "company_policies";
  const str = String(category).trim();
  return CATEGORY_MAP[str] || CATEGORY_MAP[str.toUpperCase()] || str.toLowerCase();
};

const companyDocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "terms_and_conditions",
        "company_policies",
        "employee_handbooks",
        "compliance_regulatory",
        "TERMS_AND_CONDITIONS",
        "POLICY",
        "HANDBOOK",
        "COMPLIANCE",
        "OTHER",
      ],
      required: [true, "Document category is required"],
    },
    ingestionStatus: {
      type: String,
      enum: ["pending", "processing", "indexed", "failed"],
      default: "pending",
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "GridFS file ID is required"],
    },
    fileName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "Mime type is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast tenant-scoped listing and filtering
companyDocumentSchema.index({ companyId: 1, isActive: 1, category: 1 });
companyDocumentSchema.index({ companyId: 1, createdAt: -1 });
companyDocumentSchema.index({ companyId: 1, ingestionStatus: 1 });

export default mongoose.model("CompanyDocument", companyDocumentSchema);

