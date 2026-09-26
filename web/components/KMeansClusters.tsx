"use client";

import React, { useState, useMemo } from "react";
import { 
  Graph, 
  Target, 
  ChartPolar, 
  TrendUp, 
  ShieldCheck, 
  ArrowClockwise, 
  Flame,
  Info
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { runFactorKMeans, ClusterInfo, ClusteredSymbol } from "../utils/kmeans";
import { playTick } from "../utils/audio";

interface KMeansClustersProps {
  symbols: SymbolData[];
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
  onOpenReport?: (symbol: string) => void;
}

export const KMeansClusters: React.FC<KMeansClustersProps> = ({
  symbols,
  onSelectSymbol,
  onOpenChart,
  onOpenReport,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<ClusteredSymbol | null>(null);

  const { clusteredSymbols, clusters } = useMemo(() => {
    return runFactorKMeans(symbols, 4);
  }, [symbols]);

  const activeCluster = useMemo(() => {
    if (selectedClusterId === null) return null;
    return clusters.find((c) => c.id === selectedClusterId) || null;
  }, [clusters, selectedClusterId]);

  // Scatter plot boundary dimensions
  const minVol = 12;
  const maxVol = 45;
  const minRsi = 15;
  const maxRsi = 85;

  // Projection onto 600x380 SVG coordinates
  const svgWidth = 640;
  const svgHeight = 360;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const getX = (vol: number) => {
    const clamped = Math.max(minVol, Math.min(maxVol, vol));
    return padLeft + ((clamped - minVol) / (maxVol - minVol)) * (svgWidth - padLeft - padRight);
  };

  const getY = (rsi: number) => {
    const clamped = Math.max(minRsi, Math.min(maxRsi, rsi));
    return svgHeight - padBottom - ((clamped - minRsi) / (maxRsi - minRsi)) * (svgHeight - padTop - padBottom);
  };

  const getClusterIcon = (label: string) => {
    switch (label) {
      case "MOMENTUM":
        return <TrendUp size={14} weight="bold" />;
      case "DEFENSIVE":
        return <ShieldCheck size={14} weight="bold" />;
      case "VALUE REVERT":
        return <ArrowClockwise size={14} weight="bold" />;
      default:
        return <Flame size={14} weight="bold" />;
    }
  };

  const getClusterBadgeColor = (shortLabel: string) => {
    switch (shortLabel) {
      case "MOMENTUM":
        return "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
      case "DEFENSIVE":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";
      case "VALUE REVERT":
        return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50";
      default:
        return "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50";
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-subtle transition-colors duration-200">
      {/* Header */}
      <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChartPolar size={16} weight="bold" className="text-[var(--accent)]" />
          <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs">
            K-Means Factor Cluster Decomposition (4-Dimensional Model)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
            k = 4 CENTROIDS
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <button
            onClick={() => {
              playTick("click");
              setSelectedClusterId(null);
            }}
            className={`px-2 py-1 rounded border text-[10px] font-bold transition ${
              selectedClusterId === null
                ? "bg-[var(--surface-active)] text-[var(--text-primary)] border-[var(--divider-strong)]"
                : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--divider)] hover:text-[var(--text-primary)]"
            }`}
          >
            Show All ({symbols.length})
          </button>
          {clusters.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                playTick("click");
                setSelectedClusterId(selectedClusterId === c.id ? null : c.id);
              }}
              className={`px-2 py-1 rounded border text-[10px] font-bold transition flex items-center gap-1.5 ${
                selectedClusterId === c.id
                  ? "ring-1 ring-[var(--accent)] bg-[var(--surface-active)] text-[var(--text-primary)] border-[var(--divider-strong)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--divider)] hover:text-[var(--text-primary)]"
              }`}
            >
              {getClusterIcon(c.shortLabel)}
              <span>{c.shortLabel}</span>
              <span className="opacity-60 text-[9px]">({c.symbols.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Scatter Matrix + Detail Inspector */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 2D Factor Scatter Map */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--divider)] rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <Target size={14} weight="bold" className="text-[var(--accent)]" />
                <span>Factor Dispersion Space: Volatility vs. Momentum (RSI-14)</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                Click bubble to select equity · Hover to inspect metrics
              </span>
            </div>

            {/* SVG Scatter Chart */}
            <div className="w-full overflow-x-auto flex justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-w-[640px] h-auto select-none"
              >
                {/* Background grid guides */}
                <g stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3">
                  {[20, 30, 40].map((v) => (
                    <line key={`v-${v}`} x1={getX(v)} y1={padTop} x2={getX(v)} y2={svgHeight - padBottom} />
                  ))}
                  {[30, 50, 70].map((r) => (
                    <line key={`r-${r}`} x1={padLeft} y1={getY(r)} x2={svgWidth - padRight} y2={getY(r)} />
                  ))}
                </g>

                {/* Quadrant Divider Labels */}
                <line
                  x1={getX(25)}
                  y1={padTop}
                  x2={getX(25)}
                  y2={svgHeight - padBottom}
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="1.5"
                />
                <line
                  x1={padLeft}
                  y1={getY(50)}
                  x2={svgWidth - padRight}
                  y2={getY(50)}
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="1.5"
                />

                {/* Axes */}
                <g stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5">
                  <line x1={padLeft} y1={svgHeight - padBottom} x2={svgWidth - padRight} y2={svgHeight - padBottom} />
                  <line x1={padLeft} y1={padTop} x2={padLeft} y2={svgHeight - padBottom} />
                </g>

                {/* X Axis Labels (Volatility) */}
                <g fill="currentColor" fillOpacity="0.6" className="text-[9px] font-bold" textAnchor="middle">
                  <text x={getX(15)} y={svgHeight - padBottom + 16}>15%</text>
                  <text x={getX(25)} y={svgHeight - padBottom + 16}>25% Vol</text>
                  <text x={getX(35)} y={svgHeight - padBottom + 16}>35%</text>
                  <text x={getX(45)} y={svgHeight - padBottom + 16}>45%</text>
                  <text x={(svgWidth + padLeft) / 2} y={svgHeight - 10} className="uppercase tracking-widest text-[10px]">
                    Annualized 30D Realized Volatility →
                  </text>
                </g>

                {/* Y Axis Labels (RSI-14) */}
                <g fill="currentColor" fillOpacity="0.6" className="text-[9px] font-bold" textAnchor="end">
                  <text x={padLeft - 8} y={getY(30) + 3}>30 (Oversold)</text>
                  <text x={padLeft - 8} y={getY(50) + 3}>50 (Neutral)</text>
                  <text x={padLeft - 8} y={getY(70) + 3}>70 (Overbought)</text>
                  <text
                    x={-svgHeight / 2}
                    y={14}
                    transform="rotate(-90)"
                    textAnchor="middle"
                    className="uppercase tracking-widest text-[10px]"
                  >
                    Wilder RSI-14 (Momentum) →
                  </text>
                </g>

                {/* Cluster Centroid Indicators */}
                {clusters.map((c) => {
                  const cx = getX(c.centroid.volatility_30d);
                  const cy = getY(c.centroid.rsi_14);
                  const isDimmed = selectedClusterId !== null && selectedClusterId !== c.id;

                  return (
                    <g key={`centroid-${c.id}`} className="transition-opacity duration-200" opacity={isDimmed ? 0.2 : 0.85}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="18"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        className="animate-spin-slow origin-center"
                      />
                      <circle cx={cx} cy={cy} r="4" fill="currentColor" opacity="0.4" />
                      <text
                        x={cx}
                        y={cy - 22}
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="8.5"
                        fontWeight="bold"
                        letterSpacing="0.05em"
                        className="uppercase"
                      >
                        μ: {c.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Equity Bubbles */}
                {clusteredSymbols.map((item) => {
                  const cx = getX(item.volatility_30d);
                  const cy = getY(item.rsi_14);
                  const isDimmed = selectedClusterId !== null && selectedClusterId !== item.clusterId;
                  const isHovered = hoveredSymbol?.symbol === item.symbol;

                  // Radius scaled with Sharpe proxy
                  const r = Math.max(7, Math.min(16, 7 + (item.sharpe_proxy || 0) * 4));

                  let bubbleColor = "#648BAE"; // Default Steel
                  if (item.clusterLabel === "DEFENSIVE") bubbleColor = "#15803D"; // Forest
                  else if (item.clusterLabel === "VALUE REVERT") bubbleColor = "#B45309"; // Amber
                  else if (item.clusterLabel === "HIGH BETA") bubbleColor = "#B91C1C"; // Crimson

                  return (
                    <g
                      key={`bubble-${item.symbol}`}
                      className="cursor-pointer transition-all duration-150"
                      opacity={isDimmed ? 0.15 : isHovered ? 1 : 0.85}
                      onMouseEnter={() => setHoveredSymbol(item)}
                      onMouseLeave={() => setHoveredSymbol(null)}
                      onClick={() => {
                        playTick("click");
                        onSelectSymbol(item.symbol);
                      }}
                    >
                      {/* Pulse ring on hover */}
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r + 5}
                          fill="none"
                          stroke={bubbleColor}
                          strokeWidth="2"
                          strokeOpacity="0.6"
                          className="animate-ping"
                        />
                      )}

                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={bubbleColor}
                        fillOpacity={isHovered ? 0.9 : 0.65}
                        stroke={bubbleColor}
                        strokeWidth={isHovered ? 2.5 : 1}
                      />

                      {/* Ticker text */}
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={item.symbol.length > 5 ? "7.5" : "8.5"}
                        fontWeight="900"
                        className="pointer-events-none drop-shadow-sm select-none"
                      >
                        {item.symbol.replace(".NS", "")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Interactive Inspection Banner */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-wrap items-center justify-between text-[11px] min-h-[36px]">
            {hoveredSymbol ? (
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-1.5">
                  <span>{hoveredSymbol.symbol}</span>
                  <span className="text-xs text-[var(--text-muted)] font-normal">({hoveredSymbol.name})</span>
                </span>
                <span className="text-[var(--text-muted)]">|</span>
                <span>
                  Cluster: <strong className="text-[var(--text-primary)]">{hoveredSymbol.clusterName}</strong>
                </span>
                <span className="text-[var(--text-muted)]">|</span>
                <span>RSI: <strong>{hoveredSymbol.rsi_14.toFixed(1)}</strong></span>
                <span>Vol: <strong>{hoveredSymbol.volatility_30d.toFixed(1)}%</strong></span>
                <span>Sharpe: <strong>{hoveredSymbol.sharpe_proxy.toFixed(2)}</strong></span>
                <span>Dist to Centroid: <strong>{hoveredSymbol.distanceToCentroid}σ</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Info size={14} weight="bold" />
                <span>Hover any equity point to inspect Euclidean distance from cluster centroid.</span>
              </div>
            )}

            {hoveredSymbol && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playTick("click");
                    if (onOpenChart) onOpenChart(hoveredSymbol.symbol);
                    else onSelectSymbol(hoveredSymbol.symbol);
                  }}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] hover:bg-[var(--surface-hover)] font-bold text-[10px]"
                >
                  View Chart
                </button>
                {onOpenReport && (
                  <button
                    onClick={() => {
                      playTick("click");
                      onOpenReport(hoveredSymbol.symbol);
                    }}
                    className="px-2 py-0.5 rounded bg-[var(--accent-dim)] border border-[var(--accent-border)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white font-bold text-[10px] transition"
                  >
                    Tear-Sheet (PDF)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Cluster Cards & Quantitative Profile */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="p-2 border-b border-[var(--divider)] pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {activeCluster ? `Cluster: ${activeCluster.name}` : "All 4 Factor Archetypes"}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {activeCluster ? `${activeCluster.symbols.length} Assets` : "16 Total Assets"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {clusters.map((c) => {
              const isSelected = selectedClusterId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    playTick("click");
                    setSelectedClusterId(selectedClusterId === c.id ? null : c.id);
                  }}
                  className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-[var(--surface-active)] border-[var(--divider-strong)] shadow-xs ring-1 ring-[var(--accent)]"
                      : "bg-[var(--surface-subtle)] border-[var(--divider)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                      {getClusterIcon(c.shortLabel)}
                      {c.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getClusterBadgeColor(c.shortLabel)}`}>
                      {c.shortLabel}
                    </span>
                  </div>

                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    {c.description}
                  </p>

                  {/* Centroid Metrics Bar */}
                  <div className="grid grid-cols-4 gap-1 text-[9px] text-center pt-1 border-t border-[var(--divider)]">
                    <div className="p-1 rounded bg-[var(--surface)]">
                      <div className="text-[var(--text-muted)] text-[8px]">AVG RSI</div>
                      <div className="font-bold text-[var(--text-primary)] mt-0.5">{c.meanRsi}</div>
                    </div>
                    <div className="p-1 rounded bg-[var(--surface)]">
                      <div className="text-[var(--text-muted)] text-[8px]">AVG VOL</div>
                      <div className="font-bold text-[var(--text-primary)] mt-0.5">{c.meanVol}%</div>
                    </div>
                    <div className="p-1 rounded bg-[var(--surface)]">
                      <div className="text-[var(--text-muted)] text-[8px]">AVG %B</div>
                      <div className="font-bold text-[var(--text-primary)] mt-0.5">{c.centroid.bollinger_pct_b}</div>
                    </div>
                    <div className="p-1 rounded bg-[var(--surface)]">
                      <div className="text-[var(--text-muted)] text-[8px]">SHARPE</div>
                      <div className="font-bold text-[var(--text-primary)] mt-0.5">{c.meanSharpe}</div>
                    </div>
                  </div>

                  {/* Member Tickers */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.symbols.map((s) => (
                      <span
                        key={s.symbol}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTick("click");
                          onSelectSymbol(s.symbol);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[10px] font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition select-none"
                      >
                        {s.symbol.replace(".NS", "")}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
