"use client";

import React, { useState, useMemo } from "react";
import { 
  ArrowsDownUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  MagnifyingGlass, 
  SlidersHorizontal,
  Eye,
  ChartBar,
  FileText,
  Star
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { SignalMatrix } from "./SignalMatrix";
import { FactorSimulator, FactorWeights } from "./FactorSimulator";
import { StockDossier } from "./StockDossier";
import { AreaSparkline } from "./AreaSparkline";
import { playTick } from "../utils/audio";
import { runFactorKMeans, ClusteredSymbol } from "../utils/kmeans";
import { getWatchlist, toggleWatchlist } from "../utils/watchlist";

interface ScreenerTableProps {
  symbols: SymbolData[];
  onOpenChart: (symbol: string) => void;
  onOpenReport?: (symbol: string) => void;
  showWatchlistOnly?: boolean;
  onToggleWatchlistFilter?: () => void;
}

type SortField = "symbol" | "price" | "change_1d" | "volatility_30d" | "rsi_14" | "bollinger_pct_b" | "sharpe_proxy" | "composite_score";

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  symbols,
  onOpenChart,
  onOpenReport,
  showWatchlistOnly: propShowWatchlistOnly,
  onToggleWatchlistFilter
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [clusterFilter, setClusterFilter] = useState<string>("ALL");
  const [strategyPreset, setStrategyPreset] = useState<string>("ALL");
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedDossierSymbol, setSelectedDossierSymbol] = useState<string | null>("NVDA");

  // Watchlist state — supports controlled or uncontrolled
  const [watchlist, setWatchlist] = useState<string[]>(() => getWatchlist());
  const [internalWatchlistOnly, setInternalWatchlistOnly] = useState(false);

  const isWatchlistFilterActive =
    propShowWatchlistOnly !== undefined ? propShowWatchlistOnly : internalWatchlistOnly;

  const toggleWatchlistFilter = () => {
    playTick("toggle");
    if (onToggleWatchlistFilter) {
      onToggleWatchlistFilter();
    } else {
      setInternalWatchlistOnly((prev) => !prev);
    }
  };

  const handleToggleWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    playTick("toggle");
    toggleWatchlist(symbol);
    setWatchlist(getWatchlist());
  };

  // Dynamic K-Means Factor Clustering
  const { clusteredSymbols, clusters } = useMemo(() => {
    return runFactorKMeans(symbols);
  }, [symbols]);

  const clusterBySymbol = useMemo(() => {
    const map: Record<string, ClusteredSymbol> = {};
    clusteredSymbols.forEach((cs) => {
      map[cs.symbol] = cs;
    });
    return map;
  }, [clusteredSymbols]);

  // Dynamic Strategy Factor Weights
  const [weights, setWeights] = useState<FactorWeights>({
    momentum: 35,
    volatility: 25,
    sharpe: 25,
    meanReversion: 15
  });

  const [sortField, setSortField] = useState<SortField>("composite_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    symbols.forEach((s) => set.add(s.sector));
    return Array.from(set).sort();
  }, [symbols]);

  // Compute composite score based on dynamic weights
  const symbolsWithScores = useMemo(() => {
    return symbols.map((s) => {
      const momNorm = s.rsi_14; // 0-100
      const volNorm = Math.max(0, 100 - s.volatility_30d * 2.2); // lower vol is better
      const sharpeNorm = Math.min(100, Math.max(0, s.sharpe_proxy * 35));
      const revNorm = Math.max(0, (1 - s.bollinger_pct_b) * 100);

      const totalWeight = weights.momentum + weights.volatility + weights.sharpe + weights.meanReversion || 1;
      const composite = (
        (momNorm * weights.momentum) +
        (volNorm * weights.volatility) +
        (sharpeNorm * weights.sharpe) +
        (revNorm * weights.meanReversion)
      ) / totalWeight;

      return {
        ...s,
        composite_score: Math.round(composite * 10) / 10
      };
    });
  }, [symbols, weights]);

  // Filtering & Sorting
  const filteredSymbols = useMemo(() => {
    return symbolsWithScores.filter((s) => {
      // Watchlist filter — applied first
      if (isWatchlistFilterActive && !watchlist.includes(s.symbol)) return false;

      const matchesSearch =
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (exchangeFilter !== "ALL" && s.exchange !== exchangeFilter) return false;
      if (sectorFilter !== "ALL" && s.sector !== sectorFilter) return false;

      if (clusterFilter !== "ALL") {
        const cId = clusterBySymbol[s.symbol]?.clusterId;
        if (cId !== Number(clusterFilter)) return false;
      }

      if (strategyPreset === "BULLISH_MOMENTUM") {
        return s.rsi_14 > 55 && s.macd > s.macd_signal;
      }
      if (strategyPreset === "BOLLINGER_BREAKOUT") {
        return s.bollinger_pct_b >= 0.95;
      }
      if (strategyPreset === "LOWER_SQUEEZE") {
        return s.bollinger_pct_b <= 0.25;
      }
      if (strategyPreset === "HIGH_SHARPE") {
        return s.sharpe_proxy >= 1.30;
      }
      if (strategyPreset === "LOW_VOL") {
        return s.volatility_30d <= 22.0;
      }

      return true;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [symbolsWithScores, searchQuery, exchangeFilter, sectorFilter, clusterFilter, strategyPreset, sortField, sortOrder, clusterBySymbol, watchlist, isWatchlistFilterActive]);

  const handleSort = (field: SortField) => {
    playTick("click");
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRowClick = (symbol: string) => {
    playTick("click");
    setSelectedDossierSymbol((prev) => (prev === symbol ? null : symbol));
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, symbol: string, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRowClick(symbol);
    } else if (e.key === " ") {
      e.preventDefault();
      toggleWatchlist(symbol);
      setWatchlist(getWatchlist());
      playTick("toggle");
    } else if (e.key.toLowerCase() === "c") {
      e.preventDefault();
      playTick("blip");
      onOpenChart(symbol);
    } else if (e.key.toLowerCase() === "r" && onOpenReport) {
      e.preventDefault();
      playTick("click");
      onOpenReport(symbol);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const rows = document.querySelectorAll<HTMLElement>("[data-screener-row]");
      const next = rows[index + 1];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const rows = document.querySelectorAll<HTMLElement>("[data-screener-row]");
      const prev = rows[index - 1];
      prev?.focus();
    }
  };

  const activeDossierItem = useMemo(() => {
    return symbols.find((s) => s.symbol === selectedDossierSymbol) || null;
  }, [symbols, selectedDossierSymbol]);

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Table Container */}
      <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col shadow-subtle transition-colors duration-200">
        {/* Screener Controls Header */}
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                <SlidersHorizontal size={15} weight="bold" className="text-[var(--accent)]" />
                Quantitative Factor Screener
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
                {filteredSymbols.length} / {symbols.length} Assets
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Factor Weighting Toggle */}
              <button
                onClick={() => {
                  playTick("toggle");
                  setShowSimulator(!showSimulator);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] transition btn-tactile ${
                  showSimulator
                    ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)] font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <SlidersHorizontal size={13} weight="bold" />
                <span>Strategy Weights</span>
              </button>

              {/* Watchlist Toggle */}
              <button
                onClick={toggleWatchlistFilter}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition btn-tactile cursor-pointer ${
                  isWatchlistFilterActive
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-500 font-bold shadow-xs ring-1 ring-amber-400/30"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--divider-strong)]"
                }`}
                title={`Toggle Watchlist Filter (W) — ${watchlist.length} pinned`}
              >
                <Star size={13} weight={isWatchlistFilterActive ? "fill" : "regular"} className={isWatchlistFilterActive ? "text-amber-500" : ""} />
                <span>Watchlist{watchlist.length > 0 ? ` (${watchlist.length})` : ""}</span>
              </button>

              {/* Quick Search */}
              <div className="relative">
                <MagnifyingGlass size={13} weight="bold" className="text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter symbol/name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 rounded bg-[var(--surface)] border border-[var(--divider)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] text-xs w-40 sm:w-48"
                />
              </div>

              {/* Exchange Toggle */}
              <div className="flex rounded border border-[var(--divider)] bg-[var(--surface)] p-0.5 text-[11px]">
                {["ALL", "US", "NSE"].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      playTick("click");
                      setExchangeFilter(ex);
                    }}
                    className={`px-2 py-0.5 rounded transition btn-tactile ${
                      exchangeFilter === ex
                        ? "bg-[var(--surface-raised)] text-[var(--accent)] font-bold shadow-xs"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {ex === "ALL" ? "All Mkts" : ex}
                  </button>
                ))}
              </div>

              {/* Sector Dropdown */}
              <select
                value={sectorFilter}
                onChange={(e) => {
                  playTick("click");
                  setSectorFilter(e.target.value);
                }}
                className="bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-primary)] text-[11px] rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* K-Means Cluster Archetype Dropdown */}
              <select
                value={clusterFilter}
                onChange={(e) => {
                  playTick("click");
                  setClusterFilter(e.target.value);
                }}
                className="bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-primary)] text-[11px] rounded px-2 py-1 focus:outline-none cursor-pointer"
                title="Filter by K-Means Factor Cluster Archetype"
              >
                <option value="ALL">All Clusters</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortLabel} ({c.symbols.length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Strategy Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mr-1">
              Factor Preset:
            </span>
            {[
              { id: "ALL", label: "All Constituents" },
              { id: "BULLISH_MOMENTUM", label: "Bullish Momentum (RSI>55 & MACD+)" },
              { id: "BOLLINGER_BREAKOUT", label: "Bollinger Breakout (%B>0.95)" },
              { id: "LOWER_SQUEEZE", label: "Mean Reversion Dip (%B<0.25)" },
              { id: "HIGH_SHARPE", label: "High Sharpe (Sharpe≥1.3)" },
              { id: "LOW_VOL", label: "Low Volatility (Vol≤22%)" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  playTick("click");
                  setStrategyPreset(preset.id);
                }}
                className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition border btn-tactile ${
                  strategyPreset === preset.id
                    ? "bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-border)] font-bold"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--divider)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Collapsible Factor Simulator */}
          {showSimulator && (
            <FactorSimulator weights={weights} setWeights={setWeights} />
          )}
        </div>

        {/* Master-Detail Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--divider)] min-w-0">
          {/* Main Data Table */}
          <div className={`${activeDossierItem ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12"} min-w-0 overflow-x-auto transition-all duration-200`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)]">
                  <th
                    onClick={() => handleSort("symbol")}
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Ticker, company name & primary exchange (NSE/US)"
                  >
                    <div className="flex items-center gap-1">
                      <span>EQUITY</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-2 font-semibold"
                    title="Real-time Pandera quantitative technical indicator matrix"
                  >
                    SIGNALS
                  </th>
                  <th
                    onClick={() => handleSort("composite_score")}
                    className="py-2.5 px-2 font-semibold text-center cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Composite multi-factor momentum & Sharpe-weighted score (0-100)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>ALPHA SCORE</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("price")}
                    className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Latest closing price in native currency (₹ / $)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>PRICE</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("change_1d")}
                    className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Single-session 1-day percentage price return"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>1D CHG</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("volatility_30d")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="30-day annualized realized volatility (252-day basis)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>30D VOL</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("rsi_14")}
                    className="py-2.5 px-2 font-semibold cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Wilder's 14-day Relative Strength Index (Oversold <30, Overbought >70)"
                  >
                    <div className="flex items-center gap-1">
                      <span>RSI-14</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bollinger_pct_b")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Bollinger Bands Bandwidth Position: (Close - Lower) / (Upper - Lower)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>%B</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("sharpe_proxy")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-[var(--accent)] transition-colors"
                    title="Annualized Sharpe ratio proxy calculated against 4.5% risk-free rate"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>SHARPE</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-2 font-semibold text-center"
                    title="20-day historical normalized trajectory area sparkline"
                  >
                    TREND 20D
                  </th>
                  <th
                    className="py-2.5 px-2 font-semibold text-center"
                    title="Quick inspection actions (Dossier / Chart / Tear-Sheet)"
                  >
                    ACTION
                  </th>
                  <th
                    className="py-2.5 px-2 font-semibold text-center w-8"
                    title="Pin to Watchlist"
                  >
                    <Star size={11} weight="regular" />
                  </th>
                </tr>
              </thead>

              {/* Empty state — shown when filters produce 0 results */}
              {filteredSymbols.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-[var(--text-muted)] font-mono">
                      <div className="flex flex-col items-center gap-2">
                        <SlidersHorizontal size={32} weight="thin" className="opacity-30" />
                        <div className="text-sm font-semibold text-[var(--text-secondary)]">
                          No equities match current filters
                        </div>
                        <div className="text-xs">
                          {isWatchlistFilterActive && watchlist.length === 0
                            ? "Your watchlist is empty. Click the star icon on any row to pin an equity."
                            : "Try adjusting exchange, sector, cluster, or preset filters"}
                        </div>
                        <button
                          onClick={() => {
                            setExchangeFilter("ALL");
                            setSectorFilter("ALL");
                            setClusterFilter("ALL");
                            setStrategyPreset("ALL");
                            setSearchQuery("");
                            if (isWatchlistFilterActive) toggleWatchlistFilter();
                          }}
                          className="mt-2 px-3 py-1 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-mono hover:bg-[var(--accent)] hover:text-white transition btn-tactile cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}

              <tbody className="divide-y divide-[var(--divider)]">
                {filteredSymbols.map((item, index) => {
                  const isPos = item.change_1d >= 0;
                  const currencyPrefix = item.exchange === "NSE" ? "₹" : "$";
                  const isSelected = selectedDossierSymbol === item.symbol;
                  const cluster = clusterBySymbol[item.symbol];
                  const isPinned = watchlist.includes(item.symbol);

                   return (
                    <tr
                      key={item.symbol}
                      role="row"
                      tabIndex={0}
                      data-screener-row
                      aria-selected={isSelected}
                      onClick={() => handleRowClick(item.symbol)}
                      onKeyDown={(e) => handleRowKeyDown(e, item.symbol, index)}
                      className={`hover:bg-[var(--surface-hover)] focus:outline-none focus:bg-[var(--surface-hover)] transition cursor-pointer group ${
                        isSelected ? "bg-[var(--surface-active)]" : ""
                      }`}
                    >
                      {/* Symbol & Name */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-0.5 h-6 rounded-full transition-all duration-150 ${
                              isSelected
                                ? "bg-[var(--accent)] opacity-100"
                                : "opacity-0 group-hover:opacity-30 bg-[var(--text-muted)]"
                            }`}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-[var(--text-primary)]">
                                {item.symbol}
                              </span>
                              <span
                                className={`px-1 rounded text-[9px] font-bold ${
                                  item.exchange === "NSE"
                                    ? "bg-[var(--risk-warning-bg)] text-[var(--risk-warning)] border border-[var(--risk-warning-border)]"
                                    : "bg-[var(--risk-info-bg)] text-[var(--risk-info)] border border-[var(--risk-info-border)]"
                                }`}
                              >
                                {item.exchange}
                              </span>
                              {cluster && (
                                <span
                                  className="px-1 py-0.5 rounded text-[8px] font-semibold border border-[var(--divider)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] tracking-tight whitespace-nowrap"
                                  title={`K-Means Archetype: ${cluster.clusterName}`}
                                >
                                  {cluster.clusterLabel}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px]">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Signals Matrix */}
                      <td className="py-2 px-2">
                        <SignalMatrix symbol={item} />
                      </td>

                      {/* Dynamic Alpha Score */}
                      <td className="py-2 px-2 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-black text-xs tabular-nums ${
                              item.composite_score >= 70
                                ? "bg-[var(--risk-success-bg)] text-[var(--risk-success)] border border-[var(--risk-success-border)]"
                                : item.composite_score >= 50
                                ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)]"
                                : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--divider)]"
                            }`}
                          >
                            {item.composite_score.toFixed(1)}
                          </span>
                          {/* Thin progress bar beneath badge */}
                          <div className="w-10 h-0.5 rounded-full bg-[var(--divider)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.composite_score >= 70
                                  ? "bg-[var(--risk-success)]"
                                  : item.composite_score >= 50
                                  ? "bg-[var(--accent)]"
                                  : "bg-[var(--text-muted)]"
                              }`}
                              style={{ width: `${Math.max(2, Math.min(100, item.composite_score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Spot Price */}
                      <td className="py-2 px-3 text-right font-black text-[var(--text-primary)] tabular-nums">
                        {currencyPrefix}
                        {item.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* 1D Change */}
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            isPos
                              ? "bg-[var(--risk-success-bg)] text-[var(--risk-success)] border border-[var(--risk-success-border)]"
                              : "bg-[var(--risk-critical-bg)] text-[var(--risk-critical)] border border-[var(--risk-critical-border)]"
                          }`}
                        >
                          {isPos ? (
                            <ArrowUpRight size={12} weight="bold" />
                          ) : (
                            <ArrowDownRight size={12} weight="bold" />
                          )}
                          {isPos ? "+" : ""}
                          {item.change_1d.toFixed(2)}%
                        </span>
                      </td>

                      {/* 30D Volatility */}
                      <td className="py-2 px-2 text-right text-[var(--text-secondary)] tabular-nums">
                        {item.volatility_30d.toFixed(1)}%
                      </td>

                      {/* RSI-14 */}
                      <td className="py-2 px-2">
                        <span className="tabular-nums font-bold text-[var(--text-primary)]">
                          {item.rsi_14.toFixed(1)}
                        </span>
                      </td>

                      {/* Bollinger %B */}
                      <td className="py-2 px-2 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            item.bollinger_pct_b > 1.0
                              ? "text-[var(--risk-success)]"
                              : item.bollinger_pct_b < 0.0
                              ? "text-[var(--risk-critical)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {item.bollinger_pct_b.toFixed(2)}
                        </span>
                      </td>

                      {/* Sharpe Proxy */}
                      <td className="py-2 px-2 text-right tabular-nums font-bold text-[var(--text-primary)]">
                        {item.sharpe_proxy.toFixed(2)}
                      </td>

                      {/* Modern Area Sparkline with Area Fill */}
                      <td className="py-2 px-2 text-center">
                        <div className="inline-block transition-transform duration-200 group-hover:scale-105">
                          <AreaSparkline points={item.sparkline} isPositive={isPos} />
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onOpenReport && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playTick("click");
                                onOpenReport(item.symbol);
                              }}
                              className="p-1 rounded border border-transparent group-hover:border-[var(--divider)] bg-transparent group-hover:bg-[var(--surface-subtle)] hover:!bg-[var(--accent-dim)] hover:!text-[var(--accent)] hover:!border-[var(--accent-border)] text-[var(--text-muted)] transition-all btn-tactile hover:scale-110 active:scale-95"
                              title="Generate Institutional Research Tear-Sheet"
                            >
                              <FileText size={13} weight="bold" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item.symbol);
                            }}
                            className="p-1 rounded border border-transparent group-hover:border-[var(--divider)] bg-transparent group-hover:bg-[var(--surface-subtle)] hover:!bg-[var(--accent-dim)] hover:!text-[var(--accent)] hover:!border-[var(--accent-border)] text-[var(--text-muted)] transition-all btn-tactile hover:scale-110 active:scale-95"
                            title="Inspect Quantitative Dossier"
                          >
                            <Eye size={13} weight="bold" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playTick("blip");
                              onOpenChart(item.symbol);
                            }}
                            className="p-1 rounded border border-transparent group-hover:border-[var(--divider)] bg-transparent group-hover:bg-[var(--surface-subtle)] hover:!bg-[var(--accent-dim)] hover:!text-[var(--accent)] hover:!border-[var(--accent-border)] text-[var(--text-muted)] transition-all btn-tactile hover:scale-110 active:scale-95"
                            title="Open Technical Workspace"
                          >
                            <ChartBar size={13} weight="bold" />
                          </button>
                        </div>
                      </td>

                      {/* Star / Watchlist Pin */}
                      <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleWatchlist(e, item.symbol)}
                          className={`p-1 rounded transition hover:scale-110 active:scale-95 ${
                            isPinned
                              ? "text-amber-400"
                              : "text-[var(--text-muted)] opacity-0 group-hover:opacity-60 hover:!opacity-100"
                          }`}
                          title={isPinned ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          <Star size={14} weight={isPinned ? "fill" : "regular"} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Dossier Side-Pane */}
          {activeDossierItem && (
            <div className="lg:col-span-4 xl:col-span-3 p-2 bg-[var(--surface-subtle)] overflow-y-auto relative">
              <StockDossier
                symbol={activeDossierItem}
                onClose={() => setSelectedDossierSymbol(null)}
                onOpenChart={onOpenChart}
                onOpenReport={onOpenReport}
              />
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="p-2.5 border-t border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <div>
            Showing <span className="text-[var(--text-primary)] font-bold">{filteredSymbols.length}</span> matching
            equities across US & NSE markets
          </div>
          <div className="flex items-center gap-4">
            <span>
              Top Alpha:{" "}
              <span className="font-bold text-[var(--accent)]">
                {filteredSymbols[0]?.symbol || "—"} ({filteredSymbols[0]?.composite_score.toFixed(1) || 0})
              </span>
            </span>
            <span>
              Avg Sharpe:{" "}
              <span className="text-[var(--text-primary)] font-bold">
                {filteredSymbols.length > 0
                  ? (
                      filteredSymbols.reduce((a, b) => a + b.sharpe_proxy, 0) / filteredSymbols.length
                    ).toFixed(2)
                  : 0}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
