/*
  Retry helper for transient upstream failures.

  Google's APIs occasionally return 429/5xx under sustained write load, and
  network hiccups surface as connection errors. Those are safe to retry for
  idempotent operations (e.g. setting a contact photo), so a single flaky
  response doesn't silently drop a contact.

  Retries use exponential backoff, honouring a numeric `Retry-After` header
  when the server sends one. Delays are capped so a pathological header can't
  stall a sync for minutes.
*/

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EPIPE",
]);

export interface RetryOptions {
  /** Total number of attempts, including the first one. Defaults to 5. */
  attempts?: number;
  /** Delay before the first retry; doubles on each subsequent one. Defaults to 1s. */
  baseDelayMs?: number;
  /** Upper bound for any single delay. Defaults to 8s. */
  maxDelayMs?: number;
  /** Optional callback for logging, called before each retry. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Overridable for tests; defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Whether an error represents a transient failure worth retrying.
 *
 * Treats HTTP 429 and 5xx as transient, as well as common socket-level errors.
 * Everything else (auth failures, malformed requests, programming errors) is
 * surfaced immediately.
 */
export function isTransientError(error: any): boolean {
  const status = error?.response?.status ?? error?.code;
  if (typeof status === "number") {
    return status === 429 || (status >= 500 && status <= 599);
  }

  const code = error?.code ?? error?.cause?.code;
  return typeof code === "string" && NETWORK_ERROR_CODES.has(code);
}

function retryAfterMs(error: any): number | undefined {
  const headers = error?.response?.headers;
  const value =
    typeof headers?.get === "function"
      ? headers.get("retry-after")
      : headers?.["retry-after"];
  if (value === undefined || value === null) return undefined;

  // Google sends integer seconds. HTTP-date form is intentionally ignored.
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

/**
 * Run `operation`, retrying transient failures with exponential backoff.
 * Rethrows the last error once attempts are exhausted (or immediately for
 * non-transient failures).
 */
export async function retryTransient<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 8000;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= attempts || !isTransientError(error)) {
        throw error;
      }

      const backoffMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delayMs = Math.min(maxDelayMs, retryAfterMs(error) ?? backoffMs);
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }
}
