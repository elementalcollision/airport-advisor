"use client";

import { AirportCode, AirportConfig, SeasonalEvent } from "@/lib/types";

interface InputPanelProps {
  airport: AirportCode;
  config: AirportConfig;
  departureDate: string;
  departureHour: number;
  departureMinute: number;
  credentialId: string;
  additionalFactors: string[];
  activeEvents: SeasonalEvent[];
  onAirportChange: (code: AirportCode) => void;
  onDateChange: (date: string) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onCredentialChange: (id: string) => void;
  onFactorToggle: (id: string) => void;
}

export default function InputPanel({
  airport,
  config,
  departureDate,
  departureHour,
  departureMinute,
  credentialId,
  additionalFactors,
  activeEvents,
  onAirportChange,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onCredentialChange,
  onFactorToggle,
}: InputPanelProps) {
  const formatTime = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(departureMinute).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-5 p-5 lg:p-6">
      {/* Airport Toggle */}
      <div className="flex gap-1 bg-bg-input rounded-lg p-1">
        {(["BOS", "DUB"] as AirportCode[]).map((code) => (
          <button
            key={code}
            onClick={() => onAirportChange(code)}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-bold tracking-wider transition-colors ${
              airport === code
                ? "bg-accent-orange text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Departure Date */}
      <div>
        <label className="block text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-2">
          Departure Date
        </label>
        <input
          type="date"
          value={departureDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm"
        />
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="space-y-1.5">
          {activeEvents.map((event) => (
            <div key={event.name} className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2">
              <div className="text-xs font-semibold text-accent-red">
                {event.badge} {event.name}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">{event.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Departure */}
      <div>
        <label className="block text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-2">
          Scheduled Departure
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={23}
            value={departureHour}
            onChange={(e) => onHourChange(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-16 bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm text-center"
          />
          <span className="text-text-muted font-bold">:</span>
          <input
            type="number"
            min={0}
            max={59}
            step={5}
            value={departureMinute}
            onChange={(e) => onMinuteChange(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-16 bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm text-center"
          />
        </div>
        <div className="text-accent-green text-xs mt-1.5">
          → {formatTime(departureHour)} departure
        </div>
      </div>

      {/* Credential Type */}
      <div>
        <label className="block text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-2">
          {config.code === "BOS" ? "Group's Lowest Credential" : "Security Lane"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {config.credentials.map((cred) => (
            <button
              key={cred.id}
              onClick={() => onCredentialChange(cred.id)}
              className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                credentialId === cred.id
                  ? "border-accent-orange bg-accent-orange/10 text-text-primary"
                  : "border-border bg-bg-input text-text-secondary hover:border-text-muted"
              }`}
            >
              <div className="text-lg">{cred.icon}</div>
              <div className="text-[11px] font-semibold mt-1 leading-tight">{cred.label}</div>
              {cred.description && (
                <div className="text-[9px] text-text-muted mt-0.5">{cred.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Factors */}
      <div>
        <label className="block text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-2">
          Additional Factors
        </label>
        <div className="space-y-1.5">
          {config.additionalFactors.map((factor) => (
            <button
              key={factor.id}
              onClick={() => onFactorToggle(factor.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                additionalFactors.includes(factor.id)
                  ? "border-accent-orange/50 bg-accent-orange/10 text-text-primary"
                  : "border-border bg-bg-input text-text-secondary hover:border-text-muted"
              }`}
            >
              <span className="text-base">{factor.icon}</span>
              <span className="text-xs font-medium">{factor.label}</span>
              {additionalFactors.includes(factor.id) && (
                <span className="ml-auto text-accent-orange text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
