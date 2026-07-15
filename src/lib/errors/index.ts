/**
 * Error Handling & Resilience
 * ---------------------------
 * Standardized error types, error codes, and resilience patterns.
 */

export type ErrorCode =
  | "AR001" // Authentication required
  | "AR002" // Invalid credentials
  | "AR003" // Token expired
  | "AR004" // Forbidden (RBAC)
  | "AR005" // Resource not found
  | "AR006" // Validation error
  | "AR007" // Rate limit exceeded
  | "AR008" // Conflict (duplicate)
  | "AR009" // External service error
  | "AR010" // Database error
  | "AR011" // File storage error
  | "AR012" // Encryption error
  | "AR013" // KMS error
  | "AR014" // Email send error
  | "AR015" // GST/TDS generation error
  | "AR016" // Core banking sync error
  | "AR017" // AI advisor error
  | "AR500" // Internal server error
  ;

export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  AR001: "Authentication required",
  AR002: "Invalid credentials",
  AR003: "Token expired — please re-authenticate",
  AR004: "Insufficient permissions for this action",
  AR005: "Resource not found",
  AR006: "Input validation failed",
  AR007: "Rate limit exceeded — please slow down",
  AR008: "Resource already exists",
  AR009: "External service error — please retry",
  AR010: "Database error — please retry",
  AR011: "File storage error",
  AR012: "Encryption error — data not saved",
  AR013: "Key management service error",
  AR014: "Email delivery failed",
  AR015: "Tax filing generation error",
  AR016: "Core banking sync error",
  AR017: "AI advisor unavailable",
  AR500: "Internal server error",
};

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
  correlationId?: string;

  constructor(code: ErrorCode, message?: string, statusCode?: number, details?: any) {
    super(message || ERROR_CODE_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode || this.getDefaultStatusCode(code);
    this.details = details;
    this.correlationId = generateCorrelationId();
  }

  private getDefaultStatusCode(code: ErrorCode): number {
    switch (code) {
      case "AR001": case "AR003": return 401;
      case "AR002": return 401;
      case "AR004": return 403;
      case "AR005": return 404;
      case "AR006": return 422;
      case "AR007": return 429;
      case "AR008": return 409;
      case "AR500": return 500;
      default: return 500;
    }
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        correlationId: this.correlationId,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

function generateCorrelationId(): string {
  return `ar-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Circuit breaker for external services.
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = "half-open";
      } else {
        throw new AppError("AR009", `${this.name} circuit breaker is open — service unavailable`);
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      this.state = "closed";
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = "open";
      }

      throw err;
    }
  }

  getState() {
    return { name: this.name, state: this.state, failures: this.failures };
  }
}

/**
 * Retry with exponential backoff.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
