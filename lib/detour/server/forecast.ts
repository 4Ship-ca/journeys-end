import type { ForecastPoint } from "../weather";

export const MAX_FORECAST_POINTS = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function symbolOf(data: Record<string, unknown>): string {
  for (const period of ["next_1_hours", "next_6_hours", "next_12_hours"]) {
    const block = data[period];
    if (isRecord(block) && isRecord(block.summary) && typeof block.summary.symbol_code === "string") {
      return /^[a-z_]{1,60}$/.test(block.summary.symbol_code) ? block.summary.symbol_code : "";
    }
  }
  return "";
}

/** Extracts validated forecast points from a MET Norway locationforecast/compact document. */
export function parseForecast(data: unknown): { updatedAt: string | null; points: ForecastPoint[] } {
  const properties = isRecord(data) && isRecord(data.properties) ? data.properties : undefined;
  const meta = properties && isRecord(properties.meta) ? properties.meta : undefined;
  const updatedAt =
    meta && typeof meta.updated_at === "string" && !Number.isNaN(Date.parse(meta.updated_at)) ? meta.updated_at : null;
  const series = properties && Array.isArray(properties.timeseries) ? properties.timeseries : [];
  const points: ForecastPoint[] = [];
  for (const step of series) {
    if (!isRecord(step) || typeof step.time !== "string" || Number.isNaN(Date.parse(step.time))) continue;
    const stepData = isRecord(step.data) ? step.data : undefined;
    const instant = stepData && isRecord(stepData.instant) && isRecord(stepData.instant.details) ? stepData.instant.details : undefined;
    if (!stepData || !instant) continue;
    const temp = instant.air_temperature;
    const wind = instant.wind_speed;
    if (typeof temp !== "number" || !Number.isFinite(temp) || typeof wind !== "number" || !Number.isFinite(wind)) continue;
    points.push({ time: new Date(step.time).toISOString(), temp, wind: Math.round(wind * 3.6), symbol: symbolOf(stepData) });
    if (points.length >= MAX_FORECAST_POINTS) break;
  }
  return { updatedAt, points };
}
