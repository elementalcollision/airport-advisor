import type { DataSourceResult } from "./types";

interface CacheEntry {
  data: DataSourceResult;
  expiresAt: number; // ms since epoch
  storedAt: number;
}

const store = new Map<string, CacheEntry>();

function cacheKey(providerName: string, airport: string): string {
  return `${providerName}:${airport}`;
}

export function getCached(providerName: string, airport: string): DataSourceResult | null {
  const key = cacheKey(providerName, airport);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(
  providerName: string,
  airport: string,
  data: DataSourceResult,
): void {
  const key = cacheKey(providerName, airport);
  store.set(key, {
    data,
    storedAt: Date.now(),
    expiresAt: Date.now() + data.ttlSeconds * 1000,
  });
}

export function getCacheAge(providerName: string, airport: string): number | null {
  const key = cacheKey(providerName, airport);
  const entry = store.get(key);
  if (!entry) return null;
  return Math.round((Date.now() - entry.storedAt) / 1000);
}
