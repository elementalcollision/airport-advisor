import { AirportConfig, Advisory, SeasonalEvent, UserInputs, WaitTimeResult } from "./types";
import type { WeatherData, DelayData } from "./data-sources/types";
import { dubPreclearance } from "./airports/dub";

function isDateInRange(
  month: number,
  day: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const dateVal = month * 100 + day;
  const startVal = startMonth * 100 + startDay;
  const endVal = endMonth * 100 + endDay;

  if (startVal <= endVal) {
    return dateVal >= startVal && dateVal <= endVal;
  }
  // Wraps around year boundary (e.g., Dec 20 – Jan 5)
  return dateVal >= startVal || dateVal <= endVal;
}

function getActiveEvents(config: AirportConfig, month: number, day: number): SeasonalEvent[] {
  return config.seasonalEvents.filter((event) =>
    isDateInRange(month, day, event.startMonth, event.startDay, event.endMonth, event.endDay),
  );
}

function getTimeOfDayAdvisory(hour: number, config: AirportConfig): Advisory | null {
  const mult = config.timeOfDayMultipliers[hour] ?? 1.0;
  if (mult <= 0.6) {
    return {
      type: "success",
      text: "You're in a quiet window — security lines are typically short right now.",
    };
  }
  if (mult >= 1.5) {
    return {
      type: "warning",
      text: "This is a peak travel hour — expect longer queues and plan accordingly.",
    };
  }
  if (mult >= 1.2) {
    return {
      type: "info",
      text: "Moderate traffic expected at this time. Lines may build periodically.",
    };
  }
  return null;
}

