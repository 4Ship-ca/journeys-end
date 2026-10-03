import type { ForecastPoint } from "./weather";

/** Every non-2xx API response carries this shape under `error`. */
export type ApiError = { code: string; message: string };

export type ResearchResult = {
  title: string;
  url: string;
  type: "Internet Archive" | "Background · Wikipedia";
  year?: number;
};

export type SourceStatus = { name: string; status: "ok" | "unavailable"; count: number };

export type DiscoverResponse = {
  query: string;
  results: ResearchResult[];
  sources: SourceStatus[];
  partial: boolean;
  cached: boolean;
  checkedAt: string;
};

export type AnniversaryEvent = { year: number; text: string; url: string };

export type AnniversaryResponse = {
  day: string;
  events: AnniversaryEvent[];
  source: string;
  sourceUrl: string;
  cached: boolean;
  checkedAt: string;
};

export type WeatherReport = {
  /** "stale" means the latest refresh failed and an older retrieval is shown. */
  state: "current" | "stale";
  /** Model run time reported by MET Norway. */
  updatedAt: string | null;
  /** When this service retrieved the forecast. */
  fetchedAt: string;
  points: ForecastPoint[];
};

export type ConditionsResponse = {
  id: string;
  checkedAt: string;
  cached: boolean;
  source: string;
  sourceFetched: boolean;
  /** Always "unconfirmed": a fetched page is not proof of opening. */
  access: "unconfirmed";
  notices: string[];
  noticeScope: string;
  timeZone: string;
  weather: WeatherReport | null;
  weatherError: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isHttpsUrl(value: unknown): value is string {
  return isString(value) && /^https:\/\//i.test(value);
}

export function readApiError(body: unknown): ApiError | null {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const { code, message } = body.error;
  return isString(code) && isString(message) ? { code, message } : null;
}

function isResearchResult(value: unknown): value is ResearchResult {
  return (
    isRecord(value) &&
    isString(value.title) &&
    isHttpsUrl(value.url) &&
    (value.type === "Internet Archive" || value.type === "Background · Wikipedia") &&
    (value.year === undefined || typeof value.year === "number")
  );
}

function isSourceStatus(value: unknown): value is SourceStatus {
  return (
    isRecord(value) &&
    isString(value.name) &&
    (value.status === "ok" || value.status === "unavailable") &&
    typeof value.count === "number"
  );
}

export function isDiscoverResponse(body: unknown): body is DiscoverResponse {
  return (
    isRecord(body) &&
    isString(body.query) &&
    Array.isArray(body.results) &&
    body.results.every(isResearchResult) &&
    Array.isArray(body.sources) &&
    body.sources.every(isSourceStatus) &&
    typeof body.partial === "boolean" &&
    isString(body.checkedAt)
  );
}

function isAnniversaryEvent(value: unknown): value is AnniversaryEvent {
  return isRecord(value) && Number.isInteger(value.year) && isString(value.text) && isHttpsUrl(value.url);
}

export function isAnniversaryResponse(body: unknown): body is AnniversaryResponse {
  return (
    isRecord(body) &&
    isString(body.day) &&
    Array.isArray(body.events) &&
    body.events.every(isAnniversaryEvent) &&
    isString(body.checkedAt)
  );
}

function isForecastPoint(value: unknown): value is ForecastPoint {
  return (
    isRecord(value) &&
    isString(value.time) &&
    typeof value.temp === "number" &&
    typeof value.wind === "number" &&
    isString(value.symbol)
  );
}

function isWeatherReport(value: unknown): value is WeatherReport {
  return (
    isRecord(value) &&
    (value.state === "current" || value.state === "stale") &&
    (value.updatedAt === null || isString(value.updatedAt)) &&
    isString(value.fetchedAt) &&
    Array.isArray(value.points) &&
    value.points.every(isForecastPoint)
  );
}

export function isConditionsResponse(body: unknown): body is ConditionsResponse {
  return (
    isRecord(body) &&
    isString(body.id) &&
    isString(body.checkedAt) &&
    isHttpsUrl(body.source) &&
    typeof body.sourceFetched === "boolean" &&
    body.access === "unconfirmed" &&
    Array.isArray(body.notices) &&
    body.notices.every(isString) &&
    isString(body.timeZone) &&
    (body.weather === null || isWeatherReport(body.weather)) &&
    (body.weatherError === null || isString(body.weatherError))
  );
}
