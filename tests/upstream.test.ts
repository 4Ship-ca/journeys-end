import { describe, expect, it } from "vitest";
import { fetchJson, fetchText, UpstreamError, USER_AGENT } from "../lib/detour/server/upstream";
import { hangUntilAborted, html, json, mockFetch } from "./helpers";

const base = { timeoutMs: 1_000, maxBytes: 1_000, allowedHosts: ["example.org", "www.example.org"] };

async function rejection(promise: Promise<unknown>): Promise<UpstreamError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof UpstreamError) return error;
    throw error;
  }
  throw new Error("Expected the request to fail");
}

describe("fetchText", () => {
  it("returns the body and identifies the project", async () => {
    const fetchMock = mockFetch({ "example.org": () => html("<p>hello</p>") });
    const result = await fetchText("https://example.org/page", base);
    expect(result.text).toBe("<p>hello</p>");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe(USER_AGENT);
    expect(init.redirect).toBe("manual");
  });

  it("follows redirects within the allowlist", async () => {
    mockFetch({
      "example.org": () => new Response(null, { status: 301, headers: { location: "https://www.example.org/next" } }),
      "www.example.org": (url) => html(`at ${url.pathname}`),
    });
    const result = await fetchText("https://example.org/start", base);
    expect(result.text).toBe("at /next");
    expect(result.url).toBe("https://www.example.org/next");
  });

  it("refuses redirects to other hosts or to plain HTTP", async () => {
    mockFetch({ "example.org": () => new Response(null, { status: 302, headers: { location: "https://169.254.169.254/" } }) });
    expect((await rejection(fetchText("https://example.org/", base))).code).toBe("redirect_blocked");
    mockFetch({ "example.org": () => new Response(null, { status: 302, headers: { location: "http://example.org/" } }) });
    expect((await rejection(fetchText("https://example.org/", base))).code).toBe("redirect_blocked");
  });

  it("refuses a starting URL outside the allowlist", async () => {
    const fetchMock = mockFetch({});
    expect((await rejection(fetchText("https://elsewhere.test/", base))).code).toBe("redirect_blocked");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops after too many redirects", async () => {
    mockFetch({ "example.org": () => new Response(null, { status: 302, headers: { location: "/again" } }) });
    expect((await rejection(fetchText("https://example.org/", { ...base, maxRedirects: 2 }))).code).toBe("redirect_blocked");
  });

  it("reports HTTP errors with their status", async () => {
    mockFetch({ "example.org": () => html("nope", { status: 503 }) });
    const error = await rejection(fetchText("https://example.org/", base));
    expect(error.code).toBe("http_status");
    expect(error.status).toBe(503);
  });

  it("enforces the size cap from the declared length and while streaming", async () => {
    mockFetch({ "example.org": () => html("x".repeat(10), { headers: { "content-length": "5000" } }) });
    expect((await rejection(fetchText("https://example.org/", base))).code).toBe("too_large");
    mockFetch({ "example.org": () => html("x".repeat(5000)) });
    expect((await rejection(fetchText("https://example.org/", base))).code).toBe("too_large");
  });

  it("rejects unexpected content types when restricted", async () => {
    mockFetch({ "example.org": () => new Response("%PDF", { headers: { "content-type": "application/pdf" } }) });
    expect((await rejection(fetchText("https://example.org/", { ...base, contentTypes: ["text/html"] }))).code).toBe(
      "unexpected_content",
    );
  });

  it("times out slow sources", async () => {
    mockFetch({ "example.org": hangUntilAborted });
    expect((await rejection(fetchText("https://example.org/", { ...base, timeoutMs: 30 }))).code).toBe("timeout");
  });

  it("reports network failures", async () => {
    mockFetch({
      "example.org": () => {
        throw new TypeError("fetch failed");
      },
    });
    expect((await rejection(fetchText("https://example.org/", base))).code).toBe("network");
  });
});

describe("fetchJson", () => {
  it("parses JSON and rejects malformed bodies", async () => {
    mockFetch({ "example.org": (url) => (url.pathname === "/ok" ? json({ a: 1 }) : html("<html>")) });
    expect((await fetchJson("https://example.org/ok", base)).data).toEqual({ a: 1 });
    expect((await rejection(fetchJson("https://example.org/bad", base))).code).toBe("invalid_json");
  });
});
