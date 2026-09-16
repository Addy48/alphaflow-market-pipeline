"use client";

import React, { useState, useMemo } from "react";
import { 
  ArrowsDownUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  MagnifyingGlass, 
  SlidersHorizontal,
  Eye,
  ChartBar
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { SignalMatrix } from "./SignalMatrix";
import { FactorSimulator, FactorWeights } from "./FactorSimulator";
import { StockDossier } from "./StockDossier";
import { AreaSparkline } from "./AreaSparkline";
import { playTick } from "../utils/audio";

interface ScreenerTableProps {
  symbols: SymbolData[];
  onOpenChart: (symbol: string) => void;
}

type SortField = "symbol" | "price" | "change_1d" | "volatility_30d" | "rsi_14" | "bollinger_pct_b" | "sharpe_proxy" | "composite_score";

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  symbols,
  onOpenChart
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [strategyPreset, setStrategyPreset] = useState<string>("ALL");
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedDossierSymbol, setSelectedDossierSymbol] = useState<string | null>("NVDA");

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
      const matchesSearch =
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (exchangeFilter !== "ALL" && s.exchange !== exchangeFilter) return false;
      if (sectorFilter !== "ALL" && s.sector !== sectorFilter) return false;

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
  }, [symbolsWithScores, searchQuery, exchangeFilter, sectorFilter, strategyPreset, sortField, sortOrder]);

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
                <SlidersHorizontal size={15} weight="bold" className="text-cyan-500" />
                Quantitative Factor Screener
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
                {filteredSymbols.length} / {symbols.length} Assets
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Factor Weighting Toggle */}
              <button
                onClick={() => {
                  playTick("toggle");
                  setShowSimulator(!showSimulator);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] transition btn-tactile ${
                  showSimulator
                    ? "border-cyan-500 bg-cyan-950/30 text-cyan-400 font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <SlidersHorizontal size={13} weight="bold" />
                <span>Strategy Weights</span>
              </button>

              {/* Quick Search */}
              <div className="relative">
                <MagnifyingGlass size={13} weight="bold" className="text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter symbol/name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 rounded bg-[var(--surface)] border border-[var(--divider)] focus:border-cyan-500 focus:outline-none text-[var(--text-primary)] text-xs w-40 sm:w-48"
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
                        ? "bg-[var(--surface-raised)] text-cyan-500 font-bold shadow-xs"
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
                    ? "bg-cyan-950/70 text-cyan-400 border-cyan-600/70 font-bold"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--divider)] hover:border-cyan-500/40 hover:text-[var(--text-primary)]"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--divider)]">
          {/* Main Data Table */}
          <div className={`${activeDossierItem ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12"} overflow-x-auto transition-all duration-200`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)]">
                  <th
                    onClick={() => handleSort("symbol")}
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
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
                    className="py-2.5 px-2 font-semibold text-center cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Composite multi-factor momentum & Sharpe-weighted score (0-100)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>ALPHA SCORE</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("price")}
                    className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Latest closing price in native currency (₹ / $)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>PRICE</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("change_1d")}
                    className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Single-session 1-day percentage price return"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>1D CHG</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("volatility_30d")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-cyan-400 transition-colors"
                    title="30-day annualized realized volatility (252-day basis)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>30D VOL</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("rsi_14")}
                    className="py-2.5 px-2 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Wilder's 14-day Relative Strength Index (Oversold <30, Overbought >70)"
                  >
                    <div className="flex items-center gap-1">
                      <span>RSI-14</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bollinger_pct_b")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Bollinger Bands Bandwidth Position: (Close - Lower) / (Upper - Lower)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>%B</span>
                      <ArrowsDownUp size={12} weight="bold" className="opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("sharpe_proxy")}
                    className="py-2.5 px-2 font-semibold text-right cursor-pointer hover:text-cyan-400 transition-colors"
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
                    title="Quick inspection actions (Quantitative Dossier / Technical Chart)"
                  >
                    ACTION
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--divider)]">
                {filteredSymbols.map((item) => {
                  const isPos = item.change_1d >= 0;
                  const currencyPrefix = item.exchange === "NSE" ? "₹" : "$";
                  const isSelected = selectedDossierSymbol === item.symbol;

                   return (
                    <tr
                      key={item.symbol}
                      onClick={() => handleRowClick(item.symbol)}
                      className={`hover:bg-[var(--surface-hover)] transition cursor-pointer group ${
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
                                    ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                                    : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                                }`}
                              >
                                {item.exchange}
                              </span>
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
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-black text-xs tabular-nums ${
                            item.composite_score >= 70
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : item.composite_score >= 50
                              ? "bg-cyan-950/60 text-cyan-400 border border-cyan-800/40"
                              : "bg-zinc-800/40 text-zinc-400"
                          }`}
                        >
                          {item.composite_score.toFixed(1)}
                        </span>
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
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"
                              : "bg-rose-950/70 text-rose-400 border border-rose-800/60"
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
                              ? "text-emerald-500"
                              : item.bollinger_pct_b < 0.0
                              ? "text-rose-500"
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item.symbol);
                            }}
                            className="p-1 rounded border border-transparent group-hover:border-[var(--divider)] bg-transparent group-hover:bg-[var(--surface-subtle)] hover:!bg-cyan-950/80 hover:!text-cyan-300 hover:!border-cyan-500/60 text-[var(--text-muted)] transition-all btn-tactile hover:scale-110 active:scale-95"
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
                            className="p-1 rounded border border-transparent group-hover:border-[var(--divider)] bg-transparent group-hover:bg-[var(--surface-subtle)] hover:!bg-cyan-950/80 hover:!text-cyan-300 hover:!border-cyan-500/60 text-[var(--text-muted)] transition-all btn-tactile hover:scale-110 active:scale-95"
                            title="Open Technical Workspace"
                          >
                            <ChartBar size={13} weight="bold" />
                          </button>
                        </div>
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
              <span className="font-bold text-cyan-500">
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
