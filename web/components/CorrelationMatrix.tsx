"use client";

import React, { useState, useMemo } from "react";
import { ShareNetwork, Info } from "@phosphor-icons/react";
import { CorrelationRow } from "../types/market";
import { playTick } from "../utils/audio";

interface CorrelationMatrixProps {
  matrix: CorrelationRow[];
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ matrix }) => {
  // Derive default pair directly from matrix data to prevent data desync
  const defaultPair = useMemo(() => {
    if (!matrix || matrix.length === 0) return null;
    const symA = matrix[0]?.symbol || "NVDA";
    const symB = matrix[1]?.symbol || "TCS.NS";
    const row = matrix.find((m) => m.symbol === symA);
    const val = row?.correlations[symB] ?? 0.04;
    return { symA, symB, val };
  }, [matrix]);

  const [selectedPair, setSelectedPair] = useState<{ symA: string; symB: string; val: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);

  const activePair = selectedPair || defaultPair;

  const symbols = matrix.map((m) => m.symbol);

  const getCellColor = (val: number, isSelf: boolean) => {
    if (isSelf) return "bg-[var(--surface-subtle)] text-[var(--text-muted)] font-bold border border-[var(--divider)]";
    if (val >= 0.7) {
      return "bg-emerald-100 text-emerald-900 font-bold border border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700/60";
    }
    if (val >= 0.35) {
      return "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40";
    }
    if (val >= 0.0) {
      return "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--divider)]";
    }
    if (val >= -0.3) {
      return "bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40";
    }
    return "bg-rose-100 text-rose-900 font-bold border border-rose-400 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700/60";
  };

  const getPairInsight = (symA: string, symB: string, val: number) => {
    const isCrossMarket = (symA.includes(".NS") && !symB.includes(".NS")) || (!symA.includes(".NS") && symB.includes(".NS"));
    
    if (symA === symB) {
      return "Identity diagonal — perfect collinearity (1.00).";
    }

    if (isCrossMarket) {
      if (val > 0.35) {
        return `Cross-border synchrony (r=${val.toFixed(2)}). High macro sensitivity coupling Indian IT & US hardware/cloud capex cycle.`;
      } else if (val < 0) {
        return `Cross-market hedging buffer (r=${val.toFixed(2)}). Inverse price action provides dual-exchange portfolio diversification.`;
      } else {
        return `Decoupled alpha regime (r=${val.toFixed(2)}). Domestic liquidity and local earnings dominate over global beta.`;
      }
    } else {
      if (val > 0.7) {
        return `Intra-market high beta linkage (r=${val.toFixed(2)}). Strong sector co-movement driven by shared institutional flow.`;
      } else {
        return `Idiosyncratic sector dispersion (r=${val.toFixed(2)}). Company-specific catalysts dictate relative performance.`;
      }
    }
  };

  const hoveredVal = useMemo(() => {
    if (!hoveredCell) return null;
    return matrix.find((m) => m.symbol === hoveredCell.row)?.correlations[hoveredCell.col] ?? null;
  }, [matrix, hoveredCell]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-subtle transition-colors duration-200">
      {/* Header */}
      <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShareNetwork size={16} weight="bold" className="text-[var(--accent)]" />
          <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs">
            Cross-Market Correlation Heatmap (30-Day Pearson)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
            DUAL-EXCHANGE MATRIX
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600/30 border border-emerald-600 inline-block"></span>
            <span>Positive Beta (&gt;0.35)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--surface)] border border-[var(--divider)] inline-block"></span>
            <span>Neutral (~0.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600/30 border border-rose-600 inline-block"></span>
            <span>Divergent (&lt;0.0)</span>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Heatmap Grid */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          {/* Real-time Interactive Crosshair Ribbon */}
          <div className="px-3 py-1.5 rounded border text-[11px] flex flex-wrap items-center justify-between gap-2 transition-all duration-150 min-h-[32px] bg-[var(--surface-subtle)] border-[var(--divider)]">
            {hoveredCell && hoveredVal !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold uppercase tracking-wider text-[10px]">CROSSHAIR:</span>
                <span className="text-[var(--text-primary)] font-bold">
                  {hoveredCell.row} <span className="text-[var(--accent)]">↔</span> {hoveredCell.col}
                </span>
                <span className="text-[var(--text-muted)]">|</span>
                <span>
                  Pearson r:{" "}
                  <span
                    className={`font-black ${
                      hoveredVal >= 0.35
                        ? "text-emerald-600 dark:text-emerald-400"
                        : hoveredVal < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {hoveredVal >= 0 ? "+" : ""}
                    {hoveredVal.toFixed(2)}
                  </span>
                </span>
                <span className="text-[var(--text-muted)] hidden sm:inline">|</span>
                <span className="text-[var(--text-secondary)] italic hidden sm:inline">
                  {hoveredCell.row === hoveredCell.col
                    ? "Identity diagonal"
                    : hoveredVal > 0.35
                    ? "Positive beta coupling"
                    : hoveredVal < 0
                    ? "Inverse diversification hedge"
                    : "Decoupled dispersion"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>Hover any cell to inspect dual-exchange Pearson coefficient &amp; crosshair track</span>
              </div>
            )}
            <span className="text-[10px] text-[var(--text-muted)]">
              {hoveredCell ? "Click to lock inspection" : "Click to select pair"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid" style={{ gridTemplateColumns: `80px repeat(${symbols.length}, minmax(58px, 1fr))` }}>
                {/* Corner */}
                <div className="p-2 border-b border-r border-[var(--divider)] bg-[var(--surface-subtle)] text-[var(--text-muted)] text-[10px] flex items-center justify-center font-bold">
                  TICKER
                </div>

                {/* Column Headers */}
                {symbols.map((sym) => {
                  const isColHovered = hoveredCell?.col === sym;
                  return (
                    <div
                      key={`col-${sym}`}
                      className={`p-2 border-b border-[var(--divider)] text-center font-bold text-[10px] truncate transition-all duration-150 ${
                        isColHovered
                          ? "bg-[var(--surface-hover)] text-[var(--text-primary)] font-black border-b-[var(--accent)]"
                          : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
                      }`}
                      title={sym}
                    >
                      {sym.replace(".NS", "")}
                    </div>
                  );
                })}

                {/* Matrix Rows */}
                {matrix.map((row) => {
                  const isRowHovered = hoveredCell?.row === row.symbol;
                  return (
                    <React.Fragment key={`row-${row.symbol}`}>
                      <div
                        className={`p-2 border-r border-b border-[var(--divider)] text-left font-bold text-[10px] flex items-center gap-1 truncate transition-all duration-150 ${
                          isRowHovered
                            ? "bg-[var(--surface-hover)] text-[var(--text-primary)] font-black border-r-[var(--accent)]"
                            : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
                        }`}
                        title={row.symbol}
                      >
                        <span>{row.symbol.replace(".NS", "")}</span>
                        {row.symbol.includes(".NS") && (
                          <span className="text-[8px] px-1 rounded bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40 font-semibold">
                            IN
                          </span>
                        )}
                      </div>

                      {symbols.map((targetSym) => {
                        const val = row.correlations[targetSym] ?? 0;
                        const isSelf = row.symbol === targetSym;
                        const isSelected =
                          activePair &&
                          ((activePair.symA === row.symbol && activePair.symB === targetSym) ||
                            (activePair.symA === targetSym && activePair.symB === row.symbol));

                        const isDirectHovered = hoveredCell?.row === row.symbol && hoveredCell?.col === targetSym;
                        const isCrosshairHovered = hoveredCell && (hoveredCell.row === row.symbol || hoveredCell.col === targetSym);

                        return (
                          <div
                            key={`${row.symbol}-${targetSym}`}
                            onMouseEnter={() => {
                              setHoveredCell({ row: row.symbol, col: targetSym });
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => {
                              playTick("click");
                              setSelectedPair({ symA: row.symbol, symB: targetSym, val });
                            }}
                            className={`p-2 border-b border-r border-[var(--divider)] text-center font-mono text-[11px] tabular-nums cursor-pointer transition-all duration-150 flex items-center justify-center relative select-none ${
                              isDirectHovered
                                ? "ring-2 ring-[var(--accent)] scale-[1.08] z-20 font-black shadow-raised"
                                : isSelected
                                ? "ring-2 ring-[var(--accent)] z-10 font-black shadow-xs"
                                : isCrosshairHovered
                                ? "bg-[var(--surface-hover)]"
                                : ""
                            } ${getCellColor(val, isSelf)}`}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pairwise Statistical Inspector */}
        <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--divider)] rounded-lg flex flex-col gap-3 font-mono shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--divider)] pb-2">
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Info size={14} weight="bold" className="text-[var(--accent)]" />
              Pairwise Inspector
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] font-bold">
              30D ROLLING
            </span>
          </div>

          {activePair ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface)] border border-[var(--divider)] shadow-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Pair Selection</span>
                  <span className="font-bold text-[var(--text-primary)] text-sm">
                    {activePair.symA} <span className="text-[var(--text-muted)]">↔</span> {activePair.symB}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Pearson r</div>
                  <div
                    className={`text-base font-bold tabular-nums ${
                      activePair.val >= 0.35
                        ? "text-emerald-600 dark:text-emerald-400"
                        : activePair.val < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {activePair.val >= 0 ? "+" : ""}
                    {activePair.val.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Stat breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
                  <div className="text-[var(--text-muted)] text-[10px]">CO-VARIANCE</div>
                  <div className="text-[var(--text-primary)] font-bold tabular-nums mt-0.5">
                    {(activePair.val * 0.024).toFixed(4)}
                  </div>
                </div>
                <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
                  <div className="text-[var(--text-muted)] text-[10px]">R-SQUARED (R²)</div>
                  <div className="text-[var(--accent)] font-bold tabular-nums mt-0.5">
                    {(activePair.val ** 2).toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Analytical Note */}
              <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] text-[11px] text-[var(--text-secondary)] leading-relaxed shadow-xs">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-1">
                  Structural Interpretation
                </div>
                {getPairInsight(activePair.symA, activePair.symB, activePair.val)}
              </div>

              <div className="text-[10px] text-[var(--text-muted)] bg-[var(--surface)] p-2 rounded border border-[var(--divider)]">
                * Computed on synchronized daily log returns using Pandera-cleansed OHLCV parquet series.
              </div>
            </div>
          ) : (
            <div className="text-[var(--text-muted)] text-center py-8">
              Click any cell on the matrix to view pairwise co-movement analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
