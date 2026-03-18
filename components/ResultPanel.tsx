"use client";

import { AirportConfig, WaitTimeResult, UserInputs } from "@/lib/types";

interface ResultPanelProps {
  result: WaitTimeResult;
  config: AirportConfig;
  inputs: UserInputs;
  lastRefresh: Date | null;
  isLiveData: boolean;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatTimeCompact(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")}  ${ampm}`;
}

export default function ResultPanel({
  result,
  config,
  inputs,
  lastRefresh,
  isLiveData,
}: ResultPanelProps) {
  const riskColors = {
    LOW: "bg-accent-green",
    MEDIUM: "bg-accent-orange",
    HIGH: "bg-accent-red",
  };

  const credential = config.credentials.find((c) => c.id === inputs.credentialId);
  const credentialLabel = credential?.description ?? "Standard";

  const departureDate = new Date(inputs.departureDate + "T00:00:00");
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const preclearanceActive = config.code === "DUB" && inputs.additionalFactors.includes("us_bound");

  return (
    <div className="flex-1 p-5 lg:p-6 space-y-5">
      {/* Recommended Arrival Hero */}
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.15em] text-accent-orange uppercase">
              Recommended Arrival
            </div>
            <div className="text-5xl lg:text-6xl font-mono font-light text-text-primary mt-2 tracking-wide">
              {formatTimeCompact(result.recommendedArrival)}
            </div>
            <div className="text-sm text-text-secondary mt-2">
              for your {formatTime(
                (() => {
                  const d = new Date(inputs.departureDate + "T00:00:00");
                  d.setHours(inputs.departureHour, inputs.departureMinute);
                  return d;
                })(),
              )}{" "}
              departure
            </div>
          </div>
          <span
            className={`${riskColors[result.riskLevel]} text-bg-primary text-xs font-bold px-3 py-1.5 rounded-md tracking-wider`}
          >
            {result.riskLevel} RISK
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
              Security Wait
            </div>
            <div className="mt-1">
              <span className="text-2xl lg:text-3xl font-mono text-accent-orange">
                {result.securityWaitLow}–{result.securityWaitHigh}
              </span>
              <span className="text-sm text-text-muted ml-1">min</span>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {credentialLabel}
              {isLiveData && (
                <span className="text-accent-green ml-1">● live</span>
              )}
            </div>
          </div>
          <div className="border-l border-border pl-4">
            <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
              Other Buffers
            </div>
            <div className="mt-1">
              <span className="text-2xl lg:text-3xl font-mono text-text-primary">
                +{result.otherBuffers}
              </span>
              <span className="text-sm text-text-muted ml-1">min</span>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              Gate, bags{preclearanceActive ? ", CBP" : ""}, etc.
            </div>
          </div>
          <div className="border-l border-border pl-4">
            <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
              Total Needed
            </div>
            <div className="mt-1">
              <span className="text-2xl lg:text-3xl font-mono text-text-primary">
                {result.totalLow}–{result.totalHigh}
              </span>
              <span className="text-sm text-text-muted ml-1">min</span>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">before departure</div>
          </div>
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
          Time Breakdown
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Security wait ({result.riskLevel === "HIGH" ? "estimated high" : "estimated"})
            </span>
            <span className="text-text-primary font-mono">{result.securityWaitHigh} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Gate buffer ({config.code === "DUB" && preclearanceActive ? "international" : "standard"})
            </span>
            <span className="text-text-primary font-mono">+{config.gateBuffer} min</span>
          </div>
          {inputs.additionalFactors.includes("bags") && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Bag drop</span>
              <span className="text-text-primary font-mono">+{config.bagsBuffer} min</span>
            </div>
          )}
          {inputs.additionalFactors
            .filter((f) => f !== "bags" && f !== "us_bound")
            .map((factorId) => {
              const factor = config.additionalFactors.find((f) => f.id === factorId);
              if (!factor) return null;
              return (
                <div key={factorId} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{factor.label}</span>
                  <span className="text-text-primary font-mono">+{factor.minutes} min</span>
                </div>
              );
            })}
          {preclearanceActive && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">US Preclearance (CBP)</span>
              <span className="text-text-primary font-mono">
                +{result.otherBuffers - config.gateBuffer - (inputs.additionalFactors.includes("bags") ? config.bagsBuffer : 0) - inputs.additionalFactors.filter((f) => f !== "bags" && f !== "us_bound").reduce((sum, fId) => sum + (config.additionalFactors.find((af) => af.id === fId)?.minutes ?? 0), 0)} min
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
            <span className="text-text-primary">Total buffer (high estimate)</span>
            <span className="text-accent-orange font-mono">{result.totalHigh} min</span>
          </div>
        </div>
      </div>

      {/* Advisories */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
          Situational Advisories — {monthNames[departureDate.getMonth()]} {departureDate.getDate()}
        </div>
        <div className="space-y-3">
          {result.advisories.map((advisory, i) => {
            const colors = {
              success: "text-accent-green",
              warning: "text-accent-orange",
              info: "text-text-secondary",
            };
            const dots = {
              success: "bg-accent-green",
              warning: "bg-accent-orange",
              info: "bg-text-muted",
            };
            return (
              <div key={i} className="flex gap-3 text-sm">
                <span className={`${dots[advisory.type]} w-2 h-2 rounded-full mt-1.5 shrink-0`} />
                <span className={colors[advisory.type]}>{advisory.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      <div className="border-t border-border pt-4">
        <div className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-2">
          Sources & Data Refresh
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          {config.dataSources.map((source) => (
            <span key={source.name}>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary transition-colors underline decoration-border"
                >
                  {source.name}
                </a>
              ) : (
                source.name
              )}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs">
          {isLiveData ? (
            <span className="bg-accent-green/20 text-accent-green px-2 py-1 rounded text-[11px]">
              ● Live data as of{" "}
              {lastRefresh
                ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "now"}
            </span>
          ) : (
            <span className="text-text-muted text-[11px]">
              Using heuristic estimates — live data unavailable
            </span>
          )}
        </div>
        <div className="mt-2 text-[10px] text-text-muted">
          Estimates only — conditions change rapidly. Check{" "}
          {config.code === "BOS" ? (
            <a href="https://x.com/BostonLogan" target="_blank" rel="noopener noreferrer" className="underline">
              @BostonLogan
            </a>
          ) : (
            <a href="https://x.com/DublinAirport" target="_blank" rel="noopener noreferrer" className="underline">
              @DublinAirport
            </a>
          )}{" "}
          on X for real-time updates.
        </div>
      </div>
    </div>
  );
}
