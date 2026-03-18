import { AirportConfig } from "../types";

// Additional DUB-specific types
export interface DubPreclearanceConfig {
  baselineWait: { low: number; high: number };
  timeOfDayMultipliers: Record<number, number>;
  advisories: string[];
}

export const dubPreclearance: DubPreclearanceConfig = {
  baselineWait: { low: 15, high: 35 },
  timeOfDayMultipliers: {
    0: 0.3, 1: 0.3, 2: 0.3, 3: 0.3, 4: 0.4,
    5: 0.5, 6: 0.7, 7: 0.8, 8: 1.0, 9: 1.3,
    10: 1.5, 11: 1.4, 12: 1.2, 13: 1.0, 14: 1.1,
    15: 1.3, 16: 1.2, 17: 1.0, 18: 0.8, 19: 0.6,
    20: 0.5, 21: 0.4, 22: 0.3, 23: 0.3,
  },
  advisories: [
    "US Preclearance is located in Terminal 2. You clear US Customs & Border Protection in Dublin — no immigration queues on arrival in the US.",
    "Preclearance opens approximately 3.5 hours before the first US-bound departure.",
    "Allow extra time during morning peaks (9-11am) when multiple US flights depart.",
  ],
};

export const dubConfig: AirportConfig = {
  code: "DUB",
  name: "Dublin Airport",
  city: "Dublin",
  timezone: "Europe/Dublin",
  terminals: [
    {
      id: "T1",
      name: "Terminal 1",
      airlines: ["Ryanair", "Lufthansa", "KLM", "Air France", "Turkish Airlines", "Norwegian"],
      checkpoints: [
        { name: "Terminal 1 Security", terminal: "T1", description: "Central screening area — opens 3:00 AM" },
      ],
    },
    {
      id: "T2",
      name: "Terminal 2",
      airlines: ["Aer Lingus", "American Airlines", "Delta", "United", "Emirates", "Etihad"],
      checkpoints: [
        { name: "Terminal 2 Security", terminal: "T2", description: "Equipped with C3 advanced scanners — opens 3:30 AM" },
        { name: "US Preclearance", terminal: "T2", description: "CBP screening for US-bound passengers" },
      ],
    },
  ],

  credentials: [
    {
      id: "standard",
      label: "Standard Lane",
      description: "Regular security queue",
      icon: "👤",
      multiplier: 1.0,
    },
    {
      id: "fast_track",
      label: "Fast Track",
      description: "€7.99–€13.99, pre-book online",
      icon: "⚡",
      multiplier: 0.4,
    },
  ],

  additionalFactors: [
    { id: "bags", label: "Checking bags", icon: "🧳", minutes: 10 },
    { id: "us_bound", label: "US-bound flight (Preclearance)", icon: "🇺🇸", minutes: 0 }, // handled separately
    { id: "children", label: "Young children in group", icon: "👶", minutes: 10 },
    { id: "oversized", label: "Oversized / sports equipment", icon: "🎿", minutes: 15 },
  ],

  seasonalEvents: [
    { name: "Christmas/New Year", startMonth: 12, startDay: 18, endMonth: 1, endDay: 5, multiplier: 1.5, description: "Holiday travel surge — extra flights to US & UK", badge: "🎄" },
    { name: "St. Patrick's Week", startMonth: 3, startDay: 14, endMonth: 3, endDay: 20, multiplier: 1.4, description: "Paddy's week travel — heavy inbound & outbound", badge: "☘️" },
    { name: "Easter Break", startMonth: 4, startDay: 5, endMonth: 4, endDay: 20, multiplier: 1.3, description: "School holiday travel period" },
    { name: "June Bank Holiday", startMonth: 5, startDay: 30, endMonth: 6, endDay: 3, multiplier: 1.25, description: "Bank holiday weekend getaways" },
    { name: "Summer Peak", startMonth: 6, startDay: 20, endMonth: 9, endDay: 1, multiplier: 1.3, description: "Peak summer season — busiest time of year", badge: "☀️" },
    { name: "October Midterm", startMonth: 10, startDay: 25, endMonth: 11, endDay: 2, multiplier: 1.2, description: "School midterm break" },
    { name: "August Bank Holiday", startMonth: 8, startDay: 1, endMonth: 8, endDay: 5, multiplier: 1.3, description: "Bank holiday weekend" },
  ],

  advisories: [
    { type: "info", text: "Terminal 2 has new C3 scanners — laptops and liquids can stay in your bag (containers up to 2 litres allowed)." },
    { type: "info", text: "Fast Track can be pre-booked online. T1: 4:00 AM–9:00 PM, T2: 4:00 AM–6:00 PM." },
    { type: "info", text: "Inter-terminal transfer takes ~10 minutes on foot via the covered walkway." },
  ],

  dataSources: [
    { name: "Dublin Airport", url: "https://www.dublinairport.com", description: "Official airport — live queue times" },
    { name: "DAA Security", url: "https://www.dublinairport.com/at-the-airport/security", description: "Security info & queue data" },
    { name: "@DublinAirport on X", url: "https://x.com/DublinAirport", description: "Official airport social media" },
    { name: "FlightQueue", url: "https://flightqueue.com/airport/DUB", description: "Third-party wait time aggregator" },
    { name: "EIDW Times", url: "https://eidwtimes.xyz", description: "AI-projected queue forecasts" },
  ],

  baselineWait: { low: 10, high: 25 },
  gateBuffer: 20,
  bagsBuffer: 10,

  // DUB peak patterns: early morning (5-8am), afternoon (3-5pm)
  timeOfDayMultipliers: {
    0: 0.3, 1: 0.3, 2: 0.3, 3: 0.5, 4: 0.7,
    5: 1.5, 6: 1.7, 7: 1.5, 8: 1.2, 9: 1.0,
    10: 0.9, 11: 0.8, 12: 0.8, 13: 0.9, 14: 1.0,
    15: 1.3, 16: 1.4, 17: 1.2, 18: 1.0, 19: 0.7,
    20: 0.5, 21: 0.4, 22: 0.3, 23: 0.3,
  },

  dayOfWeekMultipliers: {
    0: 0.9,   // Sunday
    1: 1.05,  // Monday
    2: 0.85,  // Tuesday
    3: 0.85,  // Wednesday
    4: 1.0,   // Thursday
    5: 1.15,  // Friday
    6: 0.9,   // Saturday
  },
};
