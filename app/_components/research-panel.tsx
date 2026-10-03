"use client";

import { ExternalLink as ExternalIcon, RefreshCw } from "lucide-react";
import { isDiscoverResponse, readApiError } from "../../lib/detour/api";
import type { RemoteState } from "./hooks";
import { ExternalLink } from "./links";

export function ResearchPanel({
  query,
  state,
  onRefresh,
}: {
  query: string;
  state: RemoteState;
  onRefresh: () => void;
}) {
  const busy = state.status === "loading";
  const data = state.status === "done" && state.ok && isDiscoverResponse(state.body) ? state.body : null;
  const error =
    state.status === "failed"
      ? "Live research is unavailable. You can still open the source searches below."
      : state.status === "done" && !data
        ? (readApiError(state.body)?.message ?? "Live research returned an unexpected response.")
        : null;

  return (
    <section className="research" aria-labelledby="research-heading" aria-busy={busy}>
      <div className="research-heading">
        <h3 id="research-heading">Follow the sources</h3>
        {query && (
          <button type="button" className="text-button" onClick={onRefresh} disabled={busy}>
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </button>
        )}
      </div>
      <p className="small">
        Live discovery leads for “{query}”, not verified conclusions. Check original sources and reuse rights.
      </p>
      <div aria-live="polite">
        {busy ? (
          <div className="loader" role="status">
            Looking through the archives and background sources…
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : data && data.results.length ? (
          <>
            <ul className="results">
              {data.results.map((result) => (
                <li key={result.url}>
                  <ExternalLink href={result.url} className="result">
                    <span>
                      {result.type}
                      {result.year ? ` · ${result.year}` : ""}
                    </span>
                    {result.title} <ExternalIcon size={12} aria-hidden="true" />
                  </ExternalLink>
                </li>
              ))}
            </ul>
            <p className="small">
              Retrieved {new Date(data.checkedAt).toLocaleString()}
              {data.cached ? " · from a recent search" : ""}
              {data.partial
                ? ` · ${data.sources
                    .filter((source) => source.status === "unavailable")
                    .map((source) => source.name)
                    .join(" and ")} did not respond.`
                : ""}
            </p>
          </>
        ) : data ? (
          <p className="small">No results returned from the available sources. Try a broader subject.</p>
        ) : null}
      </div>
      <div className="actions research-actions">
        <ExternalLink className="secondary" href={`https://archive.org/search?query=${encodeURIComponent(query)}`}>
          Search Internet Archive <ExternalIcon size={13} aria-hidden="true" />
        </ExternalLink>
        <ExternalLink className="secondary" href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}>
          Broaden the search <ExternalIcon size={13} aria-hidden="true" />
        </ExternalLink>
      </div>
    </section>
  );
}
