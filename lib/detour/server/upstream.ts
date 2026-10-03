export const USER_AGENT = "WorthTheDetour/1.0 (+https://4ship.ca)";

export type UpstreamErrorCode =
  | "timeout"
  | "network"
  | "http_status"
  | "too_large"
  | "redirect_blocked"
  | "unexpected_content"
  | "invalid_json";

export class UpstreamError extends Error {
  readonly code: UpstreamErrorCode;
  readonly status?: number;

  constructor(code: UpstreamErrorCode, message: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.code = code;
    this.status = status;
  }
}

export type FetchOptions = {
  /** Total time for every redirect hop and the body. */
  timeoutMs: number;
  /** Maximum decoded body size in bytes. */
  maxBytes: number;
  /** Exact host names the request and any redirect may reach. */
  allowedHosts: readonly string[];
  maxRedirects?: number;
  accept?: string;
  /** Accepted Content-Type prefixes; omitted means any. */
  contentTypes?: readonly string[];
};

export type FetchedText = { text: string; url: string; status: number; headers: Headers };

function assertAllowed(url: URL, allowedHosts: readonly string[]): void {
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) {
    throw new UpstreamError("redirect_blocked", `Refusing to contact ${url.protocol}//${url.hostname}`);
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new UpstreamError("too_large", "Response exceeds the size limit");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new UpstreamError("too_large", "Response exceeds the size limit");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/**
 * Fetches a URL with a total timeout, a body size cap and redirects followed
 * manually so every hop is checked against the host allowlist.
 */
export async function fetchText(input: string, options: FetchOptions): Promise<FetchedText> {
  const signal = AbortSignal.timeout(options.timeoutMs);
  const maxRedirects = options.maxRedirects ?? 3;
  let url = new URL(input);
  try {
    for (let hop = 0; ; hop++) {
      assertAllowed(url, options.allowedHosts);
      const response = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: options.accept ?? "*/*" },
        redirect: "manual",
        signal,
      });
      if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
        await response.body?.cancel();
        if (hop >= maxRedirects) throw new UpstreamError("redirect_blocked", "Too many redirects");
        url = new URL(response.headers.get("location") ?? "", url);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new UpstreamError("http_status", `Source responded with HTTP ${response.status}`, response.status);
      }
      const type = (response.headers.get("content-type") ?? "").toLowerCase();
      if (options.contentTypes && !options.contentTypes.some((allowed) => type.startsWith(allowed))) {
        await response.body?.cancel();
        throw new UpstreamError("unexpected_content", `Unexpected content type ${type || "(none)"}`);
      }
      const text = await readCapped(response, options.maxBytes);
      return { text, url: url.toString(), status: response.status, headers: response.headers };
    }
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (isAbort(error) || signal.aborted) throw new UpstreamError("timeout", "Source did not respond in time");
    throw new UpstreamError("network", "Source could not be reached");
  }
}

export async function fetchJson(input: string, options: FetchOptions): Promise<{ data: unknown; headers: Headers }> {
  const { text, headers } = await fetchText(input, { accept: "application/json", ...options });
  try {
    return { data: JSON.parse(text) as unknown, headers };
  } catch {
    throw new UpstreamError("invalid_json", "Source returned malformed data");
  }
}
