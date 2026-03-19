import type { DataProvider } from "../provider";
import type { DataSourceResult, FlightCategory, WeatherData } from "../types";
import type { AirportCode } from "../../types";

/** Map airport codes to ICAO identifiers for METAR lookups */
const ICAO_MAP: Record<AirportCode, string> = {
  BOS: "KBOS",
  DUB: "EIDW",
};

/** Determine flight category from ceiling and visibility */
function classifyFlightCategory(
  ceilingFt: number | null,
  visibilitySm: number,
): FlightCategory {
  const ceil = ceilingFt ?? 99999;
  if (visibilitySm < 1 || ceil < 500) return "LIFR";
  if (visibilitySm < 3 || ceil < 1000) return "IFR";
  if (visibilitySm < 5 || ceil < 3000) return "MVFR";
  return "VFR";
}

/** Extract precipitation type from weather phenomena string */
function parsePrecipitation(wxString: string | null | undefined): {
  hasPrecipitation: boolean;
  precipitationType: string | null;
} {
  if (!wxString) return { hasPrecipitation: false, precipitationType: null };

  const wx = wxString.toUpperCase();
  if (wx.includes("TS")) return { hasPrecipitation: true, precipitationType: "thunderstorm" };
  if (wx.includes("SN") || wx.includes("SG") || wx.includes("IC") || wx.includes("PL"))
    return { hasPrecipitation: true, precipitationType: "snow" };
  if (wx.includes("RA") || wx.includes("DZ"))
    return { hasPrecipitation: true, precipitationType: "rain" };
  if (wx.includes("FZ")) return { hasPrecipitation: true, precipitationType: "freezing" };
  if (wx.includes("BR") || wx.includes("FG"))
    return { hasPrecipitation: false, precipitationType: null }; // mist/fog, not precipitation
  return { hasPrecipitation: false, precipitationType: null };
}

/** Find lowest broken or overcast ceiling from cloud layers */
function findCeiling(
  clouds: Array<{ cover?: string; base?: number }> | undefined,
): number | null {
  if (!clouds || clouds.length === 0) return null;
  for (const layer of clouds) {
    if (
      layer.cover === "BKN" ||
      layer.cover === "OVC" ||
      layer.cover === "VV"
    ) {
      return layer.base ?? null;
    }
  }
  return null;
}

export const aviationWeatherProvider: DataProvider = {
  name: "AviationWeather",
  airports: ["BOS", "DUB"],

  async fetchData(airport: AirportCode): Promise<DataSourceResult | null> {
    const icao = ICAO_MAP[airport];
    if (!icao) return null;

    try {
      const res = await fetch(
        `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const metar = data[0];
      const ceilingFt = findCeiling(metar.clouds);
      const visibilitySm =
        typeof metar.visib === "number" ? metar.visib : 10;
      const { hasPrecipitation, precipitationType } = parsePrecipitation(
        metar.wxString,
      );

      const weatherData: WeatherData = {
        rawMetar: metar.rawOb ?? "",
        conditions: classifyFlightCategory(ceilingFt, visibilitySm),
        windSpeedKt: typeof metar.wspd === "number" ? metar.wspd : 0,
        windGustKt: typeof metar.wgst === "number" ? metar.wgst : null,
        windDirection: typeof metar.wdir === "number" ? metar.wdir : null,
        visibilitySm,
        ceilingFt,
        tempC: typeof metar.temp === "number" ? metar.temp : null,
        dewpointC: typeof metar.dewp === "number" ? metar.dewp : null,
        altimeterInHg:
          typeof metar.altim === "number"
            ? Math.round(metar.altim * 0.02953 * 100) / 100 // hPa to inHg
            : null,
        hasPrecipitation,
        precipitationType,
        observationTime: metar.reportTime ?? new Date().toISOString(),
      };

      return {
        source: "AviationWeather",
        airport,
        timestamp: new Date().toISOString(),
        weatherData,
        confidence: 0.95,
        ttlSeconds: 600, // METARs update roughly every hour
      };
    } catch {
      return null;
    }
  },
};
