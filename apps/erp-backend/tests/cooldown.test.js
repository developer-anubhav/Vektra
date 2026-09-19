import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { acquireCooldownLock } from "../src/config/redis.js";

describe("Phase 1: Redis & In-Memory Cooldown Verification", () => {
  test("Concurrent lock acquisition allows only 1 request through", async () => {
    const testEmpId = `emp_test_cooldown_${Date.now()}`;
    const results = await Promise.all([
      acquireCooldownLock(testEmpId, 10000),
      acquireCooldownLock(testEmpId, 10000),
    ]);

    const successCount = results.filter(Boolean).length;
    const cooldownCount = results.filter((r) => !r).length;

    assert.equal(successCount, 1, "Exactly 1 concurrent request should succeed");
    assert.equal(cooldownCount, 1, "Exactly 1 concurrent request should be rejected by cooldown");
  });

  test("Immediate subsequent request is rejected during 10s window", async () => {
    const testEmpId = `emp_test_window_${Date.now()}`;
    const first = await acquireCooldownLock(testEmpId, 10000);
    assert.equal(first, true, "First request acquires lock");

    const second = await acquireCooldownLock(testEmpId, 10000);
    assert.equal(second, false, "Second request fails due to active cooldown");
  });
});
