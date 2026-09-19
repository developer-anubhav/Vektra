/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import Card from "../../../components/ui/Card";
import Loader from "../../../components/ui/Loader";
import { useAuth } from "../../../context/AuthContext";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from "../../../api/documentApi";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Plus,
  X,
  FileCheck,
  BookOpen,
  Scale,
  Shield,
  FileCode,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "TERMS_AND_CONDITIONS", label: "Terms & Conditions" },
  { value: "POLICY", label: "Company Policies" },
  { value: "HANDBOOK", label: "Employee Handbooks" },
  { value: "COMPLIANCE", label: "Compliance & Regulatory" },
  { value: "OTHER", label: "Other Documents" },
];

const CATEGORY_COLORS = {
  TERMS_AND_CONDITIONS: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  POLICY: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  HANDBOOK: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  COMPLIANCE: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  OTHER: "bg-slate-700/50 text-slate-200 border-slate-600",
  terms_and_conditions: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  company_policies: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  employee_handbooks: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  compliance_regulatory: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const CATEGORY_ICONS = {
  TERMS_AND_CONDITIONS: Scale,
  POLICY: FileCheck,
  HANDBOOK: BookOpen,
  COMPLIANCE: Shield,
  OTHER: FileCode,
  terms_and_conditions: Scale,
  company_policies: FileCheck,
  employee_handbooks: BookOpen,
  compliance_regulatory: Shield,
};

const INGESTION_STATUS_CONFIG = {
  indexed: {
    label: "RAG Indexed",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  processing: {
    label: "Indexing...",
    className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse",
  },
  pending: {
    label: "Queued",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  failed: {
    label: "Failed",
    className: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
};

export default function Documents() {
  const { user } = useAuth();
  // Allow ADMIN, HR, and MANAGER roles to manage and upload documents
  const canManageDocs = ["ADMIN", "HR", "MANAGER"].includes(user?.role);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("POLICY");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments({
        category: selectedCategory,
        search: searchQuery,
      });
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc._id);
      await downloadDocument(doc._id, doc.fileName);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    if (!file) {
      setUploadFile(null);
      return;
    }

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size exceeds the 15MB maximum limit.");
      setUploadFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    const allowedTypes = [
      "application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf", "text/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png", "image/jpeg", "image/jpg", "application/octet-stream",
    ];

    // Browsers do not consistently report a MIME type for local Office files.
    // Require a supported filename extension in every case, but do not reject a
    // valid selection just because the browser supplied an empty generic type.
    if (!allowedExtensions.includes(extension) || (file.type && !allowedTypes.includes(file.type))) {
      setUploadError(
        "Invalid file format. Only PDF, DOC, DOCX, PNG, and JPEG files are allowed."
      );
      setUploadFile(null);
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) {
      // Auto fill title without extension
      const nameWithoutExt = file.name.substring(
        0,
        file.name.lastIndexOf(".")
      );
      setUploadTitle(nameWithoutExt || file.name);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());
      formData.append("category", uploadCategory);

      await uploadDocument(formData);
      setUploadSuccess("Document uploaded successfully!");

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadTitle("");
        setUploadCategory("POLICY");
        setUploadFile(null);
        setUploadSuccess("");
        fetchDocuments();
      }, 800);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to upload document. Please check connection to server.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await deleteDocument(docToDelete._id);
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top Header Banner with High Contrast */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-primary/20 text-primary border border-primary/30 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              Company Document Storage
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Store, organize, and distribute PDF policies, employee handbooks, compliance docs, and terms across your organization.
            </p>
          </div>

          {canManageDocs && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Upload size={18} />
              Upload PDF / Document
            </button>
          )}
        </div>

        {/* High-Contrast Category Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Total Docs</span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <FileText size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">{documents.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Policies</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <FileCheck size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {documents.filter((d) => d.category === "POLICY").length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Handbooks</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <BookOpen size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {documents.filter((d) => d.category === "HANDBOOK").length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Compliance</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Shield size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {documents.filter((d) => d.category === "COMPLIANCE").length}
            </p>
          </div>
        </div>

        {/* Toolbar: High Contrast Category Filter Tabs & Search */}
        <Card className="p-5 space-y-4 bg-slate-900 border border-slate-700 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.value
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Title Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-colors"
              />
            </form>
          </div>
        </Card>

        {/* Main Document Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-slate-900 border border-slate-700 shadow-lg">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <FileText size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">No documents found</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {searchQuery
                  ? `No documents matching "${searchQuery}".`
                  : "There are currently no documents uploaded in this category for your organization."}
              </p>
            </div>
            {canManageDocs && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Upload size={16} />
                Upload PDF Document
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => {
              const CategoryIcon =
                CATEGORY_ICONS[doc.category] || FileText;
              const colorClasses =
                CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
              const isPdf = doc.mimeType === "application/pdf" || doc.fileName?.toLowerCase().endsWith(".pdf");

              return (
                <Card
                  key={doc._id}
                  className="p-5 flex flex-col justify-between bg-slate-900 border border-slate-700 hover:border-primary/60 transition-all group shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header: Category Badge & PDF indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${colorClasses}`}
                      >
                        <CategoryIcon size={13} />
                        {doc.category.replace(/_/g, " ")}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* AI RAG Ingestion Status Badge */}
                        {doc.ingestionStatus && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              (INGESTION_STATUS_CONFIG[doc.ingestionStatus] || INGESTION_STATUS_CONFIG.pending).className
                            }`}
                            title={`AI Co-Pilot Ingestion Status: ${doc.ingestionStatus}`}
                          >
                            <Sparkles size={10} className="shrink-0" />
                            {(INGESTION_STATUS_CONFIG[doc.ingestionStatus] || INGESTION_STATUS_CONFIG.pending).label}
                          </span>
                        )}

                        {isPdf && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black rounded uppercase">
                            PDF
                          </span>
                        )}

                        {canManageDocs && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Document Title */}
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 truncate font-mono">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info & Download */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <p className="font-semibold">{formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                      <p className="text-slate-400">
                        Uploaded by {doc.uploadedBy?.name || "HR Admin"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-primary text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-primary transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Download size={14} />
                      {downloadingId === doc._id ? "Downloading..." : "Download"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Document Modal (PDF & Office Docs) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 text-primary border border-primary/30 rounded-2xl">
                  <Upload size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload Company Document</h2>
                  <p className="text-xs text-slate-300">Upload PDF, Word, or image documents for organization distribution</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError("");
                  setUploadSuccess("");
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-semibold">
                <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms & Conditions 2026 / Employee Policy PDF"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="TERMS_AND_CONDITIONS">Terms & Conditions</option>
                  <option value="POLICY">Company Policy</option>
                  <option value="HANDBOOK">Employee Handbook</option>
                  <option value="COMPLIANCE">Compliance & Regulatory</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Select File (PDF, DOC, DOCX, PNG, JPEG — Max 15MB) *
                </label>
                <div className="relative border-2 border-dashed border-slate-700 hover:border-primary bg-slate-950/80 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <Upload className="mx-auto text-primary h-8 w-8" />
                    {uploadFile ? (
                      <div className="p-2 bg-primary/20 border border-primary/40 rounded-xl inline-block">
                        <p className="text-xs font-bold text-white">
                          📄 {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-white font-bold">
                          Click or drag a file to upload
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">Supports PDF, DOC, DOCX, PNG, JPEG up to 15MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Remove Document</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">"{docToDelete.title}"</span>?
              This document will be soft-deleted and removed from the active directory.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Confirm Soft Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
