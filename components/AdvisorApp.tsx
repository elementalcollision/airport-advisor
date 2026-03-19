"use client";

import { useState, useEffect, useCallback } from "react";
import { AirportCode, UserInputs, WaitTimeResult } from "@/lib/types";
import type { AggregatedAirportData } from "@/lib/data-sources/types";
import { airports } from "@/lib/airports";
import { calculateWaitTime } from "@/lib/calculator";
import InputPanel from "./InputPanel";
import ResultPanel from "./ResultPanel";

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDefaultHour(): number {
  const h = new Date().getHours();
  return Math.min(h + 3, 23);
}

export default function AdvisorApp() {
  const [inputs, setInputs] = useState<UserInputs>({
    airport: "BOS",
    departureDate: getTodayString(),
    departureHour: getDefaultHour(),
    departureMinute: 0,
    credentialId: "standard",
    additionalFactors: [],
  });

  const [aggregatedData, setAggregatedData] = useState<AggregatedAirportData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);

  const config = airports[inputs.airport];

  // Fetch aggregated data from unified endpoint
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/airport/${inputs.airport}`);
      if (res.ok) {
        const data: AggregatedAirportData = await res.json();
        setAggregatedData(data);
        setLastRefresh(new Date());
        // Live if we got wait time data with any confidence
        setIsLiveData(
          data.waitTime.estimateMinutes != null && data.waitTime.confidence > 0,
        );
      } else {
        setIsLiveData(false);
      }
    } catch {
      setIsLiveData(false);
    }
  }, [inputs.airport]);

  // Fetch on mount and airport change, refresh every 5 minutes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Reset credential when switching airports
  const handleAirportChange = (code: AirportCode) => {
    setInputs((prev) => ({
      ...prev,
      airport: code,
      credentialId: "standard",
      additionalFactors: [],
    }));
    setAggregatedData(null);
    setIsLiveData(false);
  };

  // Calculate result using live wait estimate if available
  const liveWaitMinutes = isLiveData
    ? aggregatedData?.waitTime.estimateMinutes ?? null
    : null;

  const result: WaitTimeResult = calculateWaitTime(
    inputs,
    config,
    liveWaitMinutes,
    aggregatedData?.weather ?? undefined,
    aggregatedData?.delays ?? undefined,
  );

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const departureDate = new Date(inputs.departureDate + "T12:00:00");

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-accent-orange font-mono">{inputs.airport}</span>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-wider uppercase">
                Security Wait Advisor
              </h1>
              <div className="text-xs text-text-muted">
                {dayNames[departureDate.getDay()]}, {monthNames[departureDate.getMonth()]}{" "}
                {departureDate.getDate()}, {departureDate.getFullYear()}
                {result.activeEvents.length > 0 && (
                  <span className="text-accent-red ml-2">
                    {result.activeEvents[0].badge} {result.activeEvents[0].name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {result.riskLevel !== "LOW" && (
            <div
              className={`text-xs font-bold tracking-wider ${
                result.riskLevel === "HIGH" ? "text-accent-red" : "text-accent-orange"
              }`}
            >
              ● {result.riskLevel === "HIGH" ? "ELEVATED ALERT" : "MODERATE TRAFFIC"}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        <InputPanel
          airport={inputs.airport}
          config={config}
          departureDate={inputs.departureDate}
          departureHour={inputs.departureHour}
          departureMinute={inputs.departureMinute}
          credentialId={inputs.credentialId}
          additionalFactors={inputs.additionalFactors}
          selectedTerminal={inputs.terminal}
          activeEvents={result.activeEvents}
          onAirportChange={handleAirportChange}
          onDateChange={(date) => setInputs((prev) => ({ ...prev, departureDate: date }))}
          onHourChange={(hour) => setInputs((prev) => ({ ...prev, departureHour: hour }))}
          onMinuteChange={(minute) => setInputs((prev) => ({ ...prev, departureMinute: minute }))}
          onCredentialChange={(id) => setInputs((prev) => ({ ...prev, credentialId: id }))}
          onTerminalChange={(terminal) => setInputs((prev) => ({ ...prev, terminal }))}
          onFactorToggle={(id) =>
            setInputs((prev) => ({
              ...prev,
              additionalFactors: prev.additionalFactors.includes(id)
                ? prev.additionalFactors.filter((f) => f !== id)
                : [...prev.additionalFactors, id],
            }))
          }
        />

        <div className="flex-1 border-l border-border">
          <ResultPanel
            result={result}
            config={config}
            inputs={inputs}
            lastRefresh={lastRefresh}
            isLiveData={isLiveData}
            weather={aggregatedData?.weather ?? null}
            delays={aggregatedData?.delays ?? null}
            sourceStatuses={aggregatedData?.sources ?? []}
            liveCheckpoints={aggregatedData?.waitTime.checkpoints ?? []}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
