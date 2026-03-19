import { NextResponse } from "next/server";
import type { AirportCode } from "@/lib/types";
import { fetchAggregatedData } from "@/lib/data-sources/aggregator";

export const revalidate = 300; // cache for 5 minutes

const VALID_AIRPORTS: Set<string> = new Set(["BOS", "DUB"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const airport = code.toUpperCase();

  if (!VALID_AIRPORTS.has(airport)) {
    return NextResponse.json(
      { error: `Invalid airport code: ${code}. Supported: BOS, DUB` },
      { status: 400 },
    );
  }

  try {
    const data = await fetchAggregatedData(airport as AirportCode);
    return NextResponse.json(data);
  } catch {
    // Return minimal fallback on total failure
    return NextResponse.json({
      airport,
      timestamp: new Date().toISOString(),
      waitTime: {
        estimateMinutes: null,
        preCheckMinutes: null,
        confidence: 0,
        sources: [],
        checkpoints: [],
      },
      weather: null,
      delays: null,
      sources: [],
    });
  }
}
