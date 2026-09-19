export class CircuitBreaker {
  constructor({ name, failureThreshold = 3, resetTimeoutMs = 10000, timeoutMs = 5000 }) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.timeoutMs = timeoutMs;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn, fallbackFn) {
    if (this.state === "OPEN") {
      if (Date.now() > this.nextAttempt) {
        this.state = "HALF_OPEN";
      } else {
        const err = new Error(`${this.name} microservice is currently unavailable (Circuit Breaker OPEN).`);
        err.status = 503;
        err.code = "ECONNREFUSED";
        if (fallbackFn) return fallbackFn(err);
        throw err;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      this.onSuccess();
      return result;
    } catch (err) {
      clearTimeout(timer);
      this.onFailure(err);
      if (fallbackFn) return fallbackFn(err);
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure(err) {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
      console.warn(`[CircuitBreaker:${this.name}] Circuit opened due to ${this.failureCount} failures (${err.message})`);
    }
  }
}

export const faceServiceBreaker = new CircuitBreaker({
  name: "FaceService",
  failureThreshold: 3,
  resetTimeoutMs: 10000,
  timeoutMs: 5000,
});

export const copilotServiceBreaker = new CircuitBreaker({
  name: "CopilotService",
  failureThreshold: 3,
  resetTimeoutMs: 10000,
  timeoutMs: 8000,
});