export function calculateWaitTime(
  inputs: UserInputs,
  config: AirportConfig,
  liveWaitMinutes?: number | null,
  weather?: WeatherData,
  delays?: DelayData,
): WaitTimeResult {
  const { departureHour, departureMinute, credentialId, additionalFactors, departureDate } = inputs;

  const date = new Date(departureDate + "T12:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Find credential multiplier
  const credential = config.credentials.find((c) => c.id === credentialId);
  const credMultiplier = credential?.multiplier ?? 1.0;

  // Time-of-day and day-of-week multipliers
  const todMultiplier = config.timeOfDayMultipliers[departureHour] ?? 1.0;
  const dowMultiplier = config.dayOfWeekMultipliers[dayOfWeek] ?? 1.0;

  // Seasonal events
  const activeEvents = getActiveEvents(config, month, day);
  const seasonalMultiplier = activeEvents.reduce((acc, e) => Math.max(acc, e.multiplier), 1.0);

  // Calculate security wait range
  let baseLow: number;
  let baseHigh: number;

  if (liveWaitMinutes != null && liveWaitMinutes > 0) {
    // Use live data as anchor, but still apply credential multiplier
    baseLow = liveWaitMinutes * 0.8;
    baseHigh = liveWaitMinutes * 1.2;
  } else {
    // Heuristic calculation
    baseLow = config.baselineWait.low * todMultiplier * dowMultiplier * seasonalMultiplier;
    baseHigh = config.baselineWait.high * todMultiplier * dowMultiplier * seasonalMultiplier;
  }

  const securityWaitLow = Math.round(baseLow * credMultiplier);
  const securityWaitHigh = Math.round(baseHigh * credMultiplier);

  // Additional factor minutes
  const extraMinutes = additionalFactors.reduce((total, factorId) => {
    if (factorId === "us_bound") return total; // handled separately
    const factor = config.additionalFactors.find((f) => f.id === factorId);
    return total + (factor?.minutes ?? 0);
  }, 0);

  // Buffers
  let otherBuffers = config.gateBuffer + extraMinutes;
  if (additionalFactors.includes("bags")) {
    otherBuffers += config.bagsBuffer;
  }

  // US Preclearance for DUB
  let preclearanceMinutes = 0;
  if (config.code === "DUB" && additionalFactors.includes("us_bound")) {
    const precMult = dubPreclearance.timeOfDayMultipliers[departureHour] ?? 1.0;
    preclearanceMinutes = Math.round(
      ((dubPreclearance.baselineWait.low + dubPreclearance.baselineWait.high) / 2) * precMult,
    );
    otherBuffers += preclearanceMinutes;
  }

  // Weather impact: bad conditions cause flight delays → crowded terminals
  let weatherMultiplier = 1.0;
  if (weather) {
    if (weather.conditions === "LIFR") {
      weatherMultiplier = 1.2;
    } else if (weather.conditions === "IFR") {
      weatherMultiplier = 1.15;
    } else if (weather.conditions === "MVFR" && weather.hasPrecipitation) {
      weatherMultiplier = 1.1;
    }
    // High winds also cause delays
    if (weather.windSpeedKt >= 30 || (weather.windGustKt ?? 0) >= 40) {
      weatherMultiplier = Math.max(weatherMultiplier, 1.15);
    }
  }

  // Apply weather multiplier to security wait (not to buffers)
  const adjustedSecurityWaitLow = Math.round(securityWaitLow * weatherMultiplier);
  const adjustedSecurityWaitHigh = Math.round(securityWaitHigh * weatherMultiplier);

  const totalLow = adjustedSecurityWaitLow + otherBuffers;
  const totalHigh = adjustedSecurityWaitHigh + otherBuffers;

  // Recommended arrival (using high estimate for safety)
  const departureTime = new Date(departureDate + "T00:00:00");
  departureTime.setHours(departureHour, departureMinute, 0, 0);
  const recommendedArrival = new Date(departureTime.getTime() - totalHigh * 60 * 1000);

  // Risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  const hasGroundStop = delays?.groundStop ?? false;
  if (adjustedSecurityWaitHigh >= 45 || seasonalMultiplier >= 1.4 || hasGroundStop) {
    riskLevel = "HIGH";
  } else if (adjustedSecurityWaitHigh >= 25 || seasonalMultiplier >= 1.2 || (delays?.groundDelay ?? false)) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  // Build advisories
  const advisories: Advisory[] = [];
  const todAdvisory = getTimeOfDayAdvisory(departureHour, config);
  if (todAdvisory) advisories.push(todAdvisory);

  // Add seasonal advisories
  for (const event of activeEvents) {
    advisories.push({ type: "warning", text: `${event.badge ?? "📅"} ${event.name}: ${event.description}` });
  }

  // Weather advisories
  if (weather) {
    if (weatherMultiplier > 1.0) {
      const weatherDesc =
        weather.conditions === "LIFR"
          ? "Very low visibility/ceiling"
          : weather.conditions === "IFR"
            ? "Low visibility/ceiling (IFR conditions)"
            : weather.hasPrecipitation
              ? `${weather.precipitationType ? weather.precipitationType.charAt(0).toUpperCase() + weather.precipitationType.slice(1) : "Precipitation"} with reduced visibility`
              : "Gusty winds";
      advisories.push({
        type: "warning",
        text: `${weatherDesc} — weather may cause flight delays, increasing terminal congestion.`,
      });
    }
  }

  // FAA delay advisories
  if (delays) {
    if (delays.groundStop) {
      advisories.push({
        type: "warning",
        text: `Ground Stop in effect${delays.reason ? ` (${delays.reason})` : ""}. Flights are not departing — check with your airline before heading to the airport.`,
      });
    }
    if (delays.groundDelay) {
      advisories.push({
        type: "warning",
        text: `Ground Delay Program active${delays.reason ? ` (${delays.reason})` : ""}. Expect departure delays.`,
      });
    }
    if (delays.arrivalDelay) {
      advisories.push({
        type: "info",
        text: `Arrival delays: ${delays.arrivalDelay}. Inbound delays may affect gate availability.`,
      });
    }
    if (delays.departureDelay) {
      advisories.push({
        type: "info",
        text: `Departure delays: ${delays.departureDelay}.`,
      });
    }
  }

  // Add preclearance advisories
  if (config.code === "DUB" && additionalFactors.includes("us_bound")) {
    advisories.push({
      type: "info",
      text: `US Preclearance adds ~${preclearanceMinutes} min. You'll clear US immigration in Dublin — walk straight out on arrival in the US.`,
    });
  }

  // Add static advisories from config
  advisories.push(...config.advisories);

  return {
    securityWaitLow: adjustedSecurityWaitLow,
    securityWaitHigh: adjustedSecurityWaitHigh,
    otherBuffers,
    totalLow,
    totalHigh,
    recommendedArrival,
    riskLevel,
    advisories,
    activeEvents,
  };
}
