"use client";

import React, { useMemo } from "react";
import {
  TrendUp,
  TrendDown,
  ArrowClockwise,
  Flame,
  ShieldCheck,
  X,
  Lightning,
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { playTick } from "../utils/audio";

interface AlphaBriefingProps {
  symbols: SymbolData[];
  generatedAt: string; // from data.metadata.generated_at
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
}

/** Composite score — same formula as ScreenerTable (equal default weights) */
function getCompositeScore(s: SymbolData): number {
  const momNorm = s.rsi_14;
  const volNorm = Math.max(0, 100 - s.volatility_30d * 2.2);
  const sharpeNorm = Math.min(100, Math.max(0, s.sharpe_proxy * 35));
  const revNorm = Math.max(0, (1 - s.bollinger_pct_b) * 100);
  return (
    Math.round(
      ((momNorm * 35 + volNorm * 25 + sharpeNorm * 25 + revNorm * 15) / 100) *
        10
    ) / 10
  );
}

export const AlphaBriefing: React.FC<AlphaBriefingProps> = ({
  symbols,
  generatedAt,
  isOpen,
  onClose,
  onSelectSymbol,
}) => {
  const ranked = useMemo(
    () => [...symbols].sort((a, b) => getCompositeScore(b) - getCompositeScore(a)),
    [symbols]
  );

  const top3 = ranked.slice(0, 3);
  const overbought = symbols.filter((s) => s.rsi_14 > 70);
  const oversold = symbols.filter((s) => s.rsi_14 < 30);
  const topGainers = [...symbols]
    .sort((a, b) => b.change_1d - a.change_1d)
    .slice(0, 2);
  const topLosers = [...symbols]
    .sort((a, b) => a.change_1d - b.change_1d)
    .slice(0, 2);

  const avgAlpha =
    symbols.reduce((a, s) => a + getCompositeScore(s), 0) /
    (symbols.length || 1);
  const avgRsi =
    symbols.reduce((a, s) => a + s.rsi_14, 0) / (symbols.length || 1);
  const avgVol =
    symbols.reduce((a, s) => a + s.volatility_30d, 0) / (symbols.length || 1);
  const advances = symbols.filter((s) => s.change_1d >= 0).length;
  const declines = symbols.length - advances;

  if (!isOpen) return null;

  return (
    <div className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-3 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
              <Lightning size={12} weight="fill" />
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Alpha Briefing
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              — Data:{" "}
              {new Date(generatedAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <button
            onClick={() => {
              playTick("click");
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile"
            title="Close Alpha Briefing (B)"
          >
            <X size={13} weight="bold" />
          </button>
        </div>

        {/* Signal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* Top Alpha */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)]">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-1.5 flex items-center gap-1">
              <TrendUp size={11} weight="bold" className="text-[var(--risk-success)]" />
              Top Alpha Score
            </div>
            {top3.map((s) => (
              <button
                key={s.symbol}
                onClick={() => {
                  playTick("click");
                  onSelectSymbol(s.symbol);
                }}
                className="flex items-center justify-between w-full hover:text-[var(--accent)] transition group mb-0.5"
              >
                <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                  {s.symbol}
                </span>
                <span className="tabular-nums text-[var(--risk-success)] font-black">
                  {getCompositeScore(s).toFixed(1)}
                </span>
              </button>
            ))}
          </div>

          {/* RSI Signals */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)]">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-1.5 flex items-center gap-1">
              <ArrowClockwise size={11} weight="bold" className="text-[var(--risk-warning)]" />
              RSI Signals
            </div>
            {overbought.length > 0 && (
              <div className="mb-1">
                <div className="text-[9px] text-[var(--risk-critical)] font-semibold mb-0.5">
                  Overbought (RSI &gt; 70)
                </div>
                {overbought.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      playTick("click");
                      onSelectSymbol(s.symbol);
                    }}
                    className="flex items-center justify-between w-full hover:text-[var(--accent)] transition mb-0.5 group"
                  >
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      {s.symbol}
                    </span>
                    <span className="tabular-nums text-[var(--risk-critical)] font-bold">
                      {s.rsi_14.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {oversold.length > 0 && (
              <div>
                <div className="text-[9px] text-[var(--risk-warning)] font-semibold mb-0.5">
                  Oversold (RSI &lt; 30)
                </div>
                {oversold.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      playTick("click");
                      onSelectSymbol(s.symbol);
                    }}
                    className="flex items-center justify-between w-full hover:text-[var(--accent)] transition mb-0.5 group"
                  >
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      {s.symbol}
                    </span>
                    <span className="tabular-nums text-[var(--risk-warning)] font-bold">
                      {s.rsi_14.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {overbought.length === 0 && oversold.length === 0 && (
              <div className="text-[10px] text-[var(--text-muted)]">
                No extreme RSI readings
              </div>
            )}
          </div>

          {/* Session Movers */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)]">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-1.5 flex items-center gap-1">
              <Flame size={11} weight="bold" className="text-[var(--risk-critical)]" />
              Session Movers
            </div>
            <div className="mb-1">
              <div className="text-[9px] text-[var(--risk-success)] font-semibold mb-0.5">
                Gainers
              </div>
              {topGainers.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => {
                    playTick("click");
                    onSelectSymbol(s.symbol);
                  }}
                  className="flex items-center justify-between w-full hover:text-[var(--accent)] transition mb-0.5 group"
                >
                  <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                    {s.symbol}
                  </span>
                  <span className="tabular-nums text-[var(--risk-success)] font-bold">
                    +{s.change_1d.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
            <div>
              <div className="text-[9px] text-[var(--risk-critical)] font-semibold mb-0.5">
                Losers
              </div>
              {topLosers.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => {
                    playTick("click");
                    onSelectSymbol(s.symbol);
                  }}
                  className="flex items-center justify-between w-full hover:text-[var(--accent)] transition mb-0.5 group"
                >
                  <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                    {s.symbol}
                  </span>
                  <span className="tabular-nums text-[var(--risk-critical)] font-bold">
                    {s.change_1d.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Universe Stats */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)]">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-1.5 flex items-center gap-1">
              <ShieldCheck size={11} weight="bold" className="text-[var(--accent)]" />
              Universe Stats
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg Alpha</span>
                <span className="tabular-nums font-bold text-[var(--text-primary)]">
                  {avgAlpha.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg RSI</span>
                <span className="tabular-nums font-bold text-[var(--text-primary)]">
                  {avgRsi.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg Vol 30D</span>
                <span className="tabular-nums font-bold text-[var(--text-primary)]">
                  {avgVol.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Advances</span>
                <span className="tabular-nums font-bold text-[var(--risk-success)]">
                  {advances}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Declines</span>
                <span className="tabular-nums font-bold text-[var(--risk-critical)]">
                  {declines}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Overbought</span>
                <span
                  className={`tabular-nums font-bold ${
                    overbought.length > 0
                      ? "text-[var(--risk-critical)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {overbought.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-mono">
          <TrendDown size={10} />
          <span>
            Click any symbol to open Technical Workspace · Press{" "}
            <kbd className="px-1 rounded bg-[var(--surface)] border border-[var(--divider)] text-[9px]">
              B
            </kbd>{" "}
            to toggle briefing
          </span>
        </div>
      </div>
    </div>
  );
};
