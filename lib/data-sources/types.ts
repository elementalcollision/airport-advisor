import type { AirportCode } from "../types";

/** Weather flight category */
export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR";

/** Weather data parsed from METAR */
export interface WeatherData {
  rawMetar: string;
  conditions: FlightCategory;
  windSpeedKt: number;
  windGustKt: number | null;
  windDirection: number | null; // degrees
  visibilitySm: number; // statute miles
  ceilingFt: number | null;
  tempC: number | null;
  dewpointC: number | null;
  altimeterInHg: number | null;
  hasPrecipitation: boolean;
  precipitationType: string | null; // "rain", "snow", "thunderstorm", etc.
  observationTime: string; // ISO timestamp
}

/** FAA/EUROCONTROL delay data */
export interface DelayData {
  groundStop: boolean;
  groundDelay: boolean;
  arrivalDelay: string | null; // e.g. "15-30 minutes"
  departureDelay: string | null;
  reason: string | null;
  program: string | null; // e.g. "GDP", "GS", "AFP"
}

/** Checkpoint wait data from a source */
export interface WaitCheckpoint {
  name: string;
  waitMinutes: number | null;
  preCheckMinutes: number | null;
}

/** Unified result from any single data provider */
export interface DataSourceResult {
  source: string;
  airport: AirportCode;
  timestamp: string; // ISO
  waitData?: {
    checkpoints: WaitCheckpoint[];
  };
  weatherData?: WeatherData;
  delayData?: DelayData;
  confidence: number; // 0.0 to 1.0
  ttlSeconds: number;
}

/** Per-source health status in aggregated output */
export interface SourceStatus {
  name: string;
  status: "ok" | "error" | "timeout" | "no_data";
  ageSeconds: number | null;
  lastError?: string;
}

/** Aggregated output from all providers for one airport */
export interface AggregatedAirportData {
  airport: AirportCode;
  timestamp: string;
  waitTime: {
    estimateMinutes: number | null;
    preCheckMinutes: number | null;
    confidence: number;
    sources: string[];
    checkpoints: WaitCheckpoint[];
  };
  weather: WeatherData | null;
  delays: DelayData | null;
  sources: SourceStatus[];
}
