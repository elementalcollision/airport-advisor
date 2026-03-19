import type { DataProvider } from "../provider";
import type { DataSourceResult, WaitCheckpoint } from "../types";
import type { AirportCode } from "../../types";

export const flightQueueProvider: DataProvider = {
  name: "FlightQueue",
  airports: ["DUB"],

  async fetchData(airport: AirportCode): Promise<DataSourceResult | null> {
    try {
      const res = await fetch(
        `https://flightqueue.com/api/airport/${airport}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) return null;

      const raw = await res.json();
      if (!raw || typeof raw !== "object") return null;

      const checkpoints: WaitCheckpoint[] = [];

      if (raw.terminals && Array.isArray(raw.terminals)) {
        for (const terminal of raw.terminals) {
          checkpoints.push({
            name: terminal.name ?? "Unknown",
            waitMinutes:
              typeof terminal.waitTime === "number"
                ? terminal.waitTime
                : null,
            preCheckMinutes: null, // DUB doesn't have PreCheck
          });
        }
      }

      if (checkpoints.length === 0) return null;

      return {
        source: "FlightQueue",
        airport,
        timestamp: new Date().toISOString(),
        waitData: { checkpoints },
        confidence: 0.7,
        ttlSeconds: 300,
      };
    } catch {
      return null;
    }
  },
};
