import type { DataProvider } from "../provider";
import type { DataSourceResult } from "../types";
import type { AirportCode } from "../../types";

export const tsaWaitTimesProvider: DataProvider = {
  name: "TSAWaitTimes",
  airports: ["BOS"],

  async fetchData(airport: AirportCode): Promise<DataSourceResult | null> {
    try {
      const res = await fetch(
        `https://www.tsawaittimes.com/api/airport/${airport}/json`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) return null;

      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) return null;

      const checkpoints = raw.map((entry: Record<string, unknown>) => ({
        name: (entry.CheckpointIndex as string) ?? "Unknown",
        waitMinutes:
          typeof entry.WaitTime === "number" ? entry.WaitTime : null,
        preCheckMinutes:
          typeof entry.PreCheckWaitTime === "number"
            ? entry.PreCheckWaitTime
            : null,
      }));

      return {
        source: "TSAWaitTimes",
        airport,
        timestamp: new Date().toISOString(),
        waitData: { checkpoints },
        confidence: 0.8,
        ttlSeconds: 300,
      };
    } catch {
      return null;
    }
  },
};
