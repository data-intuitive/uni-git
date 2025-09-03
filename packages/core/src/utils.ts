/**
 * Sleep for the specified number of milliseconds
 */
/**
 * Sleep for the specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    jitter = true,
    shouldRetry = (error: unknown) => {
      // Retry on network errors and 5xx errors, but not on 4xx errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        return status >= 500 || status === 429; // 429 = rate limit
      }
      return true; // Retry by default for unknown errors
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sanitize sensitive information from logs
 */
export function sanitizeForLogging(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof key === "string" && isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
}

/**
 * Check if a key might contain sensitive information
 */
function isSensitiveKey(key: string): boolean {
  const sensitivePatterns = [
    /token/i,
    /password/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /bearer/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(key));
}

/**
 * Type guard for authentication configurations
 */
export function isGitHubAuth(auth: unknown): auth is import("./types.js").GitHubAuth {
  return (
    typeof auth === "object" &&
    auth !== null &&
    "kind" in auth &&
    (auth.kind === "token" || auth.kind === "app" || auth.kind === "oauth")
  );
}

/**
 * Type guard for GitLab authentication
 */
export function isGitLabAuth(auth: unknown): auth is import("./types.js").GitLabAuth {
  return (
    typeof auth === "object" &&
    auth !== null &&
    "kind" in auth &&
    (auth.kind === "token" || auth.kind === "oauth" || auth.kind === "job")
  );
}

/**
 * Type guard for Bitbucket authentication
 */
export function isBitbucketAuth(auth: unknown): auth is import("./types.js").BitbucketAuth {
  return (
    typeof auth === "object" &&
    auth !== null &&
    "kind" in auth &&
    (auth.kind === "basic" || auth.kind === "oauth")
  );
}
