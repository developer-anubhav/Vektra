import { test, describe } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import CompanyDocument, {
  CANONICAL_CATEGORIES,
  CATEGORY_MAP,
  normalizeCategory,
} from "../src/models/CompanyDocument.js";
import {
  enqueueDocumentIngestion,
  processIngestionJob,
  softExpireDocumentChunks,
} from "../src/jobs/documentIngestionQueue.js";

describe("Phase 6: Company Document Ingestion Pipeline", () => {
  test("DoD 1: CompanyDocument model schema validation for ingestionStatus and canonical categories", () => {
    const paths = CompanyDocument.schema.paths;

    // Check ingestionStatus field
    assert.ok(paths.ingestionStatus, "ingestionStatus must exist on CompanyDocument schema");
    assert.strictEqual(paths.ingestionStatus.instance, "String");
    assert.strictEqual(paths.ingestionStatus.defaultValue, "pending");

    const statusEnum = paths.ingestionStatus.enumValues;
    assert.ok(statusEnum.includes("pending"), "Status enum must include 'pending'");
    assert.ok(statusEnum.includes("processing"), "Status enum must include 'processing'");
    assert.ok(statusEnum.includes("indexed"), "Status enum must include 'indexed'");
    assert.ok(statusEnum.includes("failed"), "Status enum must include 'failed'");

    // Check category canonical values
    const categoryEnum = paths.category.enumValues;
    for (const cat of CANONICAL_CATEGORIES) {
      assert.ok(
        categoryEnum.includes(cat),
        `Category enum must include canonical category '${cat}'`
      );
    }
  });

  test("DoD 2: Category normalization maps legacy uppercase categories to canonical categories", () => {
    assert.strictEqual(normalizeCategory("TERMS_AND_CONDITIONS"), "terms_and_conditions");
    assert.strictEqual(normalizeCategory("POLICY"), "company_policies");
    assert.strictEqual(normalizeCategory("HANDBOOK"), "employee_handbooks");
    assert.strictEqual(normalizeCategory("COMPLIANCE"), "compliance_regulatory");
    assert.strictEqual(normalizeCategory("OTHER"), "company_policies");

    assert.strictEqual(normalizeCategory("terms_and_conditions"), "terms_and_conditions");
    assert.strictEqual(normalizeCategory("company_policies"), "company_policies");
    assert.strictEqual(normalizeCategory("employee_handbooks"), "employee_handbooks");
    assert.strictEqual(normalizeCategory("compliance_regulatory"), "compliance_regulatory");
  });

  test("DoD 3: enqueueDocumentIngestion returns immediately without blocking HTTP response", () => {
    const fakeCompanyId = new mongoose.Types.ObjectId();
    const fakeDocId = new mongoose.Types.ObjectId();

    const result = enqueueDocumentIngestion({
      documentId: fakeDocId,
      companyId: fakeCompanyId,
      category: "compliance_regulatory",
      fileName: "Test_Retention.pdf",
      fileBuffer: Buffer.from("Compliance test document buffer"),
      uploadedAt: new Date(),
    });

    assert.ok(result.enqueued, "Job must be enqueued");
    assert.ok(result.jobId, "Job ID must be returned");
    assert.match(result.jobId, /^job_/);
  });

  test("DoD 4: softExpireDocumentChunks sends immediate soft-expiry payload to microservice", async () => {
    const fakeCompanyId = new mongoose.Types.ObjectId().toString();
    const fakeDocId = new mongoose.Types.ObjectId().toString();

    // Call soft-expiry on running copilot microservice
    const result = await softExpireDocumentChunks({
      companyId: fakeCompanyId,
      documentId: fakeDocId,
      sourceDoc: "Deleted_Document.pdf",
    });

    assert.ok(result, "Response should be received from copilot microservice");
    assert.strictEqual(result.success, true);
  });
});
