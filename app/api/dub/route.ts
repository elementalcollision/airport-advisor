import { NextResponse } from "next/server";
import { LiveWaitData } from "@/lib/types";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    // Try Dublin Airport wait times
    const data = await fetchDublinWaitTimes();
    if (data) return NextResponse.json(data);

    // Fallback
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

async function fetchDublinWaitTimes(): Promise<LiveWaitData | null> {
  // Dublin Airport publishes queue times on their website.
  // The official API endpoint isn't publicly documented, but FlightQueue
  // and similar services aggregate this data.
  // We try the FlightQueue endpoint as a proxy.
  try {
    const res = await fetch(
      "https://flightqueue.com/api/airport/DUB",
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const raw = await res.json();

    if (!raw || typeof raw !== "object") return null;

    // Parse FlightQueue response format
    const checkpoints: LiveWaitData["checkpoints"] = [];

    if (raw.terminals && Array.isArray(raw.terminals)) {
      for (const terminal of raw.terminals) {
        checkpoints.push({
          name: terminal.name ?? "Unknown",
          waitMinutes: typeof terminal.waitTime === "number" ? terminal.waitTime : null,
          preCheckMinutes: null,
        });
      }
    }

    if (checkpoints.length === 0) return null;

    return {
      timestamp: new Date().toISOString(),
      checkpoints,
      source: "FlightQueue",
    };
  } catch {
    return null;
  }
}
