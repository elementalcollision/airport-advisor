import type { AirportCode } from "../types";
import type { DataSourceResult } from "./types";

/** Interface that all data providers implement */
export interface DataProvider {
  /** Human-readable name for this provider */
  name: string;

  /** Which airports this provider supports */
  airports: AirportCode[];

  /** Fetch data for the given airport. Returns null on failure. */
  fetchData(airport: AirportCode): Promise<DataSourceResult | null>;
}
