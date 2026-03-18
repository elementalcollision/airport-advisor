import { NextResponse } from "next/server";
import { LiveWaitData } from "@/lib/types";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    // Try TSA wait times API
    const data = await fetchTSAWaitTimes();
    if (data) return NextResponse.json(data);

    // Fallback: return null data so client uses heuristics
    return NextResponse.json(
      { timestamp: new Date().toISOString(), checkpoints: [], source: "heuristic" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { timestamp: new Date().toISOString(), checkpoints: [], source: "heuristic" },
      { status: 200 },
    );
  }
}

async function fetchTSAWaitTimes(): Promise<LiveWaitData | null> {
  // TSA MyTSA endpoint for BOS
  // Note: This endpoint may require an API key in production.
  // For now, we attempt the public endpoint and fall back gracefully.
  try {
    const res = await fetch(
      "https://www.tsawaittimes.com/api/airport/BOS/json",
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const raw = await res.json();

    // TSAWaitTimes API returns an array of checkpoint entries
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const checkpoints = raw.map((entry: Record<string, unknown>) => ({
      name: (entry.CheckpointIndex as string) ?? "Unknown",
      waitMinutes: typeof entry.WaitTime === "number" ? entry.WaitTime : null,
      preCheckMinutes: typeof entry.PreCheckWaitTime === "number" ? entry.PreCheckWaitTime : null,
    }));

    return {
      timestamp: new Date().toISOString(),
      checkpoints,
      source: "TSAWaitTimes.com",
    };
  } catch {
    return null;
  }
}
