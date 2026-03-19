# Airport Security Wait Advisor

Real-time security wait time estimates and recommended arrival times for **Boston Logan (BOS)** and **Dublin Airport (DUB)**.

**Live:** [airport-advisor.vercel.app](https://airport-advisor.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## What It Does

Enter your departure date, time, security credential level, and terminal &mdash; the advisor calculates a **recommended arrival time** with risk level by combining:

- **Live wait time data** from TSA (BOS) and FlightQueue (DUB)
- **Real-time weather** from Aviation Weather (METAR)
- **FAA delay status** including ground stops and departure delays
- **Heuristic multipliers** for time-of-day, day-of-week, seasonal events, and credential type

## Features

- **Two airports**: BOS (Terminals A/B/C/E) and DUB (T1/T2 with US Preclearance)
- **Credential-aware**: Standard, TSA PreCheck, CLEAR, CLEAR+PreCheck, Fast Track (DUB)
- **Seasonal events**: Thanksgiving, Christmas, Spring Break, Marathon Monday, St. Patrick's Day, and more
- **Live weather conditions**: Flight category, wind, visibility, ceiling, temperature from METAR
- **FAA delay banners**: Ground stops, ground delays, arrival/departure delays
- **Per-checkpoint wait times** when available from live data
- **Situational advisories**: Time-of-day tips, weather impacts, terminal-specific guidance
- **Data source health**: Per-provider status indicators with staleness tracking
- **Auto-refresh**: Data updates every 5 minutes
- **PWA**: Installable on mobile/desktop with offline fallback
- **Dark theme**: Purpose-built dark UI optimized for pre-dawn airport trips

## Architecture

```
User Inputs ──► /api/airport/[code] ──► Aggregator ──► Calculator ──► UI
                      │                     │
                      │              ┌──────┼──────┐
                      ▼              ▼      ▼      ▼
                  In-Memory     TSA/Queue  METAR   FAA
                   Cache        Providers  Weather Status
```

### Data Providers

| Provider | Airport | Data | Confidence | TTL |
|----------|---------|------|------------|-----|
| TSA Wait Times | BOS | Queue wait minutes | 0.8 | 5 min |
| FlightQueue | DUB | Queue wait minutes | 0.7 | 5 min |
| Aviation Weather | Both | METAR (wind, vis, ceiling) | 0.95 | 10 min |
| FAA NAS Status | BOS | Ground stops, delays | 0.95 | 5 min |

### Calculation Engine

Wait times are computed by applying a chain of multipliers to a baseline:

1. **Baseline** &mdash; airport-specific range (BOS: 15-30 min, DUB: 10-25 min)
2. **Live data** &mdash; substituted when available (confidence-weighted)
3. **Time-of-day** &mdash; peak hours up to 1.7x (e.g., BOS 6-7 AM)
4. **Day-of-week** &mdash; Friday peak 1.15x, Sunday low 0.85x
5. **Seasonal events** &mdash; highest active multiplier (e.g., Thanksgiving 1.6x)
6. **Credential** &mdash; PreCheck 0.35x, CLEAR+PreCheck 0.25x
7. **Weather** &mdash; IFR 1.15x, LIFR 1.2x, high winds 1.15x
8. **Buffers** &mdash; gate (+20-25 min), bags (+10 min), preclearance (+15-35 min for DUB)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
git clone https://github.com/elementalcollision/airport-advisor.git
cd airport-advisor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npx vercel
```

## Project Structure

```
app/
  api/airport/[code]/route.ts   # API endpoint (5-min ISR cache)
  manifest.ts                   # PWA web app manifest
  layout.tsx                    # Root layout + metadata
  page.tsx                      # Home page
components/
  AdvisorApp.tsx                # Main orchestrator
  InputPanel.tsx                # User input controls
  ResultPanel.tsx               # Results, weather, advisories
lib/
  calculator.ts                 # Wait time calculation engine
  types.ts                      # TypeScript interfaces
  airports/
    bos.ts                      # Boston Logan config
    dub.ts                      # Dublin Airport config
  data-sources/
    aggregator.ts               # Multi-provider aggregation
    cache.ts                    # In-memory TTL cache
    provider.ts                 # DataProvider interface
    providers/
      tsa-wait-times.ts         # TSA API (BOS)
      flight-queue.ts           # FlightQueue API (DUB)
      aviation-weather.ts       # METAR weather (both)
      faa-status.ts             # FAA delays (BOS)
public/
  sw.js                         # Service worker
  offline.html                  # Offline fallback page
  icons/                        # PWA icons
```

## Documentation

Full documentation is available in the **[Wiki](https://github.com/elementalcollision/airport-advisor/wiki)**:

- **[Architecture Overview](https://github.com/elementalcollision/airport-advisor/wiki/Architecture-Overview)** &mdash; Data flow, aggregation, caching, and design decisions
- **[Adding a New Airport](https://github.com/elementalcollision/airport-advisor/wiki/Adding-a-New-Airport)** &mdash; Step-by-step guide with full example
- **[Adding a Data Source Provider](https://github.com/elementalcollision/airport-advisor/wiki/Adding-a-Data-Source-Provider)** &mdash; How to integrate a new API or data feed
- **[Configuration Reference](https://github.com/elementalcollision/airport-advisor/wiki/Configuration-Reference)** &mdash; Complete type and interface reference
- **[Deployment](https://github.com/elementalcollision/airport-advisor/wiki/Deployment)** &mdash; Vercel, self-hosting, and caching strategy

## Roadmap

See the full **[Roadmap](https://github.com/elementalcollision/airport-advisor/wiki/Roadmap)** in the wiki.

- [ ] **QSensor integration** &mdash; live checkpoint sensor data
- [ ] **Flight number lookup** &mdash; auto-fill time/terminal from FlightLabs or FlightAware
- [ ] **Drive time estimation** &mdash; Google Maps API for door-to-door timing
- [ ] **Historical trends** &mdash; charted wait time patterns by hour/day
- [ ] **Push notifications** &mdash; alerts when wait times spike before your flight
- [ ] **Crowdsourced reports** &mdash; user-submitted wait times
- [ ] **Multi-airport expansion** &mdash; additional airport configs

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, ISR)
- **UI**: [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: TypeScript 5
- **Hosting**: [Vercel](https://vercel.com/)
- **Data**: TSA API, FlightQueue, Aviation Weather (METAR), FAA NAS Status

## License

[MIT](LICENSE)
