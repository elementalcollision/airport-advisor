import type { DataProvider } from "../provider";
import type { DataSourceResult, DelayData } from "../types";
import type { AirportCode } from "../../types";

/**
 * FAA NAS Status provider.
 *
 * Fetches airport status from the FAA's public API.
 * Only covers US airports (BOS).
 */
export const faaStatusProvider: DataProvider = {
  name: "FAA",
  airports: ["BOS"],

  async fetchData(airport: AirportCode): Promise<DataSourceResult | null> {
    try {
      // FAA Airport Status API
      const res = await fetch(
        `https://nasstatus.faa.gov/api/airport-status-information`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) return null;

      const data = await res.json();

      // The response contains airport_list with status info
      const delayData = parseNASStatus(data, airport);

      return {
        source: "FAA",
        airport,
        timestamp: new Date().toISOString(),
        delayData,
        confidence: 0.95,
        ttlSeconds: 300,
      };
    } catch {
      // Try the legacy endpoint as fallback
      return fetchLegacyFAAStatus(airport);
    }
  },
};

function parseNASStatus(
  data: Record<string, unknown>,
  airport: AirportCode,
): DelayData {
  const delayData: DelayData = {
    groundStop: false,
    groundDelay: false,
    arrivalDelay: null,
    departureDelay: null,
    reason: null,
    program: null,
  };

  try {
    // Parse various response formats the FAA API may return
    // Format 1: airport_list array
    const airports = (data.airport_list ?? data.Airport_Status_Information) as
      | Array<Record<string, unknown>>
      | undefined;

    if (Array.isArray(airports)) {
      for (const entry of airports) {
        const arpt = (entry.arpt ?? entry.IATA ?? entry.airport) as string;
        if (arpt !== airport) continue;

        // Ground stops
        if (entry.ground_stop || entry.GroundStop) {
          delayData.groundStop = true;
          delayData.program = "GS";
          delayData.reason = (entry.ground_stop_reason ?? entry.Reason ?? "") as string;
        }

        // Ground delays
        if (entry.ground_delay || entry.GroundDelay) {
          delayData.groundDelay = true;
          delayData.program = delayData.program ? `${delayData.program}, GDP` : "GDP";
          delayData.reason =
            delayData.reason ||
            ((entry.ground_delay_reason ?? entry.Reason ?? "") as string);
        }

        // Arrival/departure delays
        if (entry.arrival_delay || entry.ArrivalDelay) {
          const delay = entry.arrival_delay ?? entry.ArrivalDelay;
          delayData.arrivalDelay =
            typeof delay === "object" && delay !== null
              ? ((delay as Record<string, unknown>).max as string) ?? "delays reported"
              : String(delay);
        }
        if (entry.departure_delay || entry.DepartureDelay) {
          const delay = entry.departure_delay ?? entry.DepartureDelay;
          delayData.departureDelay =
            typeof delay === "object" && delay !== null
              ? ((delay as Record<string, unknown>).max as string) ?? "delays reported"
              : String(delay);
        }

        // Reason
        if (!delayData.reason && entry.reason) {
          delayData.reason = String(entry.reason);
        }
      }
    }

    // Format 2: Flat structure with delay_count or similar
    if (
      typeof data.delay_count === "number" &&
      (data.delay_count as number) > 0
    ) {
      const delays = data.delays as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(delays)) {
        for (const delay of delays) {
          const arpt = delay.airport as string;
          if (arpt !== airport) continue;

          const type = (delay.type ?? delay.program) as string;
          if (type === "Ground Stop" || type === "GS") {
            delayData.groundStop = true;
            delayData.program = "GS";
          } else if (
            type === "Ground Delay Program" ||
            type === "GDP"
          ) {
            delayData.groundDelay = true;
            delayData.program = "GDP";
          }
          delayData.reason = (delay.reason ?? delay.Reason ?? delayData.reason) as string;
        }
      }
    }
  } catch {
    // Return default no-delay state on parse error
  }

  return delayData;
}

async function fetchLegacyFAAStatus(
  airport: AirportCode,
): Promise<DataSourceResult | null> {
  try {
    // Legacy XML/text endpoint
    const res = await fetch(
      `https://soa.smext.faa.gov/asws/api/airport/status/${airport}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const data = await res.json();

    const delayData: DelayData = {
      groundStop: false,
      groundDelay: false,
      arrivalDelay: null,
      departureDelay: null,
      reason: null,
      program: null,
    };

    // Parse legacy format
    if (data.delay === true || data.delay === "true") {
      const status = data.status as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(status)) {
        for (const s of status) {
          const type = (s.Type ?? s.type) as string;
          const reason = (s.Reason ?? s.reason) as string;

          if (type?.includes("Ground Stop")) {
            delayData.groundStop = true;
            delayData.program = "GS";
          } else if (type?.includes("Ground Delay")) {
            delayData.groundDelay = true;
            delayData.program = "GDP";
          } else if (type?.includes("Departure")) {
            delayData.departureDelay = (s.avgDelay ?? s.maxDelay ?? "delays reported") as string;
          } else if (type?.includes("Arrival")) {
            delayData.arrivalDelay = (s.avgDelay ?? s.maxDelay ?? "delays reported") as string;
          }

          if (reason && !delayData.reason) {
            delayData.reason = reason;
          }
        }
      }
    }

    return {
      source: "FAA",
      airport,
      timestamp: new Date().toISOString(),
      delayData,
      confidence: 0.95,
      ttlSeconds: 300,
    };
  } catch {
    return null;
  }
}
