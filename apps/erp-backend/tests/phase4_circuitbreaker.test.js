import "dotenv/config";
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { CircuitBreaker } from "../src/utils/circuitBreaker.js";

describe("Phase 4: Circuit Breaker Verification", () => {
  test("Breaker opens after threshold failures and fails fast with 503 error", async () => {
    const breaker = new CircuitBreaker({
      name: "TestService",
      failureThreshold: 3,
      resetTimeoutMs: 10000,
      timeoutMs: 100,
    });

    const failingCall = async () => {
      await breaker.execute(async () => {
        throw new Error("Connection refused");
      });
    };

    // Trigger 3 failures
    await assert.rejects(failingCall);
    await assert.rejects(failingCall);
    await assert.rejects(failingCall);

    assert.equal(breaker.state, "OPEN", "Circuit breaker opens after 3 failures");

    // Next call should fail fast immediately with 503
    try {
      await failingCall();
      assert.fail("Should have thrown 503 circuit open error");
    } catch (err) {
      assert.equal(err.status, 503, "Fails fast with 503 status code");
      assert.ok(err.message.includes("Circuit Breaker OPEN"));
    }
  });

  test("Breaker respects request timeout signal", async () => {
    const breaker = new CircuitBreaker({
      name: "TimeoutService",
      failureThreshold: 1,
      resetTimeoutMs: 10000,
      timeoutMs: 100,
    });

    const slowCall = async () => {
      await breaker.execute(async (signal) => {
        await new Promise((resolve, reject) => {
          const t = setTimeout(resolve, 1000);
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new Error("Request aborted"));
          });
        });
      });
    };

    await assert.rejects(slowCall);
    assert.equal(breaker.state, "OPEN", "Circuit opens on request timeout");
  });
});
