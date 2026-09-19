import express from "express";
import multer from "multer";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import { enqueueDocumentIngestion, softExpireDocumentChunks } from "../jobs/documentIngestionQueue.js";

const router = express.Router();

const FILE_TYPES = {
  ".pdf": ["application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf", "text/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const filename = (file.originalname || "").toLowerCase();
    const extension = Object.keys(FILE_TYPES).find((ext) => filename.endsWith(ext));
    const declaredMimeType = (file.mimetype || "").toLowerCase();
    
    const mimeTypeMatches =
      extension &&
      (!declaredMimeType ||
        declaredMimeType === "application/octet-stream" ||
        FILE_TYPES[extension].includes(declaredMimeType));

    if (mimeTypeMatches) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, PNG, and JPEG files are allowed."
        ),
        false
      );
    }
  },
});

// Middleware wrapper to handle Multer upload errors cleanly
const handleFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File size exceeds maximum limit of 15MB." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// All document endpoints require authentication
router.use(protect);

// GET routes for listing documents
router.get("/", listDocuments);
router.get("/upload", listDocuments);

// GET routes for downloading document by ID
router.get("/:id/download", downloadDocument);
router.get("/:id", (req, res, next) => {
  if (req.params.id === "upload") return listDocuments(req, res, next);
  return downloadDocument(req, res, next);
});

// POST routes for document upload
router.post("/upload", authorize("ADMIN", "HR", "MANAGER"), handleFileUpload, uploadDocument);
router.post("/", authorize("ADMIN", "HR", "MANAGER"), handleFileUpload, uploadDocument);

// DELETE route
router.delete("/:id", authorize("ADMIN", "HR", "MANAGER"), deleteDocument);

export default router;
