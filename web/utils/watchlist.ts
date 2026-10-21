/**
 * BellCurve Data Watchlist Manager
 * Persists user-pinned symbols to localStorage under "alphaflow_watchlist"
 */

const STORAGE_KEY = "alphaflow_watchlist";

interface WatchlistEntry {
  symbol: string;
  pinnedAt: number; // Unix timestamp ms
}

function getRawWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  return getRawWatchlist().map((e) => e.symbol);
}

export function addToWatchlist(symbol: string): void {
  if (typeof window === "undefined") return;
  const current = getRawWatchlist();
  if (current.find((e) => e.symbol === symbol)) return; // already pinned
  const updated = [...current, { symbol, pinnedAt: Date.now() }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeFromWatchlist(symbol: string): void {
  if (typeof window === "undefined") return;
  const current = getRawWatchlist().filter((e) => e.symbol !== symbol);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function toggleWatchlist(symbol: string): boolean {
  const current = getWatchlist();
  if (current.includes(symbol)) {
    removeFromWatchlist(symbol);
    return false; // now unpinned
  } else {
    addToWatchlist(symbol);
    return true; // now pinned
  }
}

export function isInWatchlist(symbol: string): boolean {
  if (typeof window === "undefined") return false;
  return getWatchlist().includes(symbol);
}
