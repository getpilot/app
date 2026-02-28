import type { AxiosError } from "axios";

export type InstagramErrorCode =
  | "token_expired"
  | "rate_limited"
  | "network_error"
  | "api_error";

export class InstagramApiError extends Error {
  readonly code: InstagramErrorCode;
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  readonly data?: unknown;

  constructor(
    message: string,
    options: {
      code: InstagramErrorCode;
      status?: number;
      retryAfterSeconds?: number;
      data?: unknown;
    },
  ) {
    super(message);
    this.name = "InstagramApiError";
    this.code = options.code;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.data = options.data;
  }
}

export function parseRetryAfterSeconds(input: {
  headers?: Record<string, unknown>;
  data?: unknown;
}): number | null {
  const rawHeader = input.headers?.["retry-after"];
  if (typeof rawHeader === "string") {
    const n = Number.parseInt(rawHeader, 10);
    if (!Number.isNaN(n)) return n;
  }

  if (
    input.data &&
    typeof input.data === "object" &&
    "retry_after" in (input.data as Record<string, unknown>) &&
    typeof (input.data as Record<string, unknown>).retry_after === "number"
  ) {
    return (input.data as Record<string, unknown>).retry_after as number;
  }

  return null;
}

export function normalizeInstagramAxiosError(error: unknown): InstagramApiError {
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;
  const headers = (axiosError.response?.headers ??
    {}) as Record<string, unknown>;
  const retryAfterSeconds = parseRetryAfterSeconds({ headers, data });

  if (status === 401) {
    return new InstagramApiError(
      "Instagram token expired. Please reconnect your Instagram account.",
      {
        code: "token_expired",
        status,
        retryAfterSeconds: retryAfterSeconds ?? undefined,
        data,
      },
    );
  }

  if (status === 429) {
    return new InstagramApiError("Instagram API rate limit hit.", {
      code: "rate_limited",
      status,
      retryAfterSeconds: retryAfterSeconds ?? undefined,
      data,
    });
  }

  if (status) {
    return new InstagramApiError(`Instagram API request failed (${status}).`, {
      code: "api_error",
      status,
      retryAfterSeconds: retryAfterSeconds ?? undefined,
      data,
    });
  }

  return new InstagramApiError("Instagram network request failed.", {
    code: "network_error",
    data: axiosError.message,
  });
}
