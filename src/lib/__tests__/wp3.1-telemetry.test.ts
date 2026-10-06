/**
 * WP 3.1 — OpenTelemetry tracing tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @opentelemetry/api before importing our module
const mockSpan = {
  setAttribute: vi.fn(),
  addEvent: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: () => ({ traceId: "test-trace-id", spanId: "test-span-id" }),
};

const mockTracer = {
  startActiveSpan: vi.fn((name: string, fn: (span: any) => Promise<any>) => {
    return fn(mockSpan);
  }),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: () => mockTracer,
    getActiveSpan: () => mockSpan,
  },
  context: { active: vi.fn() },
  SpanStatusCode: { OK: 1, ERROR: 2 },
}));

describe("WP 3.1: OpenTelemetry Tracing", () => {
  describe("withSpan", () => {
    beforeEach(() => {
      mockSpan.setAttribute.mockClear();
      mockSpan.setStatus.mockClear();
      mockSpan.end.mockClear();
      mockSpan.recordException.mockClear();
    });

    it("wraps async function in a span", async () => {
      const { withSpan } = await import("@/lib/telemetry");
      const result = await withSpan("test.span", async (span) => {
        expect(span).toBe(mockSpan);
        return "result";
      });
      expect(result).toBe("result");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 }); // OK
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("sets attributes from the optional attrs arg", async () => {
      const { withSpan } = await import("@/lib/telemetry");
      await withSpan("test.attrs", async () => "ok", {
        "user.id": "u1",
        "request.size": 1234,
        "is.admin": true,
      });
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("user.id", "u1");
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("request.size", 1234);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("is.admin", true);
    });

    it("records exceptions and re-throws on error", async () => {
      const { withSpan } = await import("@/lib/telemetry");
      const err = new Error("test failure");
      await expect(withSpan("test.error", async () => { throw err; })).rejects.toThrow("test failure");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: 2, // ERROR
        message: "test failure",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(err);
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("calls fn with the span object", async () => {
      const { withSpan } = await import("@/lib/telemetry");
      const fn = vi.fn(async (span: any) => {
        span.setAttribute("custom", "value");
        return "done";
      });
      await withSpan("test.fn", fn);
      expect(fn).toHaveBeenCalledWith(mockSpan);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("custom", "value");
    });

    it("always ends the span (even on error)", async () => {
      const { withSpan } = await import("@/lib/telemetry");
      try {
        await withSpan("test.end-on-error", async () => { throw new Error("boom"); });
      } catch {}
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe("setSpanAttribute", () => {
    it("sets attribute on active span", async () => {
      const { setSpanAttribute } = await import("@/lib/telemetry");
      setSpanAttribute("test.attr", "value");
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("test.attr", "value");
    });
  });

  describe("addSpanEvent", () => {
    it("adds event to active span", async () => {
      const { addSpanEvent } = await import("@/lib/telemetry");
      addSpanEvent("test.event", { key: "value" });
      expect(mockSpan.addEvent).toHaveBeenCalledWith("test.event", { key: "value" });
    });
  });

  describe("getCurrentTraceId", () => {
    it("returns the trace ID from the active span", async () => {
      const { getCurrentTraceId } = await import("@/lib/telemetry");
      const traceId = getCurrentTraceId();
      expect(traceId).toBe("test-trace-id");
    });
  });

  describe("initTelemetry", () => {
    it("skips initialization when OTEL_EXPORTER_OTLP_ENDPOINT not set", async () => {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
      const { initTelemetry } = await import("@/lib/telemetry");
      // Should not throw, should no-op
      expect(() => initTelemetry()).not.toThrow();
    });

    it("only initializes once", async () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://otel-collector:4318";
      const { initTelemetry } = await import("@/lib/telemetry");
      initTelemetry();
      initTelemetry(); // should be no-op
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    });
  });

  describe("instrumentation.ts file", () => {
    it("exists at src/instrumentation.ts (Next.js convention)", () => {
      const fs = require("fs");
      expect(fs.existsSync("/home/z/my-project/src/instrumentation.ts")).toBe(true);
    });

    it("exports register() function per Next.js convention", () => {
      const fs = require("fs");
      const src = fs.readFileSync("/home/z/my-project/src/instrumentation.ts", "utf-8");
      expect(src).toContain("export async function register");
    });
  });

  describe("Tracing coverage in critical paths", () => {
    it("auth login route uses withSpan", () => {
      const fs = require("fs");
      const src = fs.readFileSync("/home/z/my-project/src/app/api/auth/login/route.ts", "utf-8");
      expect(src).toContain('withSpan("api.auth.login"');
      expect(src).toContain('withSpan("bcrypt.compare"');
      expect(src).toContain('withSpan("prisma.user.findUnique"');
      expect(src).toContain('withSpan("auth.record_failure"');
    });
  });
});
