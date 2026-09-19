import api from "./axios";

/**
 * Fetch documents for the logged-in tenant with optional filters
 * @param {Object} params - { category, search }
 */
export const getDocuments = (params) => api.get("/documents", { params });

/**
 * Upload a new company document (ADMIN/HR only)
 * @param {FormData} formData - Contains file, title, and category
 */
export const uploadDocument = (formData) =>
  api.post("/documents/upload", formData);

/**
 * Soft-delete a document (ADMIN/HR only)
 * @param {string} id - CompanyDocument ID
 */
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

/**
 * Download a document binary blob and trigger browser file save
 * @param {string} id - CompanyDocument ID
 * @param {string} fileName - Target filename for download
 */
export const downloadDocument = async (id, fileName) => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: "blob",
  });

  const contentType =
    response.headers["content-type"] || "application/octet-stream";
  const blob = new Blob([response.data], { type: contentType });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName || "document");
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  link.remove();
  window.URL.revokeObjectURL(url);
};
