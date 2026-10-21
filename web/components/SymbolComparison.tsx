"use client";

import React, { useState, useMemo } from "react";
import { ArrowsLeftRight, CheckCircle } from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { playTick } from "../utils/audio";

interface SymbolComparisonProps {
  symbols: SymbolData[];
  initialSymbolA?: string;
  initialSymbolB?: string;
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

interface CompFactor {
  key: keyof SymbolData | "composite_score";
  label: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
  note?: string;
}

const COMPARISON_FACTORS: CompFactor[] = [
  {
    key: "composite_score",
    label: "Alpha Score",
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
    note: "0–100, higher = stronger multi-factor quality",
  },
  {
    key: "rsi_14",
    label: "RSI-14",
    format: (v) => v.toFixed(1),
    higherIsBetter: false,
    note: "Neutral 40–60, overbought >70, oversold <30",
  },
  {
    key: "volatility_30d",
    label: "30D Volatility %",
    format: (v) => v.toFixed(1) + "%",
    higherIsBetter: false,
    note: "Annualized realized vol — lower means more stable",
  },
  {
    key: "sharpe_proxy",
    label: "Sharpe Proxy",
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
    note: "vs 4.5% risk-free rate — higher is better",
  },
  {
    key: "bollinger_pct_b",
    label: "Bollinger %B",
    format: (v) => v.toFixed(2),
    higherIsBetter: false,
    note: ">1.0 upper breakout, <0 lower breakout",
  },
  {
    key: "change_1d",
    label: "1D Change %",
    format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  {
    key: "macd",
    label: "MACD",
    format: (v) => v.toFixed(3),
    higherIsBetter: true,
    note: "Positive MACD = bullish momentum",
  },
];

/** Normalize a factor value to 0–100 for the radar chart */
function normalize(key: string, s: SymbolData): number {
  switch (key) {
    case "composite_score":
      return Math.max(0, Math.min(100, deriveCompositeScore(s)));
    case "rsi_14":
      return Math.max(0, Math.min(100, s.rsi_14));
    case "volatility_30d":
      return Math.max(0, Math.min(100, 100 - s.volatility_30d * 2));
    case "sharpe_proxy":
      return Math.max(0, Math.min(100, s.sharpe_proxy * 35));
    case "bollinger_pct_b":
      return Math.max(0, Math.min(100, 50 + s.bollinger_pct_b * 50));
    case "change_1d":
      return Math.max(0, Math.min(100, 50 + s.change_1d * 8));
    case "macd":
      return Math.max(0, Math.min(100, 50 + s.macd * 400));
    default:
      return 50;
  }
}

/** Build radar SVG polygon points from 7 normalized values */
function radarPoints(values: number[], cx: number, cy: number, r: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const radius = (v / 100) * r;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    })
    .join(" ");
}

/** Build radar axis endpoints */
function axisPoints(
  n: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number; lx: number; ly: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (r + 20) * Math.cos(angle),
      ly: cy + (r + 20) * Math.sin(angle),
    };
  });
}

