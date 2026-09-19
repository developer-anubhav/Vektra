import CompanyDocument, { normalizeCategory, CANONICAL_CATEGORIES } from "../models/CompanyDocument.js";
import Company from "../models/Company.js";
import User from "../models/userModel.js";
import { uploadToGridFS, getDownloadStream, deleteFromGridFS } from "../services/gridfsService.js";
import { enqueueDocumentIngestion, softExpireDocumentChunks } from "../jobs/documentIngestionQueue.js";

const VALID_CATEGORIES = [
  "TERMS_AND_CONDITIONS",
  "POLICY",
  "HANDBOOK",
  "COMPLIANCE",
  "OTHER",
  ...CANONICAL_CATEGORIES,
];

const safeFileName = (filename) => {
  const sanitized = String(filename || "document")
    .replace(/^.*[\\/]/, "")
    .replace(/[\r\n]/g, "")
    .trim();
  return sanitized || "document";
};

/**
 * Helper to resolve companyId safely from req.user or database
 */
const resolveCompanyId = async (reqUser) => {
  if (reqUser?.companyId) return reqUser.companyId;
  const userId = reqUser?._id || reqUser?.id;
  if (userId) {
    const userDoc = await User.findById(userId);
    if (userDoc?.companyId) return userDoc.companyId;
  }
  const defaultCompany = await Company.findOne();
  return defaultCompany?._id;
};

/**
 * Upload a document to GridFS and store tenant-scoped metadata.
 * Access: ADMIN, HR, MANAGER
 */
export const uploadDocument = async (req, res) => {
  let fileId;
  try {
    const { title, category } = req.body;
    const companyId = await resolveCompanyId(req.user);
    const uploadedBy = req.user?._id || req.user?.id;

    if (!companyId) {
      return res.status(400).json({ message: "Company identification is required. Please check organization settings." });
    }

    if (!uploadedBy) {
      return res.status(401).json({ message: "Authenticated user identification is required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required for upload." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Document title is required." });
    }

    const rawCategory = (category || "").trim();
    const upperCategory = rawCategory.toUpperCase();
    const canonicalCategory = normalizeCategory(rawCategory);

    if (!VALID_CATEGORIES.includes(rawCategory) && !VALID_CATEGORIES.includes(upperCategory)) {
      return res.status(400).json({
        message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const fileName = safeFileName(req.file.originalname);

    // Store the content first, then persist its tenant-scoped metadata. The
    // catch block below removes the content again if the metadata write fails.
    fileId = await uploadToGridFS(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      { companyId: companyId.toString(), uploadedBy: uploadedBy?.toString() }
    );

    // Save structured metadata in Mongoose collection with canonical category
    const document = await CompanyDocument.create({
      companyId,
      title: title.trim(),
      category: canonicalCategory,
      ingestionStatus: "pending",
      fileId,
      fileName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy,
      isActive: true,
    });

    // Phase 6 Requirement 2: Enqueue background ingestion job rather than blocking the HTTP response
    enqueueDocumentIngestion({
      documentId: document._id,
      companyId,
      category: canonicalCategory,
      fileName,
      fileBuffer: req.file.buffer,
      fileId,
      uploadedAt: document.createdAt || new Date(),
    });

    const populatedDoc = await CompanyDocument.findById(document._id).populate(
      "uploadedBy",
      "name email role"
    );

    return res.status(201).json({
      message: "Document uploaded successfully",
      data: populatedDoc,
    });
  } catch (error) {
    console.error("[DocumentController] Upload error:", error);
    if (fileId) {
      try {
        await deleteFromGridFS(fileId);
      } catch (cleanupError) {
        console.error("[DocumentController] Failed to remove orphaned GridFS file:", cleanupError);
      }
    }
    return res.status(500).json({ message: error.message || "Failed to upload document" });
  }
};

/**
 * List all active documents for the caller's tenant.
 * Access: All authenticated users in the company
 */
export const listDocuments = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req.user);

    if (!companyId) {
      return res.status(400).json({ message: "Company identification is required" });
    }

    const { category, search } = req.query;

    const query = {
      companyId,
      isActive: true,
    };

    if (category && category.toUpperCase() !== "ALL") {
      const canonical = normalizeCategory(category);
      const upper = category.toUpperCase();
      query.category = { $in: [category, canonical, upper] };
    }


    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const documents = await CompanyDocument.find(query)
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Documents retrieved successfully",
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("[DocumentController] List error:", error);
    return res.status(500).json({ message: error.message || "Failed to retrieve documents" });
  }
};

/**
 * Download document stream from GridFS by CompanyDocument ID after verifying tenant access.
 * Access: All authenticated users in the company
 */
export const downloadDocument = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req.user);
    const documentId = req.params.id;

    if (!companyId) {
      return res.status(400).json({ message: "Company identification is required" });
    }

    // Resolve metadata record first for tenant isolation check
    const document = await CompanyDocument.findOne({
      _id: documentId,
      companyId,
      isActive: true,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found or access denied" });
    }

    const downloadStream = getDownloadStream(document.fileId);

    downloadStream.on("error", (err) => {
      console.error("[DocumentController] Download stream error:", err);
      if (!res.headersSent) {
        return res.status(404).json({ message: "File content missing from storage" });
      }
    });

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName(document.fileName).replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(safeFileName(document.fileName))}`
    );
    res.setHeader("Content-Length", document.fileSize);

    downloadStream.pipe(res);
  } catch (error) {
    console.error("[DocumentController] Download error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message || "Failed to download document" });
    }
  }
};

/**
 * Soft-delete a document record.
 * Access: ADMIN, HR, MANAGER
 */
export const deleteDocument = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req.user);
    const documentId = req.params.id;

    if (!companyId) {
      return res.status(400).json({ message: "Company identification is required" });
    }

    const document = await CompanyDocument.findOne({
      _id: documentId,
      companyId,
      isActive: true,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found or access denied" });
    }

    document.isActive = false;
    await document.save();

    // Phase 6 Requirement 6: Immediately set valid_until = now on that document's existing chunks
    await softExpireDocumentChunks({
      companyId,
      documentId: document._id,
      sourceDoc: document.fileName,
    });

    return res.status(200).json({
      message: "Document deleted successfully",
      data: document,
    });
  } catch (error) {
    console.error("[DocumentController] Delete error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete document" });
  }
};
