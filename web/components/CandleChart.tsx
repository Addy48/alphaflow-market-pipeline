"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
  Calendar,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react";
import { SymbolData, CandleData } from "../types/market";
import { RadialGauge } from "./RadialGauge";
import { playTick } from "../utils/audio";

interface CandleChartProps {
  symbols: SymbolData[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  symbols,
  selectedSymbol,
  onSelectSymbol
}) => {
  const [timeframe, setTimeframe] = useState<"1W" | "1M" | "3M" | "ALL">("3M");
  const [showMA20, setShowMA20] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ svgX: number; svgY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Active Symbol Object
  const currentSymbol = useMemo(() => {
    return symbols.find((s) => s.symbol === selectedSymbol) || symbols[0];
  }, [symbols, selectedSymbol]);

  // Compute Alpha Score for current symbol
  const alphaScore = useMemo(() => {
    if (!currentSymbol) return 50;
    return Math.min(
      100,
      Math.max(
        0,
        currentSymbol.rsi_14 * 0.35 +
        (100 - Math.min(currentSymbol.volatility_30d, 50) * 1.6) * 0.25 +
        Math.min(currentSymbol.sharpe_proxy * 28, 100) * 0.25 +
        currentSymbol.bollinger_pct_b * 15
      )
    );
  }, [currentSymbol]);

  // Filtered Candles by timeframe
  const candles = useMemo(() => {
    if (!currentSymbol || !currentSymbol.candles) return [];
    const all = currentSymbol.candles;
    if (timeframe === "1W") return all.slice(-7);
    if (timeframe === "1M") return all.slice(-21);
    if (timeframe === "3M") return all.slice(-45);
    return all;
  }, [currentSymbol, timeframe]);

  // Calculation of Chart Bounds
  const { minPrice, maxPrice, maxVolume, minMACD, maxMACD } = useMemo(() => {
    if (!candles.length) return { minPrice: 0, maxPrice: 100, maxVolume: 1, minMACD: -1, maxMACD: 1 };

    let minP = Infinity;
    let maxP = -Infinity;
    let maxV = 0;
    let minM = -0.5;
    let maxM = 0.5;

    candles.forEach((c) => {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (showBollinger && c.bb_lower && c.bb_lower < minP) minP = c.bb_lower;
      if (showBollinger && c.bb_upper && c.bb_upper > maxP) maxP = c.bb_upper;
      if (c.volume > maxV) maxV = c.volume;

      if (c.macd !== null && c.macd !== undefined) {
        if (c.macd < minM) minM = c.macd;
        if (c.macd > maxM) maxM = c.macd;
      }
      if (c.macd_signal !== null && c.macd_signal !== undefined) {
        if (c.macd_signal < minM) minM = c.macd_signal;
        if (c.macd_signal > maxM) maxM = c.macd_signal;
      }
    });

    const pad = (maxP - minP) * 0.06 || 1;
    return {
      minPrice: minP - pad,
      maxPrice: maxP + pad,
      maxVolume: maxV || 1,
      minMACD: minM * 1.2,
      maxMACD: maxM * 1.2
    };
  }, [candles, showBollinger]);

  // Active hover candle or latest candle
  const activeCandle: CandleData | null = useMemo(() => {
    if (!candles.length) return null;
    if (hoverIndex !== null && candles[hoverIndex]) {
      return candles[hoverIndex];
    }
    return candles[candles.length - 1];
  }, [candles, hoverIndex]);

  // Coordinate Transformers
  const chartHeight = 320;
  const macdHeight = showMACD ? 110 : 0;
  const totalHeight = chartHeight + macdHeight;
  const width = 760;
  const candleSlot = candles.length > 0 ? width / candles.length : 1;
  const candleWidth = Math.max(candleSlot * 0.65, 3);

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - 30) - 15;
  };

  const getMACDY = (val: number) => {
    const range = maxMACD - minMACD || 1;
    return macdHeight - ((val - minMACD) / range) * (macdHeight - 20) - 10;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Normalize screen coordinates precisely to SVG viewBox space (760 x totalHeight)
    const svgX = Math.max(0, Math.min(width, ((e.clientX - rect.left) / rect.width) * width));
    const svgY = Math.max(0, Math.min(totalHeight, ((e.clientY - rect.top) / rect.height) * totalHeight));

    const idx = Math.max(0, Math.min(candles.length - 1, Math.floor(svgX / candleSlot)));
    if (idx !== hoverIndex) {
      setHoverIndex(idx);
    }
    setHoverCoords({ svgX, svgY });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverCoords(null);
  };

  // Hover Price on right axis
  const hoverPrice = useMemo(() => {
    if (!hoverCoords || hoverCoords.svgY > chartHeight) return null;
    const yRatio = (chartHeight - 15 - hoverCoords.svgY) / (chartHeight - 30);
    const p = minPrice + yRatio * (maxPrice - minPrice);
    return Math.max(minPrice, Math.min(maxPrice, p));
  }, [hoverCoords, chartHeight, minPrice, maxPrice]);

  // Hover MACD value on right axis
  const hoverMACD = useMemo(() => {
    if (!showMACD || !hoverCoords || hoverCoords.svgY <= chartHeight) return null;
    const localY = hoverCoords.svgY - chartHeight;
    const valRatio = (macdHeight - 10 - localY) / (macdHeight - 20);
    const val = minMACD + valRatio * (maxMACD - minMACD);
    return Math.max(minMACD, Math.min(maxMACD, val));
  }, [showMACD, hoverCoords, chartHeight, macdHeight, minMACD, maxMACD]);

  const currencySymbol = currentSymbol?.exchange === "NSE" ? "₹" : "$";

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-subtle transition-colors duration-200">
      {/* Workspace Header & Quick Symbol Switcher */}
      <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[var(--text-primary)] tracking-wide">
                {currentSymbol.symbol}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  currentSymbol.exchange === "NSE"
                    ? "bg-amber-950/60 text-amber-300 border border-amber-800/50"
                    : "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                }`}
              >
                {currentSymbol.exchange}
              </span>
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">
                {currentSymbol.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                {currencySymbol}
                {currentSymbol.price.toFixed(2)}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${
                  currentSymbol.change_1d >= 0
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                    : "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                }`}
              >
                {currentSymbol.change_1d >= 0 ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
                {currentSymbol.change_1d >= 0 ? "+" : ""}
                {currentSymbol.change_1d.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Timeframe & Overlays Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex rounded border border-[var(--divider)] bg-[var(--surface)] p-0.5 text-[11px]">
              {(["1W", "1M", "3M", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    playTick("click");
                    setTimeframe(tf);
                  }}
                  className={`px-2 py-0.5 rounded transition btn-tactile ${
                    timeframe === tf
                      ? "bg-[var(--surface-raised)] text-cyan-500 font-bold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Overlays */}
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => {
                  playTick("toggle");
                  setShowMA20(!showMA20);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition btn-tactile ${
                  showMA20
                    ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-400 font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                <span className="w-2 h-0.5 bg-cyan-400 inline-block"></span>
                <span>MA20</span>
              </button>

              <button
                onClick={() => {
                  playTick("toggle");
                  setShowBollinger(!showBollinger);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition btn-tactile ${
                  showBollinger
                    ? "border-purple-500/50 bg-purple-950/40 text-purple-300 font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                <span className="w-2 h-0.5 bg-purple-400 inline-block"></span>
                <span>BOLL</span>
              </button>

              <button
                onClick={() => {
                  playTick("toggle");
                  setShowVolume(!showVolume);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition btn-tactile ${
                  showVolume
                    ? "border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                <span className="w-2 h-0.5 bg-amber-400 inline-block"></span>
                <span>VOL</span>
              </button>

              <button
                onClick={() => {
                  playTick("toggle");
                  setShowMACD(!showMACD);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition btn-tactile ${
                  showMACD
                    ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold"
                    : "border-[var(--divider)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span>
                <span>MACD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Ticker Switcher Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mr-1">
            Switch:
          </span>
          {symbols.map((s) => (
            <button
              key={s.symbol}
              onClick={() => {
                playTick("click");
                onSelectSymbol(s.symbol);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-all border btn-tactile ${
                s.symbol === currentSymbol.symbol
                  ? "bg-cyan-950/80 border-cyan-500 text-cyan-400 font-bold shadow-xs"
                  : "bg-[var(--surface)] border-[var(--divider)] text-[var(--text-secondary)] hover:border-cyan-500/60 hover:text-cyan-300 hover:bg-cyan-950/20 hover:scale-[1.02]"
              }`}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Body + Diagnostics Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--divider)]">
        {/* Left 3 cols: High-Res SVG Chart */}
        <div className="lg:col-span-3 p-3 flex flex-col" ref={containerRef}>
          {/* Active Hover Inspector Bar */}
          {activeCandle && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 mb-2 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[11px]">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} weight="bold" className="text-[var(--text-muted)]" />
                <span className="text-[var(--text-primary)] font-bold">{activeCandle.date}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 tabular-nums text-[var(--text-secondary)]">
                <span>
                  O: <span className="text-[var(--text-primary)]">{activeCandle.open}</span>
                </span>
                <span>
                  H: <span className="text-[var(--text-primary)]">{activeCandle.high}</span>
                </span>
                <span>
                  L: <span className="text-[var(--text-primary)]">{activeCandle.low}</span>
                </span>
                <span>
                  C:{" "}
                  <span
                    className={`font-bold ${
                      activeCandle.close >= activeCandle.open
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {activeCandle.close}
                  </span>
                </span>
                <span>
                  Vol:{" "}
                  <span className="text-[var(--text-primary)]">
                    {(activeCandle.volume / 1000000).toFixed(2)}M
                  </span>
                </span>
                {showMA20 && activeCandle.ma20 && (
                  <span className="text-cyan-500 font-semibold">
                    MA20: {activeCandle.ma20}
                  </span>
                )}
                {showBollinger && activeCandle.bb_upper && (
                  <span className="text-purple-500 font-semibold">
                    %B: {currentSymbol.bollinger_pct_b}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${chartHeight + macdHeight}`}
              className="w-full h-auto cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Horizontal Gridlines & Price Labels */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const priceVal = minPrice + (maxPrice - minPrice) * (1 - ratio);
                const y = getY(priceVal);
                return (
                  <g key={ratio}>
                    <line
                      x1={0}
                      y1={y}
                      x2={width - 55}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="3,3"
                      strokeWidth="0.75"
                    />
                    <text
                      x={width - 50}
                      y={y + 3}
                      fill="currentColor"
                      fillOpacity="0.5"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {priceVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Bollinger Band Cloud */}
              {showBollinger && (
                <path
                  d={
                    candles.reduce((acc, c, idx) => {
                      if (!c.bb_upper) return acc;
                      const x = idx * candleSlot + candleSlot / 2;
                      const y = getY(c.bb_upper);
                      return `${acc} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    }, "") +
                    candles
                      .slice()
                      .reverse()
                      .reduce((acc, c, idx) => {
                        if (!c.bb_lower) return acc;
                        const realIdx = candles.length - 1 - idx;
                        const x = realIdx * candleSlot + candleSlot / 2;
                        const y = getY(c.bb_lower);
                        return `${acc} L ${x} ${y}`;
                      }, "") +
                    " Z"
                  }
                  fill="rgba(168, 85, 247, 0.08)"
                />
              )}

              {/* Bollinger Upper & Lower Lines */}
              {showBollinger && (
                <>
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    points={candles
                      .map((c, idx) => {
                        if (!c.bb_upper) return "";
                        const x = idx * candleSlot + candleSlot / 2;
                        const y = getY(c.bb_upper);
                        return `${x},${y}`;
                      })
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    points={candles
                      .map((c, idx) => {
                        if (!c.bb_lower) return "";
                        const x = idx * candleSlot + candleSlot / 2;
                        const y = getY(c.bb_lower);
                        return `${x},${y}`;
                      })
                      .filter(Boolean)
                      .join(" ")}
                  />
                </>
              )}

              {/* MA20 Line */}
              {showMA20 && (
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  points={candles
                    .map((c, idx) => {
                      if (!c.ma20) return "";
                      const x = idx * candleSlot + candleSlot / 2;
                      const y = getY(c.ma20);
                      return `${x},${y}`;
                    })
                    .filter(Boolean)
                    .join(" ")}
                />
              )}

              {/* Volume Bars at bottom of chart */}
              {showVolume &&
                candles.map((c, idx) => {
                  const x = idx * candleSlot + (candleSlot - candleWidth) / 2;
                  const vHeight = (c.volume / maxVolume) * 50;
                  const y = chartHeight - vHeight - 5;
                  const isUp = c.close >= c.open;
                  return (
                    <rect
                      key={`vol-${idx}`}
                      x={x}
                      y={y}
                      width={candleWidth}
                      height={vHeight}
                      fill={isUp ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}
                    />
                  );
                })}

              {/* Candlesticks (Wick + Body) */}
              {candles.map((c, idx) => {
                const xCenter = idx * candleSlot + candleSlot / 2;
                const x = idx * candleSlot + (candleSlot - candleWidth) / 2;
                const isUp = c.close >= c.open;
                const bodyTop = getY(Math.max(c.open, c.close));
                const bodyBottom = getY(Math.min(c.open, c.close));
                const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);
                const highY = getY(c.high);
                const lowY = getY(c.low);

                const color = isUp ? "#10b981" : "#f43f5e";

                const isHovered = hoverIndex === idx;

                return (
                  <g key={`candle-${idx}`}>
                    {/* Wick */}
                    <line
                      x1={xCenter}
                      y1={highY}
                      x2={xCenter}
                      y2={lowY}
                      stroke={color}
                      strokeWidth={isHovered ? "1.8" : "1.2"}
                      opacity={hoverIndex !== null && !isHovered ? 0.7 : 1}
                    />
                    {/* Candle Body */}
                    <rect
                      x={x}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      stroke={isHovered ? "#ffffff" : "none"}
                      strokeWidth={isHovered ? 1.2 : 0}
                      rx="0.5"
                      opacity={hoverIndex !== null && !isHovered ? 0.75 : 1}
                    />
                    {/* Active Candle Close Price Indicator Dot */}
                    {isHovered && (
                      <circle
                        cx={xCenter}
                        cy={getY(c.close)}
                        r="3.5"
                        fill="#ffffff"
                        stroke={color}
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}

              {/* Interactive Dual Crosshairs */}
              {hoverIndex !== null && hoverIndex < candles.length && hoverCoords && (
                <g pointerEvents="none">
                  {/* Vertical Candle Column Highlight */}
                  <rect
                    x={hoverIndex * candleSlot}
                    y={0}
                    width={candleSlot}
                    height={chartHeight}
                    fill="currentColor"
                    fillOpacity="0.04"
                  />

                  {/* Vertical Hairline Crosshair */}
                  <line
                    x1={hoverIndex * candleSlot + candleSlot / 2}
                    y1={0}
                    x2={hoverIndex * candleSlot + candleSlot / 2}
                    y2={totalHeight}
                    stroke="#38bdf8"
                    strokeWidth="0.85"
                    strokeDasharray="3,3"
                    opacity="0.85"
                  />

                  {/* Floating Date Badge on Bottom Axis */}
                  <g
                    transform={`translate(${Math.max(
                      38,
                      Math.min(width - 95, hoverIndex * candleSlot + candleSlot / 2)
                    )}, ${chartHeight - 4})`}
                  >
                    <rect
                      x={-34}
                      y={-15}
                      width={68}
                      height={16}
                      rx={3}
                      fill="#090d16"
                      stroke="#0284c7"
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={-3.5}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {candles[hoverIndex]?.date}
                    </text>
                  </g>

                  {/* Horizontal Price Crosshair + Right Badge */}
                  {hoverCoords.svgY <= chartHeight && hoverPrice !== null && (
                    <g>
                      <line
                        x1={0}
                        y1={hoverCoords.svgY}
                        x2={width - 55}
                        y2={hoverCoords.svgY}
                        stroke="#38bdf8"
                        strokeWidth="0.85"
                        strokeDasharray="3,3"
                        opacity="0.85"
                      />
                      <g
                        transform={`translate(${width - 54}, ${Math.max(
                          12,
                          Math.min(chartHeight - 12, hoverCoords.svgY)
                        )})`}
                      >
                        <rect
                          x={0}
                          y={-9}
                          width={52}
                          height={18}
                          rx={3}
                          fill="#0284c7"
                        />
                        <text
                          x={26}
                          y={3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {hoverPrice.toFixed(2)}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Horizontal MACD Crosshair + Right Badge */}
                  {showMACD && hoverCoords.svgY > chartHeight && hoverMACD !== null && (
                    <g>
                      <line
                        x1={0}
                        y1={hoverCoords.svgY}
                        x2={width - 55}
                        y2={hoverCoords.svgY}
                        stroke="#10b981"
                        strokeWidth="0.85"
                        strokeDasharray="3,3"
                        opacity="0.85"
                      />
                      <g
                        transform={`translate(${width - 54}, ${Math.max(
                          chartHeight + 10,
                          Math.min(totalHeight - 10, hoverCoords.svgY)
                        )})`}
                      >
                        <rect
                          x={0}
                          y={-9}
                          width={52}
                          height={18}
                          rx={3}
                          fill="#059669"
                        />
                        <text
                          x={26}
                          y={3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {hoverMACD.toFixed(2)}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* MACD Sub-Panel */}
              {showMACD && (
                <g transform={`translate(0, ${chartHeight})`}>
                  {/* Divider */}
                  <line x1={0} y1={0} x2={width} y2={0} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
                  <rect
                    x={0}
                    y={0}
                    width={width}
                    height={macdHeight}
                    fill="currentColor"
                    fillOpacity="0.02"
                  />

                  {/* Title */}
                  <text x={8} y={16} fill="currentColor" fillOpacity="0.6" fontSize="9" fontWeight="bold">
                    MACD (12, 26, 9)
                  </text>

                  {/* Zero Line */}
                  <line
                    x1={0}
                    y1={getMACDY(0)}
                    x2={width - 55}
                    y2={getMACDY(0)}
                    stroke="currentColor"
                    strokeOpacity="0.15"
                    strokeDasharray="2,2"
                  />

                  {/* MACD Histogram */}
                  {candles.map((c, idx) => {
                    if (c.macd_hist === null || c.macd_hist === undefined) return null;
                    const x = idx * candleSlot + (candleSlot - candleWidth) / 2;
                    const zeroY = getMACDY(0);
                    const histY = getMACDY(c.macd_hist);
                    const h = Math.abs(histY - zeroY);
                    const top = Math.min(zeroY, histY);
                    const isPos = c.macd_hist >= 0;
                    return (
                      <rect
                        key={`hist-${idx}`}
                        x={x}
                        y={top}
                        width={candleWidth}
                        height={Math.max(h, 1)}
                        fill={isPos ? "#10b981" : "#f43f5e"}
                        opacity="0.75"
                      />
                    );
                  })}

                  {/* MACD Line */}
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    points={candles
                      .map((c, idx) => {
                        if (c.macd === null || c.macd === undefined) return "";
                        return `${idx * candleSlot + candleSlot / 2},${getMACDY(c.macd)}`;
                      })
                      .filter(Boolean)
                      .join(" ")}
                  />

                  {/* MACD Signal Line */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    points={candles
                      .map((c, idx) => {
                        if (c.macd_signal === null || c.macd_signal === undefined) return "";
                        return `${idx * candleSlot + candleSlot / 2},${getMACDY(c.macd_signal)}`;
                      })
                      .filter(Boolean)
                      .join(" ")}
                  />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right 1 col: Factor Diagnostics Card with RadialGauge */}
        <div className="p-3 bg-[var(--surface-subtle)] flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between border-b border-[var(--divider)] pb-2">
            <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-[11px]">
              Factor Diagnostics
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[10px] text-[var(--text-muted)]">
              LIVE
            </span>
          </div>

          {/* Composite Score Gauge */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col items-center justify-center">
            <RadialGauge
              score={alphaScore}
              label="COMPOSITE SCORE"
              sublabel={currentSymbol.regime.replace(/_/g, " ")}
              size={175}
            />
          </div>

          {/* Regime Card */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Regime</span>
            <span className="font-semibold text-[var(--text-primary)] text-xs">
              {currentSymbol.regime.replace(/_/g, " ")}
            </span>
          </div>

          {/* RSI-14 Dial / Meter */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Wilder&apos;s RSI (14)</span>
              <span className="font-bold text-[var(--text-primary)] tabular-nums">
                {currentSymbol.rsi_14.toFixed(1)}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden flex border border-[var(--divider)]">
              <div className="w-[30%] bg-cyan-900/40 border-r border-[var(--divider)]" title="Oversold (<30)" />
              <div className="w-[40%] bg-[var(--surface)] border-r border-[var(--divider)]" title="Neutral (30-70)" />
              <div className="w-[30%] bg-rose-900/40" title="Overbought (>70)" />
            </div>
            <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
              <span>0 (Oversold)</span>
              <span>50</span>
              <span>100 (Overbought)</span>
            </div>
          </div>

          {/* Volatility & Risk Metrics */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
              <div className="text-[var(--text-muted)] text-[10px]">30D VOLATILITY</div>
              <div className="text-[var(--text-primary)] font-bold tabular-nums mt-0.5">
                {currentSymbol.volatility_30d.toFixed(1)}%
              </div>
            </div>

            <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
              <div className="text-[var(--text-muted)] text-[10px]">90D SHARPE PROXY</div>
              <div className="text-emerald-500 font-bold tabular-nums mt-0.5">
                {currentSymbol.sharpe_proxy.toFixed(2)}
              </div>
            </div>

            <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
              <div className="text-[var(--text-muted)] text-[10px]">BOLLINGER %B</div>
              <div className="text-purple-500 font-bold tabular-nums mt-0.5">
                {currentSymbol.bollinger_pct_b.toFixed(2)}
              </div>
            </div>

            <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface)] shadow-xs">
              <div className="text-[var(--text-muted)] text-[10px]">MACD HISTOGRAM</div>
              <div
                className={`font-bold tabular-nums mt-0.5 ${
                  currentSymbol.macd_hist >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {currentSymbol.macd_hist > 0 ? "+" : ""}
                {currentSymbol.macd_hist.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Volume Surge & Liquidity */}
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1 text-[11px] shadow-xs">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Session Volume:</span>
              <span className="text-[var(--text-primary)] tabular-nums font-semibold">
                {(currentSymbol.volume / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>20D Avg Volume:</span>
              <span className="text-[var(--text-primary)] tabular-nums font-semibold">
                {(currentSymbol.avg_volume_20d / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)] pt-1 border-t border-[var(--divider)]">
              <span>Surge Ratio:</span>
              <span className="text-cyan-500 font-bold">
                {(currentSymbol.volume / Math.max(currentSymbol.avg_volume_20d, 1)).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