export const SymbolComparison: React.FC<SymbolComparisonProps> = ({
  symbols,
  initialSymbolA = "NVDA",
  initialSymbolB = "AAPL",
}) => {
  const [symbolA, setSymbolA] = useState(initialSymbolA);
  const [symbolB, setSymbolB] = useState(initialSymbolB);

  const sA = useMemo(() => symbols.find((s) => s.symbol === symbolA) || null, [symbols, symbolA]);
  const sB = useMemo(() => symbols.find((s) => s.symbol === symbolB) || null, [symbols, symbolB]);

  const getValue = (s: SymbolData | null, key: string): number => {
    if (!s) return 0;
    if (key === "composite_score") return deriveCompositeScore(s);
    return Number((s as unknown as Record<string, unknown>)[key]) || 0;
  };

  // Radar data with generous margin to avoid label clipping
  const radarAxes = axisPoints(COMPARISON_FACTORS.length, 160, 160, 92);
  const aValues = COMPARISON_FACTORS.map((f) =>
    normalize(f.key as string, sA || ({} as SymbolData))
  );
  const bValues = COMPARISON_FACTORS.map((f) =>
    normalize(f.key as string, sB || ({} as SymbolData))
  );
  const aPoints = sA ? radarPoints(aValues, 160, 160, 92) : "";
  const bPoints = sB ? radarPoints(bValues, 160, 160, 92) : "";

  // Radar ring levels
  const rings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Header + Symbol Selectors */}
      <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg p-3 shadow-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowsLeftRight
              size={15}
              weight="bold"
              className="text-[var(--accent)]"
            />
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Symbol Comparison
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Symbol A selector */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: "var(--accent)", opacity: 0.85 }}
              />
              <select
                value={symbolA}
                onChange={(e) => {
                  playTick("click");
                  setSymbolA(e.target.value);
                }}
                className="bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-primary)] text-[11px] rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                {symbols.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[var(--text-muted)] font-bold">vs</span>
            {/* Symbol B selector */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: "var(--risk-warning)", opacity: 0.85 }}
              />
              <select
                value={symbolB}
                onChange={(e) => {
                  playTick("click");
                  setSymbolB(e.target.value);
                }}
                className="bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-primary)] text-[11px] rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                {symbols.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Factor Comparison Table */}
        <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden shadow-subtle">
          {/* Column headers */}
          <div className="grid grid-cols-4 bg-[var(--surface-subtle)] border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] font-semibold uppercase">
            <div className="py-2.5 px-3 col-span-2">Factor</div>
            <div className="py-2.5 px-2 text-right" style={{ color: "var(--accent)" }}>
              {symbolA}
            </div>
            <div
              className="py-2.5 px-2 text-right"
              style={{ color: "var(--risk-warning)" }}
            >
              {symbolB}
            </div>
          </div>

          {/* Rows */}
          {COMPARISON_FACTORS.map((factor) => {
            const aVal = getValue(sA, factor.key as string);
            const bVal = getValue(sB, factor.key as string);
            const aWins = factor.higherIsBetter ? aVal > bVal : aVal < bVal;
            const bWins = factor.higherIsBetter ? bVal > aVal : bVal < aVal;
            const tied = aVal === bVal;
            return (
              <div
                key={factor.key as string}
                className="grid grid-cols-4 border-b border-[var(--divider)] hover:bg-[var(--surface-hover)] transition-colors"
                title={factor.note || ""}
              >
                <div className="py-2 px-3 col-span-2">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {factor.label}
                  </div>
                  {factor.note && (
                    <div className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">
                      {factor.note}
                    </div>
                  )}
                </div>
                <div
                  className={`py-2 px-2 text-right tabular-nums font-bold flex items-center justify-end gap-1 ${
                    aWins && !tied
                      ? "text-[var(--risk-success)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {aWins && !tied && (
                    <CheckCircle size={11} weight="fill" className="text-[var(--risk-success)]" />
                  )}
                  {factor.format(aVal)}
                </div>
                <div
                  className={`py-2 px-2 text-right tabular-nums font-bold flex items-center justify-end gap-1 ${
                    bWins && !tied
                      ? "text-[var(--risk-success)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {bWins && !tied && (
                    <CheckCircle size={11} weight="fill" className="text-[var(--risk-success)]" />
                  )}
                  {factor.format(bVal)}
                </div>
              </div>
            );
          })}

          {/* Footer: win count */}
          {sA && sB && (
            <div className="p-2.5 bg-[var(--surface-subtle)] flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>
                {symbolA} wins:{" "}
                <span
                  className="font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {
                    COMPARISON_FACTORS.filter((f) => {
                      const aV = getValue(sA, f.key as string);
                      const bV = getValue(sB, f.key as string);
                      return f.higherIsBetter ? aV > bV : aV < bV;
                    }).length
                  }/{COMPARISON_FACTORS.length}
                </span>
              </span>
              <span>
                {symbolB} wins:{" "}
                <span
                  className="font-bold"
                  style={{ color: "var(--risk-warning)" }}
                >
                  {
                    COMPARISON_FACTORS.filter((f) => {
                      const aV = getValue(sA, f.key as string);
                      const bV = getValue(sB, f.key as string);
                      return f.higherIsBetter ? bV > aV : bV < aV;
                    }).length
                  }/{COMPARISON_FACTORS.length}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg p-4 shadow-subtle flex flex-col items-center">
          <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-3">
            Factor Radar — Normalized 0–100
          </div>
          <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 320 }}>
            {/* Ring guides */}
            {rings.map((r) => (
              <polygon
                key={r}
                points={radarPoints(
                  new Array(COMPARISON_FACTORS.length).fill(r),
                  160,
                  160,
                  92
                )}
                fill="none"
                stroke="var(--divider)"
                strokeWidth="1"
                strokeDasharray={r === 100 ? undefined : "2 2"}
              />
            ))}
            {/* Axis lines */}
            {radarAxes.map((pt, i) => (
              <g key={i}>
                <line
                  x1={160}
                  y1={160}
                  x2={pt.x}
                  y2={pt.y}
                  stroke="var(--divider)"
                  strokeWidth="1"
                />
                <text
                  x={pt.lx}
                  y={pt.ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8.5"
                  fontWeight="600"
                  fill="var(--text-secondary)"
                  fontFamily="monospace"
                >
                  {COMPARISON_FACTORS[i].label.replace(" %", "").replace(" Proxy", "")}
                </text>
              </g>
            ))}
            {/* Polygon B (behind A) */}
            {sB && (
              <polygon
                points={bPoints}
                fill="var(--risk-warning)"
                fillOpacity="0.18"
                stroke="var(--risk-warning)"
                strokeWidth="2"
                strokeOpacity="0.85"
              />
            )}
            {/* Polygon A */}
            {sA && (
              <polygon
                points={aPoints}
                fill="var(--accent)"
                fillOpacity="0.22"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeOpacity="0.95"
              />
            )}
            {/* Data points A */}
            {sA &&
              aValues.map((v, i) => {
                const angle =
                  (Math.PI * 2 * i) / COMPARISON_FACTORS.length - Math.PI / 2;
                const r = (v / 100) * 92;
                return (
                  <circle
                    key={i}
                    cx={160 + r * Math.cos(angle)}
                    cy={160 + r * Math.sin(angle)}
                    r="3.5"
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                );
              })}
            {/* Data points B */}
            {sB &&
              bValues.map((v, i) => {
                const angle =
                  (Math.PI * 2 * i) / COMPARISON_FACTORS.length - Math.PI / 2;
                const r = (v / 100) * 92;
                return (
                  <circle
                    key={i}
                    cx={160 + r * Math.cos(angle)}
                    cy={160 + r * Math.sin(angle)}
                    r="3.5"
                    fill="var(--risk-warning)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                );
              })}
          </svg>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-0.5 inline-block"
                style={{ background: "var(--accent)" }}
              />
              <span style={{ color: "var(--accent)" }} className="font-bold">
                {symbolA}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-0.5 inline-block"
                style={{ background: "var(--risk-warning)" }}
              />
              <span style={{ color: "var(--risk-warning)" }} className="font-bold">
                {symbolB}
              </span>
            </span>
          </div>
          {/* Entity summary */}
          {sA && sB && (
            <div className="mt-3 w-full grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
                <div className="font-bold text-[var(--text-primary)] mb-0.5" style={{ color: "var(--accent)" }}>
                  {sA.symbol}
                </div>
                <div className="text-[var(--text-muted)] truncate">{sA.name}</div>
                <div className="text-[var(--text-muted)]">{sA.sector} · {sA.exchange}</div>
                <div className="text-[var(--text-primary)] font-bold mt-0.5">
                  {sA.exchange === "NSE" ? "₹" : "$"}{sA.price.toFixed(2)}
                </div>
              </div>
              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
                <div className="font-bold mb-0.5" style={{ color: "var(--risk-warning)" }}>
                  {sB.symbol}
                </div>
                <div className="text-[var(--text-muted)] truncate">{sB.name}</div>
                <div className="text-[var(--text-muted)]">{sB.sector} · {sB.exchange}</div>
                <div className="text-[var(--text-primary)] font-bold mt-0.5">
                  {sB.exchange === "NSE" ? "₹" : "$"}{sB.price.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
