/**
 * WP 2.3 — Anti-DoS Authentication Rate-Limiting tests
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  canAttemptAuth,
  recordAuthFailure,
  recordAuthSuccess,
  isAccountLocked,
  rateLimitResponse,
  getAuthRateLimitStatus,
} from "@/lib/security/auth-rate-limit";

describe("WP 2.3: Anti-DoS Authentication Rate-Limiting", () => {
  describe("canAttemptAuth (pre-bcrypt check)", () => {
    beforeEach(async () => {
      // Clear state between tests
    });

    it("allows first attempt from fresh IP", async () => {
      const result = await canAttemptAuth("192.168.1.100", "test@example.com");
      expect(result.allowed).toBe(true);
    });

    it("rate-limits after 10 attempts from same IP in 1 min", async () => {
      const ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
      // Use different email each time so identity limit doesn't fire first
      // (IP_MAX_PER_WINDOW=10, IDENTITY_MAX_PER_WINDOW=5)

      // 10 attempts should all succeed (within IP_MAX_PER_WINDOW)
      for (let i = 0; i < 10; i++) {
        const r = await canAttemptAuth(ip, `user${i}@example.com`);
        expect(r.allowed).toBe(true);
      }

      // 11th attempt should be IP rate-limited
      const r = await canAttemptAuth(ip, "eleventh@example.com");
      expect(r.allowed).toBe(false);
      expect(r.reason).toBe("ip_rate_limited");
    });

    it("rate-limits identity after 5 attempts on same email", async () => {
      // Use different IPs each time to bypass IP limit, but same email
      const email = `unique-${Math.random()}@example.com`;
      for (let i = 0; i < 5; i++) {
        const r = await canAttemptAuth(`10.0.0.${i}`, email);
        expect(r.allowed).toBe(true);
      }
      const r = await canAttemptAuth("10.0.0.99", email);
      expect(r.allowed).toBe(false);
      expect(r.reason).toBe("identity_rate_limited");
    });

    it("rejects banned IP", async () => {
      const ip = "203.0.113.99";
      // Trigger IP ban via 20 auth failures
      for (let i = 0; i < 20; i++) {
        await recordAuthFailure(ip, "banned-test@example.com", undefined);
      }
      const result = await canAttemptAuth(ip, "different-email@example.com");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("ip_banned");
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe("recordAuthFailure", () => {
    it("tracks failure counts per IP", async () => {
      const ip = "198.51.100.1";
      const email = "fail-test@example.com";
      const r1 = await recordAuthFailure(ip, email, undefined);
      expect(r1.ipBanned).toBeFalsy();
      const status = await getAuthRateLimitStatus(ip, email);
      expect(status.ipFailures).toBeGreaterThanOrEqual(1);
    });

    it("locks account after 5 failures", async () => {
      const ip = "198.51.100.2";
      const email = "lock-test@example.com";
      const userId = "user-lock-test";
      let lastResult;
      for (let i = 0; i < 5; i++) {
        lastResult = await recordAuthFailure(ip, email, userId);
      }
      expect(lastResult?.accountLocked).toBe(true);
      expect(await isAccountLocked(userId)).toBe(true);
    });

    it("bans IP after 20 failures (across different emails)", async () => {
      const ip = "198.51.100.3";
      let lastResult;
      for (let i = 0; i < 20; i++) {
        lastResult = await recordAuthFailure(ip, `email-${i}@example.com`, undefined);
      }
      expect(lastResult?.ipBanned).toBe(true);
    });
  });

  describe("recordAuthSuccess", () => {
    it("clears failure counters on success", async () => {
      const ip = "198.51.100.4";
      const email = "success-test@example.com";
      const userId = "user-success-test";

      // Record a few failures
      await recordAuthFailure(ip, email, userId);
      await recordAuthFailure(ip, email, userId);

      const beforeStatus = await getAuthRateLimitStatus(ip, email, userId);
      expect(beforeStatus.ipFailures).toBeGreaterThanOrEqual(2);

      // Now success — counters should clear
      await recordAuthSuccess(ip, email, userId);

      const afterStatus = await getAuthRateLimitStatus(ip, email, userId);
      expect(afterStatus.ipFailures).toBe(0);
      expect(afterStatus.idFailures).toBe(0);
    });
  });

  describe("rateLimitResponse", () => {
    it("returns 429 with Retry-After header", () => {
      const res = rateLimitResponse("ip_rate_limited", 60);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("60");
    });

    it("includes reason-specific message", async () => {
      const res = rateLimitResponse("ip_banned", 3600);
      const body = await res.json();
      expect(body.error).toBe("rate_limited");
      expect(body.code).toBe("ip_banned");
      expect(body.message).toContain("banned");
    });

    it("uses 429 for rate limit, not 401", () => {
      const res = rateLimitResponse("identity_rate_limited", 60);
      expect(res.status).toBe(429);
    });
  });

  describe("Edge cases", () => {
    it("handles unknown IP/identity gracefully", async () => {
      const status = await getAuthRateLimitStatus("0.0.0.0", "nobody@nowhere.test");
      expect(status.ipBanned).toBe(false);
      expect(status.accountLocked).toBe(false);
      expect(status.ipAttempts).toBe(0);
    });

    it("prevents bcrypt CPU exhaustion attack", async () => {
      // Simulate 1000 login attempts from same IP — should be blocked pre-bcrypt
      const ip = "198.51.100.99";
      const email = "dos-attack@example.com";
      let blockedCount = 0;
      for (let i = 0; i < 1000; i++) {
        const r = await canAttemptAuth(ip, email);
        if (!r.allowed) blockedCount++;
      }
      // Should have blocked ~990 of the 1000 attempts (only first 10 allowed)
      expect(blockedCount).toBeGreaterThan(900);
    });
  });
});
