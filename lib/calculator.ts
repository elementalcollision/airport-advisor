import { AirportConfig, Advisory, SeasonalEvent, UserInputs, WaitTimeResult } from "./types";
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

  const totalLow = securityWaitLow + otherBuffers;
  const totalHigh = securityWaitHigh + otherBuffers;

  // Recommended arrival (using high estimate for safety)
  const departureTime = new Date(departureDate + "T00:00:00");
  departureTime.setHours(departureHour, departureMinute, 0, 0);
  const recommendedArrival = new Date(departureTime.getTime() - totalHigh * 60 * 1000);

  // Risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (securityWaitHigh >= 45 || seasonalMultiplier >= 1.4) {
    riskLevel = "HIGH";
  } else if (securityWaitHigh >= 25 || seasonalMultiplier >= 1.2) {
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
    securityWaitLow,
    securityWaitHigh,
    otherBuffers,
    totalLow,
    totalHigh,
    recommendedArrival,
    riskLevel,
    advisories,
    activeEvents,
  };
}
