import mongoose from "mongoose";
import config from "../config/env.js";
import CompanyDocument, { normalizeCategory } from "../models/CompanyDocument.js";
import { getDownloadStream } from "../services/gridfsService.js";

// In-memory background job queue for asynchronous document ingestion
const queue = [];
let isProcessing = false;

/**
 * Reads a stream into a single Buffer
 */
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
};

/**
 * Worker to process a single document ingestion job
 */
export const processIngestionJob = async (job) => {
  const { documentId, companyId, category, fileName, fileBuffer, fileId, uploadedAt } = job;
  console.log(`[IngestionQueue] Processing document ingestion for docId: ${documentId}, file: ${fileName}`);

  try {
    // 1. Mark status as processing in MongoDB if connected
    if (documentId && mongoose.connection?.readyState === 1) {
      await CompanyDocument.findByIdAndUpdate(documentId, {
        ingestionStatus: "processing",
      });
    }

    // 2. Resolve file buffer (use provided buffer or stream from GridFS)
    let buffer = fileBuffer;
    if (!buffer && fileId) {
      try {
        const stream = getDownloadStream(fileId);
        buffer = await streamToBuffer(stream);
      } catch (streamErr) {
        console.warn(`[IngestionQueue] Could not stream from GridFS for fileId ${fileId}:`, streamErr.message);
      }
    }

    const base64Content = buffer ? buffer.toString("base64") : "";
    const canonicalCategory = normalizeCategory(category);
    const effectiveUploadedAt = uploadedAt ? new Date(uploadedAt).toISOString() : new Date().toISOString();

    // 3. Call copilot-service's ingestion endpoint
    const serviceUrl = config.copilotServiceUrl.replace(/\/$/, "");
    const response = await fetch(`${serviceUrl}/rag/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": config.internalServiceSecret,
      },
      body: JSON.stringify({
        company_id: String(companyId),
        category: canonicalCategory,
        file: base64Content,
        source_doc: fileName,
        document_id: String(documentId || ""),
        uploadedAt: effectiveUploadedAt,
      }),
    });

    const resData = await response.json();

    if (response.ok && resData?.success) {
      console.log(`[IngestionQueue] Successfully indexed document ${documentId} (${fileName})`);
      if (documentId && mongoose.connection?.readyState === 1) {
        await CompanyDocument.findByIdAndUpdate(documentId, {
          ingestionStatus: "indexed",
        });
      }
      return { success: true, status: "indexed" };
    } else {
      throw new Error(resData?.message || `Ingestion service returned status ${response.status}`);
    }
  } catch (error) {
    console.error(`[IngestionQueue] Ingestion failed for document ${documentId}:`, error.message);
    if (documentId && mongoose.connection?.readyState === 1) {
      try {
        await CompanyDocument.findByIdAndUpdate(documentId, {
          ingestionStatus: "failed",
        });
      } catch (dbErr) {
        console.error(`[IngestionQueue] Failed to mark document status as failed:`, dbErr.message);
      }
    }
    return { success: false, status: "failed", error: error.message };
  }
};

/**
 * Background worker loop
 */
const runWorkerLoop = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (job) {
      try {
        await processIngestionJob(job);
      } catch (err) {
        console.error("[IngestionQueue] Unhandled job execution error:", err);
      }
    }
  }

  isProcessing = false;
};

/**
 * Enqueue a document for asynchronous ingestion into ChromaDB RAG.
 * Non-blocking: returns immediately with queue confirmation.
 */
export const enqueueDocumentIngestion = (jobData) => {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    enqueuedAt: new Date(),
    ...jobData,
  };

  queue.push(job);
  console.log(`[IngestionQueue] Enqueued job ${job.id} for document ${job.documentId} (queue length: ${queue.length})`);

  // Trigger worker asynchronously without awaiting
  setImmediate(() => {
    runWorkerLoop().catch((err) => {
      console.error("[IngestionQueue] Worker loop error:", err);
      isProcessing = false;
    });
  });

  return { enqueued: true, jobId: job.id };
};

/**
 * Phase 6 Requirement 6:
 * Immediately soft-expire ChromaDB chunks of a deleted or replaced document.
 */
export const softExpireDocumentChunks = async ({ companyId, documentId, sourceDoc }) => {
  try {
    const serviceUrl = config.copilotServiceUrl.replace(/\/$/, "");
    const response = await fetch(`${serviceUrl}/rag/expire-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": config.internalServiceSecret,
      },
      body: JSON.stringify({
        company_id: String(companyId),
        document_id: documentId ? String(documentId) : undefined,
        source_doc: sourceDoc || undefined,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error(`[IngestionQueue] Soft-expiry notification failed:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  enqueueDocumentIngestion,
  processIngestionJob,
  softExpireDocumentChunks,
};
