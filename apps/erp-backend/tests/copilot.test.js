import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import CopilotConversation from "../src/models/CopilotConversation.js";
import config, { validateEnv } from "../src/config/env.js";

const JWT_SECRET = process.env.JWT_SECRET || config.jwtSecret;

const makeRequest = (server, { method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqBody = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      ...headers,
      "Content-Type": "application/json",
    };
    if (reqBody) {
      reqHeaders["Content-Length"] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed, raw: data, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, body: data, raw: data, headers: res.headers });
          }
        });
      }
    );

    req.on("error", reject);
    if (reqBody) {
      req.write(reqBody);
    }
    req.end();
  });
};

describe("Phase 3: HR Agent Gateway Proxy, RBAC & Multi-Tenant Verification", () => {
  let server;
  let mockAiServer;
  let receivedSecretHeader = null;
  let receivedPayload = null;

  const mockCompanyId = new mongoose.Types.ObjectId().toString();
  const mockEmployeeId = new mongoose.Types.ObjectId().toString();
  const mockOtherEmployeeId = new mongoose.Types.ObjectId().toString();
  const mockAdminId = new mongoose.Types.ObjectId().toString();

  const employeeToken = jwt.sign(
    { id: mockEmployeeId, userId: mockEmployeeId, role: "EMPLOYEE", companyId: mockCompanyId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const adminToken = jwt.sign(
    { id: mockAdminId, userId: mockAdminId, role: "ADMIN", companyId: mockCompanyId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  before(async () => {
    // 1. Start mock AI microservice
    mockAiServer = http.createServer((req, res) => {
      receivedSecretHeader = req.headers["x-internal-secret"];
      let bodyData = "";
      req.on("data", (c) => (bodyData += c));
      req.on("end", () => {
        try {
          receivedPayload = JSON.parse(bodyData);
        } catch (_) {}

        if (req.url === "/agent/chat/stream") {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          });
          res.write('data: {"token": "According to policy, "}\n\n');
          res.write('data: {"token": "you have 12 sick days."}\n\n');
          res.write(
            'data: {"citations": [{"source_doc": "Handbook.pdf", "page_number": 3, "section": "Leave"}], "done": true}\n\n'
          );
          res.end();
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              data: {
                answer: "According to company handbook, annual leave is 20 days.",
                citations: [
                  { source_doc: "Handbook.pdf", page_number: 1, section: "Annual Leave" },
                ],
                grounded: true,
                status: "COMPLETED",
              },
            })
          );
        }
      });
    });

    await new Promise((resolve) => mockAiServer.listen(0, resolve));
    const aiPort = mockAiServer.address().port;
    config.copilotServiceUrl = `http://127.0.0.1:${aiPort}`;

    // 2. Start Express app
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => mockAiServer.close(resolve));
    await mongoose.disconnect();
  });

  test("DoD 1: CopilotConversation model schema validation", () => {
    const sampleDoc = new CopilotConversation({
      companyId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      role: "EMPLOYEE",
      sessionId: "session-test-123",
      thread: [
        {
          role: "user",
          content: "What is the policy for leave?",
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: "According to the handbook, standard annual leave is 20 days.",
          citations: [
            {
              document: "Leave_Policy_2026.pdf",
              source_doc: "Leave_Policy_2026.pdf",
              page: 4,
              page_number: 4,
              section: "Annual Leave",
            },
          ],
          timestamp: new Date(),
        },
      ],
    });

    const validationError = sampleDoc.validateSync();
    assert.equal(validationError, undefined, "Schema validation should pass");
  });

  test("DoD 2: /api/copilot/chat rejects unauthenticated requests (401)", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      body: { message: "Hello" },
    });
    assert.equal(res.status, 401);
  });

  test("DoD 3: EMPLOYEE cannot scope query to another user's ID (403)", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        message: "What is the attendance for another employee?",
        targetUserId: mockOtherEmployeeId,
      },
    });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /Employees can only access their own records/i);
  });

  test("DoD 4: EMPLOYEE cannot request aggregate scope (403)", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        message: "Total company salaries",
        scope: "aggregate",
      },
    });
    assert.equal(res.status, 403);
  });

  test("DoD 5: Malformed payload returns 400 Bad Request", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {},
    });
    assert.equal(res.status, 400);
  });

  test("DoD 6: Express proxies request with X-Internal-Secret and returns grounded answer", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        message: "How many annual leave days do I get?",
        sessionId: "sess_test_101",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.answer);
    assert.equal(receivedSecretHeader, config.internalServiceSecret);
    assert.equal(receivedPayload.company_id, mockCompanyId);
    assert.equal(receivedPayload.user_id, mockEmployeeId);
  });

  test("DoD 7: Express streams SSE tokens when stream=true", async () => {
    const res = await makeRequest(server, {
      method: "POST",
      path: "/api/copilot/chat",
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        message: "How many sick days do I get?",
        stream: true,
      },
    });

    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /text\/event-stream/);
    assert.ok(res.raw.includes("data: "));
    assert.ok(res.raw.includes('"citations"'));
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mockAiServer) await new Promise((resolve) => mockAiServer.close(resolve));
    await mongoose.connection.close();
  });
});
