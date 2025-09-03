/**
 * Base error class for all provider errors
 */
export class ProviderError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ProviderError";
    this.cause = cause;
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends ProviderError {
  constructor(message = "Resource not found", cause?: unknown) {
    super(message, cause);
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends ProviderError {
  constructor(message = "Authentication failed", cause?: unknown) {
    super(message, cause);
    this.name = "AuthError";
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends ProviderError {
  public readonly resetAt: Date | undefined;

  constructor(resetAt?: Date, cause?: unknown) {
    super("Rate limit exceeded", cause);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends ProviderError {
  constructor(message = "Network request failed", cause?: unknown) {
    super(message, cause);
    this.name = "NetworkError";
  }
}

/**
 * Error thrown when the provider configuration is invalid
 */
export class ConfigurationError extends ProviderError {
  constructor(message = "Invalid provider configuration", cause?: unknown) {
    super(message, cause);
    this.name = "ConfigurationError";
  }
}
