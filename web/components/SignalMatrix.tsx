"use client";

import React from "react";
import { SymbolData } from "../types/market";

interface SignalMatrixProps {
  symbol: SymbolData;
}

export const SignalMatrix: React.FC<SignalMatrixProps> = ({ symbol }) => {
  const isMom = symbol.rsi_14 >= 50 && symbol.macd > symbol.macd_signal;
  const isLowVol = symbol.volatility_30d <= 26.0;
  const isBandExp = symbol.bollinger_pct_b >= 0.85 || symbol.bollinger_pct_b <= 0.15;
  const isHighSharpe = symbol.sharpe_proxy >= 1.25;
  const isVolSurge = symbol.volume >= symbol.avg_volume_20d;

  const signals = [
    { code: "MOM", label: "Momentum", active: isMom, title: "RSI ≥ 50 & MACD Bullish Cross" },
    { code: "VOL", label: "Low Vol", active: isLowVol, title: "30D Volatility ≤ 26%" },
    { code: "BND", label: "Bandwidth", active: isBandExp, title: "Bollinger Expansion (%B extreme)" },
    { code: "SHP", label: "Sharpe", active: isHighSharpe, title: "Sharpe Proxy ≥ 1.25" },
    { code: "LIQ", label: "Liquidity", active: isVolSurge, title: "Volume > 20-Day Average" },
  ];

  return (
    <div className="flex items-center gap-1 font-mono text-[10px]">
      {signals.map((s) => (
        <span
          key={s.code}
          title={`${s.title}: ${s.active ? "Triggered (Active)" : "Neutral"}`}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors select-none ${
            s.active
              ? "bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 shadow-xs"
              : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--divider)]"
          }`}
        >
          {s.code}
        </span>
      ))}
    </div>
  );
};
