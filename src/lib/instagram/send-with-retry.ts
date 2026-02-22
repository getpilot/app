export type SendResult = {
  status: number;
  data?: unknown;
};

export type SendFn = () => Promise<SendResult>;

export type RetryResult = SendResult & { attempts: number };

const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

/**
 * Retry wrapper for Instagram API sends.
 *
 * - Up to `maxRetries` attempts with exponential backoff.
 * - Respects `Retry-After` on 429 responses.
 * - Logs structured events for every retry/failure.
 *
 * NOTE: Only use this in async contexts (Inngest functions).
 * Do NOT use inline in the webhook handler — it blocks the response.
 */
export async function sendWithRetry(
  fn: SendFn,
  context: { action: string; recipientId?: string; threadId?: string },
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<RetryResult> {
  let lastResult: SendResult = { status: 0 };
  let retriedAfter429 = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      lastResult = await fn();

      // Success
      if (lastResult.status >= 200 && lastResult.status < 300) {
        if (attempt > 1) {
          console.log("send.success", {
            ...context,
            attempt,
            retriedAfter429,
          });
        }
        return { ...lastResult, attempts: attempt };
      }

      // 429 Rate Limited → respect Retry-After header
      if (lastResult.status === 429) {
        retriedAfter429 = true;
        const retryAfter = parseRetryAfter(
          lastResult.data as Record<string, unknown> | undefined,
        );
        const delayMs = retryAfter
          ? retryAfter * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt - 1);

        console.error("send.rate_limited", {
          ...context,
          attempt,
          retryAfterSeconds: retryAfter,
          delayMs,
        });

        await sleep(delayMs);
        continue;
      }

      // Other non-success → exponential backoff
      console.log("send.retrying", {
        ...context,
        attempt,
        status: lastResult.status,
        delayMs: BASE_DELAY_MS * Math.pow(2, attempt - 1),
      });

      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    } catch (error) {
      console.error("send.error", {
        ...context,
        attempt,
        error: error instanceof Error ? error.message : "unknown",
      });

      if (attempt === maxRetries) {
        return { status: 0, data: undefined, attempts: attempt };
      }

      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  // All retries exhausted
  console.error("send.failed", {
    ...context,
    finalStatus: lastResult.status,
    maxRetries,
    retriedAfter429,
  });

  return { ...lastResult, attempts: maxRetries };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(
  data: Record<string, unknown> | undefined,
): number | null {
  if (!data) return null;
  const val =
    (data as Record<string, unknown>)?.["retry_after"] ??
    (data as Record<string, unknown>)?.["Retry-After"];
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  }
  return null;
}