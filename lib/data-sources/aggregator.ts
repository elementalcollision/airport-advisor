import type { AirportCode } from "../types";
import type {
  AggregatedAirportData,
  DataSourceResult,
  SourceStatus,
  WaitCheckpoint,
} from "./types";
import type { DataProvider } from "./provider";
import { getCached, setCache, getCacheAge } from "./cache";

// Import all providers
import { tsaWaitTimesProvider } from "./providers/tsa-wait-times";
import { flightQueueProvider } from "./providers/flight-queue";
import { aviationWeatherProvider } from "./providers/aviation-weather";
import { faaStatusProvider } from "./providers/faa-status";

/** All registered providers */
const providers: DataProvider[] = [
  tsaWaitTimesProvider,
  flightQueueProvider,
  aviationWeatherProvider,
  faaStatusProvider,
];

/** Timeout for each individual provider fetch (ms) */
const PROVIDER_TIMEOUT_MS = 5000;

/**
 * Fetch data from all relevant providers for an airport,
 * aggregate into a single unified response.
 */
export async function fetchAggregatedData(
  airport: AirportCode,
): Promise<AggregatedAirportData> {
  const relevantProviders = providers.filter((p) =>
    p.airports.includes(airport),
  );

  // Parallel fetch with individual timeouts
  const results = await Promise.allSettled(
    relevantProviders.map(async (provider): Promise<{
      provider: DataProvider;
      result: DataSourceResult | null;
      fromCache: boolean;
    }> => {
      // Check cache first
      const cached = getCached(provider.name, airport);
      if (cached) {
        return { provider, result: cached, fromCache: true };
      }

      try {
        const result = await Promise.race([
          provider.fetchData(airport),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), PROVIDER_TIMEOUT_MS),
          ),
        ]);

        if (result) {
          setCache(provider.name, airport, result);
        }

        return { provider, result, fromCache: false };
      } catch {
        return { provider, result: null, fromCache: false };
      }
    }),
  );

  // Collect successful results and source statuses
  const successfulResults: DataSourceResult[] = [];
  const sources: SourceStatus[] = [];

  for (const settled of results) {
    if (settled.status === "fulfilled") {
      const { provider, result } = settled.value;
      if (result) {
        successfulResults.push(result);
        sources.push({
          name: provider.name,
          status: "ok",
          ageSeconds: getCacheAge(provider.name, airport) ?? 0,
        });
      } else {
        sources.push({
          name: provider.name,
          status: "no_data",
          ageSeconds: null,
        });
      }
    } else {
      // Promise.allSettled should not reject, but handle defensively
      sources.push({
        name: "unknown",
        status: "error",
        ageSeconds: null,
        lastError: settled.reason?.message,
      });
    }
  }

  // Aggregate wait time data using confidence-weighted average
  const waitResults = successfulResults.filter((r) => r.waitData);
  let estimateMinutes: number | null = null;
  let preCheckMinutes: number | null = null;
  let waitConfidence = 0;
  const waitSources: string[] = [];
  const allCheckpoints: WaitCheckpoint[] = [];

  if (waitResults.length > 0) {
    let weightedSum = 0;
    let preCheckWeightedSum = 0;
    let totalWeight = 0;
    let preCheckTotalWeight = 0;

    for (const result of waitResults) {
      const checkpoints = result.waitData!.checkpoints;
      allCheckpoints.push(...checkpoints);

      const validCheckpoints = checkpoints.filter(
        (cp) => cp.waitMinutes != null,
      );
      if (validCheckpoints.length === 0) continue;

      // Average across checkpoints for this source
      const avgWait =
        validCheckpoints.reduce((sum, cp) => sum + cp.waitMinutes!, 0) /
        validCheckpoints.length;

      // Apply staleness penalty
      const ageSeconds = getCacheAge(result.source, result.airport) ?? 0;
      const stalenessPenalty = ageSeconds > result.ttlSeconds ? 0.5 : 1.0;
      const effectiveConfidence = result.confidence * stalenessPenalty;

      weightedSum += avgWait * effectiveConfidence;
      totalWeight += effectiveConfidence;
      waitSources.push(result.source);

      // PreCheck average
      const preCheckCps = checkpoints.filter(
        (cp) => cp.preCheckMinutes != null,
      );
      if (preCheckCps.length > 0) {
        const avgPreCheck =
          preCheckCps.reduce((sum, cp) => sum + cp.preCheckMinutes!, 0) /
          preCheckCps.length;
        preCheckWeightedSum += avgPreCheck * effectiveConfidence;
        preCheckTotalWeight += effectiveConfidence;
      }
    }

    if (totalWeight > 0) {
      estimateMinutes = Math.round(weightedSum / totalWeight);
      waitConfidence = Math.min(
        1,
        waitResults.reduce((max, r) => Math.max(max, r.confidence), 0),
      );
    }
    if (preCheckTotalWeight > 0) {
      preCheckMinutes = Math.round(preCheckWeightedSum / preCheckTotalWeight);
    }
  }

  // Weather: take highest-confidence result
  const weatherResult = successfulResults
    .filter((r) => r.weatherData)
    .sort((a, b) => b.confidence - a.confidence)[0];

  // Delays: take highest-confidence result
  const delayResult = successfulResults
    .filter((r) => r.delayData)
    .sort((a, b) => b.confidence - a.confidence)[0];

  return {
    airport,
    timestamp: new Date().toISOString(),
    waitTime: {
      estimateMinutes,
      preCheckMinutes,
      confidence: waitConfidence,
      sources: waitSources,
      checkpoints: allCheckpoints,
    },
    weather: weatherResult?.weatherData ?? null,
    delays: delayResult?.delayData ?? null,
    sources,
  };
}
