"use client";

import React, { useState, useMemo } from "react";
import { TrendUp, TrendDown, ChartBar, SquaresFour } from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { runFactorKMeans, ClusteredSymbol } from "../utils/kmeans";
import { playTick } from "../utils/audio";

type ColorMetric = "composite_score" | "change_1d" | "rsi_14" | "sharpe_proxy";

interface SectorHeatmapProps {
  symbols: SymbolData[];
  onSelectSymbol: (symbol: string) => void;
}

/** Composite score — same formula as ScreenerTable (equal default weights) */
function deriveCompositeScore(s: SymbolData): number {
  const momNorm = s.rsi_14;
  const volNorm = Math.max(0, 100 - s.volatility_30d * 2.2);
  const sharpeNorm = Math.min(100, Math.max(0, s.sharpe_proxy * 35));
  const revNorm = Math.max(0, (1 - s.bollinger_pct_b) * 100);
  return (
    Math.round(
      ((momNorm * 35 + volNorm * 25 + sharpeNorm * 25 + revNorm * 15) / 100) * 10
    ) / 10
  );
}

const METRICS: { id: ColorMetric; label: string }[] = [
  { id: "composite_score", label: "Alpha Score" },
  { id: "change_1d", label: "1D Change" },
  { id: "rsi_14", label: "RSI-14" },
  { id: "sharpe_proxy", label: "Sharpe" },
];

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  symbols,
  onSelectSymbol,
}) => {
  const [colorMetric, setColorMetric] = useState<ColorMetric>("composite_score");
  const [exchangeFilter, setExchangeFilter] = useState<"ALL" | "US" | "NSE">("ALL");

  const { clusteredSymbols } = useMemo(() => runFactorKMeans(symbols), [symbols]);

  const displaySymbols: ClusteredSymbol[] = useMemo(() => {
    const filtered =
      exchangeFilter === "ALL"
        ? clusteredSymbols
        : clusteredSymbols.filter((s) => s.exchange === exchangeFilter);
    return [...filtered].sort(
      (a, b) => deriveCompositeScore(b) - deriveCompositeScore(a)
    );
  }, [clusteredSymbols, exchangeFilter]);

  const getCellColor = (s: SymbolData): string => {
    const score = deriveCompositeScore(s);
    switch (colorMetric) {
      case "composite_score":
        if (score >= 70)
          return "bg-[var(--risk-success-bg)] border-[var(--risk-success-border)]";
        if (score >= 50)
          return "bg-[var(--accent-dim)] border-[var(--accent-border)]";
        return "bg-[var(--risk-critical-bg)] border-[var(--risk-critical-border)]";
      case "change_1d":
        if (s.change_1d >= 2)
          return "bg-[var(--risk-success-bg)] border-[var(--risk-success-border)]";
        if (s.change_1d >= 0)
          return "bg-[var(--surface-subtle)] border-[var(--divider)]";
        if (s.change_1d >= -2)
          return "bg-[var(--risk-warning-bg)] border-[var(--risk-warning-border)]";
        return "bg-[var(--risk-critical-bg)] border-[var(--risk-critical-border)]";
      case "rsi_14":
        if (s.rsi_14 >= 70)
          return "bg-[var(--risk-critical-bg)] border-[var(--risk-critical-border)]";
        if (s.rsi_14 >= 55)
          return "bg-[var(--risk-success-bg)] border-[var(--risk-success-border)]";
        if (s.rsi_14 <= 30)
          return "bg-[var(--risk-warning-bg)] border-[var(--risk-warning-border)]";
        return "bg-[var(--surface-subtle)] border-[var(--divider)]";
      case "sharpe_proxy":
        if (s.sharpe_proxy >= 1.5)
          return "bg-[var(--risk-success-bg)] border-[var(--risk-success-border)]";
        if (s.sharpe_proxy >= 0.8)
          return "bg-[var(--accent-dim)] border-[var(--accent-border)]";
        return "bg-[var(--risk-critical-bg)] border-[var(--risk-critical-border)]";
    }
  };

  const getMetricDisplay = (
    s: SymbolData
  ): { label: string; value: string; color: string } => {
    const score = deriveCompositeScore(s);
    switch (colorMetric) {
      case "composite_score":
        return {
          label: "Alpha",
          value: score.toFixed(1),
          color:
            score >= 70
              ? "text-[var(--risk-success)]"
              : score >= 50
              ? "text-[var(--accent)]"
              : "text-[var(--risk-critical)]",
        };
      case "change_1d":
        return {
          label: "1D Chg",
          value: `${s.change_1d >= 0 ? "+" : ""}${s.change_1d.toFixed(2)}%`,
          color:
            s.change_1d >= 0
              ? "text-[var(--risk-success)]"
              : "text-[var(--risk-critical)]",
        };
      case "rsi_14":
        return {
          label: "RSI",
          value: s.rsi_14.toFixed(1),
          color:
            s.rsi_14 >= 70
              ? "text-[var(--risk-critical)]"
              : s.rsi_14 <= 30
              ? "text-[var(--risk-warning)]"
              : "text-[var(--risk-success)]",
        };
      case "sharpe_proxy":
        return {
          label: "Sharpe",
          value: s.sharpe_proxy.toFixed(2),
          color:
            s.sharpe_proxy >= 1.5
              ? "text-[var(--risk-success)]"
              : s.sharpe_proxy >= 0.8
              ? "text-[var(--accent)]"
              : "text-[var(--risk-critical)]",
        };
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Controls */}
      <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg p-3 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SquaresFour
              size={15}
              weight="bold"
              className="text-[var(--accent)]"
            />
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Sector Heatmap
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
              {displaySymbols.length} / {symbols.length} Assets
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Exchange filter */}
            <div className="flex rounded border border-[var(--divider)] bg-[var(--surface)] p-0.5 text-[11px]">
              {(["ALL", "US", "NSE"] as const).map((ex) => (
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
            {/* Metric toggle */}
            <div className="flex rounded border border-[var(--divider)] bg-[var(--surface)] p-0.5 text-[11px]">
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    playTick("click");
                    setColorMetric(m.id);
                  }}
                  className={`px-2 py-0.5 rounded transition btn-tactile ${
                    colorMetric === m.id
                      ? "bg-[var(--surface-raised)] text-[var(--accent)] font-bold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg p-3 shadow-subtle">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {displaySymbols.map((s) => {
            const { label, value, color } = getMetricDisplay(s);
            const isPos = s.change_1d >= 0;
            const currencyPrefix = s.exchange === "NSE" ? "₹" : "$";
            return (
              <button
                key={s.symbol}
                onClick={() => {
                  playTick("click");
                  onSelectSymbol(s.symbol);
                }}
                className={`p-3 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-raised group cursor-pointer relative overflow-hidden flex flex-col justify-between ${getCellColor(s)}`}
                title={`${s.name} — Click to open Technical Workspace`}
              >
                {/* Top status stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2.5px] ${
                    isPos ? "bg-[var(--risk-success)]" : "bg-[var(--risk-critical)]"
                  } opacity-80 group-hover:opacity-100 transition-opacity`}
                />

                {/* Top row: ticker + name + exchange badge */}
                <div className="flex items-start justify-between gap-1 mb-1.5 pt-0.5">
                  <div className="min-w-0">
                    <span className="font-black text-[var(--text-primary)] text-sm leading-none block tracking-tight group-hover:text-[var(--accent)] transition-colors">
                      {s.symbol}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate block mt-0.5 max-w-[95px] font-sans">
                      {s.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex-shrink-0 ${
                      s.exchange === "NSE"
                        ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                        : "bg-blue-950/40 text-blue-400 border-blue-800/40"
                    }`}
                  >
                    {s.exchange}
                  </span>
                </div>

                {/* Primary metric value */}
                <div className="my-1">
                  <div
                    className={`text-xl font-black tabular-nums leading-none mb-0.5 ${color}`}
                  >
                    {value}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    {label}
                  </div>
                </div>

                {/* Price + 1D change */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--divider)]/40 mt-1">
                  <span className="text-[10px] text-[var(--text-secondary)] tabular-nums font-semibold">
                    {currencyPrefix}
                    {s.price.toFixed(0)}
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center gap-0.5 tabular-nums ${
                      isPos ? "text-[var(--risk-success)]" : "text-[var(--risk-critical)]"
                    }`}
                  >
                    {isPos ? (
                      <TrendUp size={10} weight="bold" />
                    ) : (
                      <TrendDown size={10} weight="bold" />
                    )}
                    {isPos ? "+" : ""}
                    {s.change_1d.toFixed(1)}%
                  </span>
                </div>

                {/* Cluster label */}
                <div className="text-[9px] text-[var(--text-muted)] mt-1.5 truncate opacity-75 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block flex-shrink-0 opacity-60" />
                  <span className="truncate">{s.clusterLabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-[var(--divider)] flex flex-wrap items-center gap-4 text-[10px] text-[var(--text-muted)]">
          <span className="font-semibold uppercase">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--risk-success-bg)] border border-[var(--risk-success-border)] inline-block" />
            High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-dim)] border border-[var(--accent-border)] inline-block" />
            Mid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--risk-critical-bg)] border border-[var(--risk-critical-border)] inline-block" />
            Low
          </span>
          <span className="ml-auto flex items-center gap-1">
            <ChartBar size={11} />
            Click any cell → opens Technical Workspace for that symbol
          </span>
        </div>
      </div>
    </div>
  );
};
