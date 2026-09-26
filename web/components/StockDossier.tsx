"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  Copy, 
  Check, 
  ChartBar,
  TrendUp, 
  TrendDown,
  FilePdf,
  ShieldCheck
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { RadialGauge } from "./RadialGauge";
import { SignalMatrix } from "./SignalMatrix";
import { playTick } from "../utils/audio";

interface StockDossierProps {
  symbol: SymbolData;
  onClose: () => void;
  onOpenChart: (symbol: string) => void;
  onOpenReport?: (symbol: string) => void;
}

export const StockDossier: React.FC<StockDossierProps> = ({
  symbol,
  onClose,
  onOpenChart,
  onOpenReport,
}) => {
  const [copied, setCopied] = useState(false);

  const alphaScore = Math.min(
    100,
    Math.max(
      0,
      symbol.rsi_14 * 0.35 +
      (100 - Math.min(symbol.volatility_30d, 50) * 1.6) * 0.25 +
      Math.min(symbol.sharpe_proxy * 28, 100) * 0.25 +
      symbol.bollinger_pct_b * 15
    )
  );

  // Dynamically evaluate regime matching true factor metrics
  const derivedRegime = useMemo(() => {
    if (alphaScore >= 75) return "STRONG MOMENTUM";
    if (alphaScore >= 55) return "MODERATE EXPANSION";
    if (alphaScore >= 40) return "CONSOLIDATION";
    return "DEFENSIVE / OVERSOLD";
  }, [alphaScore]);

  const technicalInterpretation = useMemo(() => {
    if (alphaScore >= 70) {
      return "Strong momentum profile. Relative strength and positive Bollinger expansion indicate upside trend continuation with favorable Sharpe proxy.";
    }
    if (alphaScore >= 50) {
      return "Constructive consolidation. Trading inside normal volatility bounds with balanced risk-reward dispersion.";
    }
    if (alphaScore >= 35) {
      return "Defensive compression. Volatility contraction and neutral momentum indicate near-term range-bound price action.";
    }
    return "Oversold mean-reversion candidate. Depressed momentum and lower-envelope breach present tactical recovery potential with elevated drawdown risk.";
  }, [alphaScore]);

  const isPos = symbol.change_1d >= 0;
  const currencySymbol = symbol.exchange === "NSE" ? "₹" : "$";

  const handleCopy = () => {
    playTick("click");
    navigator.clipboard.writeText(JSON.stringify(symbol, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-raised transition-colors duration-200">
      {/* Header */}
      <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
            Equity Dossier
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              symbol.exchange === "NSE"
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
                : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            }`}
          >
            {symbol.exchange}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenReport && (
            <button
              onClick={() => onOpenReport(symbol.symbol)}
              className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center gap-1"
              title="Print / Save Tear-Sheet PDF"
            >
              <FilePdf size={14} weight="bold" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            title="Copy JSON"
          >
            {copied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} weight="bold" />}
          </button>
          <button
            onClick={() => {
              playTick("click");
              onClose();
            }}
            className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)]">
        {/* Ticker & Price Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-black text-[var(--text-primary)] tracking-wide">
              {symbol.symbol}
            </div>
            <div className="text-xs text-[var(--text-secondary)] font-normal truncate max-w-[220px]">
              {symbol.name}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {symbol.sector}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
              {currencySymbol}{symbol.price.toFixed(2)}
            </div>
            <div
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold tabular-nums mt-0.5 border ${
                isPos
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                  : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
              }`}
            >
              {isPos ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
              {isPos ? "+" : ""}{symbol.change_1d.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Signal Matrix */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1.5">
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
            Factor Signal Matrix
          </div>
          <SignalMatrix symbol={symbol} />
        </div>

        {/* Composite Score Gauge */}
        <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col items-center justify-center">
          <RadialGauge
            score={alphaScore}
            label="COMPOSITE SCORE"
            sublabel={derivedRegime}
            size={180}
          />
        </div>

        {/* Technical Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-semibold">RSI (14-Period)</div>
            <div className="text-[var(--text-primary)] font-bold tabular-nums text-sm mt-0.5">
              {symbol.rsi_14.toFixed(1)}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
              {symbol.rsi_14 > 65 ? "Overbought" : symbol.rsi_14 < 35 ? "Oversold" : "Neutral"}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-semibold">Bollinger %B</div>
            <div className="text-[var(--text-primary)] font-bold tabular-nums text-sm mt-0.5">
              {symbol.bollinger_pct_b.toFixed(2)}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
              {symbol.bollinger_pct_b > 1 ? "Upper Breakout" : symbol.bollinger_pct_b < 0 ? "Lower Breach" : "Inside Bands"}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-semibold">30D Volatility</div>
            <div className="text-[var(--text-primary)] font-bold tabular-nums text-sm mt-0.5">
              {symbol.volatility_30d.toFixed(1)}%
            </div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
              Annualized 252-day basis
            </div>
          </div>

          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-semibold">Sharpe Proxy</div>
            <div className="text-[var(--text-primary)] font-bold tabular-nums text-sm mt-0.5">
              {symbol.sharpe_proxy.toFixed(2)}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
              Risk-free rate: 4.5%
            </div>
          </div>
        </div>

        {/* Bollinger Envelope */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1 text-[11px]">
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-0.5">
            Bollinger Bands (20, 2σ)
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Upper Band:</span>
            <span className="text-[var(--text-primary)] tabular-nums font-semibold">
              {currencySymbol}{symbol.bollinger_upper.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Lower Band:</span>
            <span className="text-[var(--text-primary)] tabular-nums font-semibold">
              {currencySymbol}{symbol.bollinger_lower.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>20D Moving Avg:</span>
            <span className="text-[var(--text-primary)] tabular-nums font-semibold">
              {currencySymbol}{((symbol.bollinger_upper + symbol.bollinger_lower) / 2).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Regime Diagnostic Note */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] text-[11px] leading-relaxed">
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck size={12} weight="bold" className="text-[var(--accent)]" />
            <span>Technicals Regime Assessment</span>
          </div>
          <p className="text-[var(--text-secondary)] text-[10px]">
            <strong className="text-[var(--text-primary)]">{derivedRegime}:</strong> {technicalInterpretation}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            playTick("click");
            onOpenChart(symbol.symbol);
          }}
          className="w-full py-2.5 rounded border border-[var(--divider-strong)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
        >
          <ChartBar size={14} weight="bold" />
          <span>Launch Full Technical Workspace</span>
        </button>
      </div>
    </div>
  );
};
