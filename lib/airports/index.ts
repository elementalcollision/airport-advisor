import { AirportCode, AirportConfig } from "../types";
import { bosConfig } from "./bos";
import { dubConfig } from "./dub";

export const airports: Record<AirportCode, AirportConfig> = {
  BOS: bosConfig,
  DUB: dubConfig,
};

export { bosConfig, dubConfig };
export { dubPreclearance } from "./dub";
