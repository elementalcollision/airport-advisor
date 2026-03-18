export type AirportCode = "BOS" | "DUB";

export interface CredentialOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  multiplier: number; // applied to base security wait
}

export interface AdditionalFactor {
  id: string;
  label: string;
  icon: string;
  minutes: number; // extra minutes added
}

export interface CheckpointInfo {
  name: string;
  terminal: string;
  description: string;
}

export interface Terminal {
  id: string;
  name: string;
  airlines: string[];
  checkpoints: CheckpointInfo[];
}

export interface SeasonalEvent {
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  multiplier: number;
  description: string;
  badge?: string;
}

export interface Advisory {
  type: "success" | "info" | "warning";
  text: string;
}

export interface DataSource {
  name: string;
  url?: string;
  description: string;
}

export interface AirportConfig {
  code: AirportCode;
  name: string;
  city: string;
  timezone: string;
  terminals: Terminal[];
  credentials: CredentialOption[];
  additionalFactors: AdditionalFactor[];
  seasonalEvents: SeasonalEvent[];
  advisories: Advisory[]; // static advisories
  dataSources: DataSource[];
  baselineWait: {
    low: number;  // minutes
    high: number; // minutes
  };
  gateBuffer: number; // minutes
  bagsBuffer: number; // minutes
  // Time-of-day multipliers: key is hour (0-23)
  timeOfDayMultipliers: Record<number, number>;
  // Day-of-week multipliers: 0=Sun, 6=Sat
  dayOfWeekMultipliers: Record<number, number>;
}

export interface WaitTimeResult {
  securityWaitLow: number;
  securityWaitHigh: number;
  otherBuffers: number;
  totalLow: number;
  totalHigh: number;
  recommendedArrival: Date;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  advisories: Advisory[];
  activeEvents: SeasonalEvent[];
}

export interface LiveWaitData {
  timestamp: string;
  checkpoints: {
    name: string;
    waitMinutes: number | null;
    preCheckMinutes: number | null;
  }[];
  source: string;
}

export interface UserInputs {
  airport: AirportCode;
  departureDate: string; // YYYY-MM-DD
  departureHour: number;
  departureMinute: number;
  credentialId: string;
  additionalFactors: string[];
  terminal?: string;
}
