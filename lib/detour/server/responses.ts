import type { ApiError } from "../api";

export function jsonError(
  status: number,
  error: ApiError,
  extra: Record<string, unknown> = {},
): Response {
  return Response.json(
    { ...extra, error, checkedAt: new Date().toISOString() },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonOk(body: unknown, cacheControl: string): Response {
  return Response.json(body, { headers: { "Cache-Control": cacheControl } });
}
