"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isKnownId } from "../data";
import { localIsoDate } from "../../lib/detour/dates";
import {
  EMPTY_JOURNEY,
  JOURNEY_STORAGE_KEY,
  parseJourney,
  serializeJourney,
  type JourneyState,
} from "../../lib/detour/journey";

/* ---------- Location (URL) state ---------- */

const NAVIGATE_EVENT = "detour:navigate";

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

/** The current location search string. The server render uses the request's search string. */
export function useLocationSearch(serverSearch: string): string {
  return useSyncExternalStore(
    subscribeToLocation,
    () => window.location.search,
    () => serverSearch,
  );
}

/** Client-side navigation that keeps a real, shareable URL and back-button history. */
export function navigate(href: string, options: { replace?: boolean } = {}): void {
  const url = new URL(href, window.location.href);
  const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
  if (samePage && url.hash === window.location.hash) return;
  const next = url.pathname + url.search + url.hash;
  if (options.replace) window.history.replaceState(null, "", next);
  else window.history.pushState(null, "", next);
  if (samePage) {
    // Only the fragment changed: no view change follows, so reveal the target here.
    const target = url.hash ? document.getElementById(url.hash.slice(1)) : null;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    return;
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/* ---------- Today's date ---------- */

function subscribeToDay(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/** The visitor's local date as YYYY-MM-DD, or "" while rendering on the server. */
export function useToday(): string {
  return useSyncExternalStore(subscribeToDay, () => localIsoDate(), () => "");
}

/* ---------- Journey storage ---------- */

const journeyListeners = new Set<() => void>();
let storageMode: "local" | "memory" = "local";
let memoryValue: string | null = null;

function readJourneyRaw(): string | null {
  if (storageMode === "memory") return memoryValue;
  try {
    return window.localStorage.getItem(JOURNEY_STORAGE_KEY);
  } catch {
    storageMode = "memory";
    return memoryValue;
  }
}

function writeJourneyRaw(value: string): void {
  if (storageMode === "local") {
    try {
      window.localStorage.setItem(JOURNEY_STORAGE_KEY, value);
    } catch {
      storageMode = "memory";
    }
  }
  if (storageMode === "memory") memoryValue = value;
  journeyListeners.forEach((listener) => listener());
}

function subscribeToJourney(onChange: () => void): () => void {
  journeyListeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === JOURNEY_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    journeyListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export type JourneyStore = {
  journey: JourneyState;
  /** False when the browser refused storage; the journey then lasts only for this page view. */
  persistent: boolean;
  update: (change: (current: JourneyState) => JourneyState) => void;
};

/** A device-local journey that stays in sync across tabs. Server renders an empty journey. */
export function useJourney(): JourneyStore {
  const raw = useSyncExternalStore(subscribeToJourney, readJourneyRaw, () => null);
  const persistent = useSyncExternalStore(
    subscribeToJourney,
    () => storageMode === "local",
    () => true,
  );
  const journey = useMemo(() => (raw === null ? EMPTY_JOURNEY : parseJourney(raw, isKnownId)), [raw]);
  const update = useCallback((change: (current: JourneyState) => JourneyState) => {
    const current = parseJourney(readJourneyRaw(), isKnownId);
    const next = change(current);
    if (next !== current) writeJourneyRaw(serializeJourney(next));
  }, []);
  return { journey, persistent, update };
}

/* ---------- Remote JSON ---------- */

export type RemoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; ok: boolean; httpStatus: number; body: unknown }
  | { status: "failed" };

/**
 * Fetches JSON whenever `url` or `refreshKey` changes. Earlier requests are
 * aborted, so a slow response can never overwrite a newer one.
 */
export function useRemoteJson(url: string | null, refreshKey = 0): RemoteState {
  const key = url === null ? null : `${refreshKey}|${url}`;
  const [settled, setSettled] = useState<{ key: string; state: RemoteState } | null>(null);

  useEffect(() => {
    if (url === null || key === null) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        setSettled({ key, state: { status: "done", ok: response.ok, httpStatus: response.status, body } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSettled({ key, state: { status: "failed" } });
      });
    return () => controller.abort();
  }, [url, key]);

  if (key === null) return { status: "idle" };
  if (!settled || settled.key !== key) return { status: "loading" };
  return settled.state;
}

/* ---------- Toast ---------- */

export function useToast(durationMs = 2800): { message: string; show: (message: string) => void } {
  const [toast, setToast] = useState<{ message: string; id: number }>({ message: "", id: 0 });
  useEffect(() => {
    if (!toast.message) return;
    const timer = window.setTimeout(() => setToast((current) => (current.id === toast.id ? { ...current, message: "" } : current)), durationMs);
    return () => window.clearTimeout(timer);
  }, [toast, durationMs]);
  const show = useCallback((message: string) => setToast((current) => ({ message, id: current.id + 1 })), []);
  return { message: toast.message, show };
}

/** True when the visitor prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
