import { AirportConfig } from "../types";

export const bosConfig: AirportConfig = {
  code: "BOS",
  name: "Boston Logan International Airport",
  city: "Boston",
  timezone: "America/New_York",
  terminals: [
    {
      id: "A",
      name: "Terminal A",
      airlines: ["Delta"],
      checkpoints: [
        { name: "Main Checkpoint", terminal: "A", description: "Second floor beyond ticketing" },
        { name: "Delta Central", terminal: "A", description: "Central checkpoint for Delta" },
        { name: "Delta East", terminal: "A", description: "East end checkpoint for Delta" },
      ],
    },
    {
      id: "B",
      name: "Terminal B",
      airlines: ["American", "United", "Air Canada", "Spirit"],
      checkpoints: [
        { name: "East Checkpoint", terminal: "B", description: "East side of Terminal B" },
        { name: "West Checkpoint", terminal: "B", description: "West side of Terminal B" },
      ],
    },
    {
      id: "C",
      name: "Terminal C",
      airlines: ["JetBlue"],
      checkpoints: [
        { name: "Main Checkpoint", terminal: "C", description: "Second floor checkpoint" },
      ],
    },
    {
      id: "E",
      name: "Terminal E (International)",
      airlines: ["British Airways", "Lufthansa", "Emirates", "Aer Lingus", "TAP", "Icelandair"],
      checkpoints: [
        { name: "Central Checkpoint", terminal: "E", description: "Main international terminal checkpoint" },
        { name: "C-E Connector", terminal: "E", description: "Connector checkpoint for gates E1-E3, 7 lanes with CT scanners" },
      ],
    },
  ],

  credentials: [
    {
      id: "standard",
      label: "No PreCheck or CLEAR",
      description: "Standard lane",
      icon: "👤",
      multiplier: 1.0,
    },
    {
      id: "precheck",
      label: "TSA PreCheck",
      description: "PreCheck only",
      icon: "✅",
      multiplier: 0.35,
    },
    {
      id: "clear",
      label: "CLEAR Plus",
      description: "Terminals A & B only",
      icon: "🔵",
      multiplier: 0.5,
    },
    {
      id: "clear_precheck",
      label: "CLEAR + PreCheck",
      description: "Fastest option",
      icon: "⚡",
      multiplier: 0.25,
    },
  ],

  additionalFactors: [
    { id: "bags", label: "Checking bags", icon: "🧳", minutes: 10 },
    { id: "international", label: "International flight", icon: "🌍", minutes: 15 },
    { id: "rental_car", label: "Returning rental car", icon: "🚗", minutes: 15 },
    { id: "children", label: "Young children in group", icon: "👶", minutes: 10 },
  ],

  seasonalEvents: [
    { name: "Thanksgiving Week", startMonth: 11, startDay: 24, endMonth: 11, endDay: 30, multiplier: 1.6, description: "Heaviest travel period of the year", badge: "🦃" },
    { name: "Christmas/New Year", startMonth: 12, startDay: 20, endMonth: 1, endDay: 3, multiplier: 1.5, description: "Holiday travel surge", badge: "🎄" },
    { name: "Spring Break", startMonth: 3, startDay: 10, endMonth: 4, endDay: 5, multiplier: 1.3, description: "Spring break travel period" },
    { name: "Summer Peak", startMonth: 6, startDay: 15, endMonth: 9, endDay: 5, multiplier: 1.25, description: "Peak summer travel season", badge: "☀️" },
    { name: "Marathon Monday", startMonth: 4, startDay: 20, endMonth: 4, endDay: 22, multiplier: 1.4, description: "Boston Marathon weekend — extra travelers", badge: "🏃" },
    { name: "July 4th Week", startMonth: 7, startDay: 1, endMonth: 7, endDay: 6, multiplier: 1.4, description: "Independence Day travel" },
    { name: "Labor Day Weekend", startMonth: 8, startDay: 29, endMonth: 9, endDay: 2, multiplier: 1.35, description: "End-of-summer travel rush" },
    { name: "Memorial Day Weekend", startMonth: 5, startDay: 23, endMonth: 5, endDay: 27, multiplier: 1.35, description: "Start-of-summer travel rush" },
  ],

  advisories: [
    { type: "info", text: "CLEAR is only available in Terminals A and B. If flying from C or E, CLEAR won't help at security." },
    { type: "info", text: "Terminal E checkpoints now feature CT scanners — you can leave laptops and liquids in your bag." },
    { type: "info", text: "Free shuttle buses connect all terminals landside. Airside connectors link some terminals post-security." },
  ],

  dataSources: [
    { name: "TSA MyTSA", url: "https://www.tsa.gov/travel/passenger-support", description: "Official TSA wait time data" },
    { name: "Massport", url: "https://www.massport.com/logan-airport", description: "Airport authority" },
    { name: "FlightAware", url: "https://flightaware.com", description: "Flight status data" },
    { name: "TSAWaitTimes.com", url: "https://www.tsawaittimes.com/security-wait-times/BOS", description: "Community wait time reports" },
    { name: "@BostonLogan on X", url: "https://x.com/BostonLogan", description: "Official airport social media" },
  ],

  baselineWait: { low: 15, high: 30 },
  gateBuffer: 25,
  bagsBuffer: 10,

  // Peak patterns for BOS: early morning rush (5-8am), afternoon (3-6pm)
  timeOfDayMultipliers: {
    0: 0.3, 1: 0.3, 2: 0.3, 3: 0.4, 4: 0.6,
    5: 1.4, 6: 1.7, 7: 1.6, 8: 1.3, 9: 1.0,
    10: 0.8, 11: 0.8, 12: 0.9, 13: 0.9, 14: 1.0,
    15: 1.3, 16: 1.5, 17: 1.4, 18: 1.2, 19: 1.0,
    20: 0.7, 21: 0.6, 22: 0.5, 23: 0.4,
  },

  dayOfWeekMultipliers: {
    0: 0.85,  // Sunday
    1: 1.1,   // Monday
    2: 0.9,   // Tuesday
    3: 0.9,   // Wednesday
    4: 1.05,  // Thursday
    5: 1.15,  // Friday
    6: 0.8,   // Saturday
  },
};
