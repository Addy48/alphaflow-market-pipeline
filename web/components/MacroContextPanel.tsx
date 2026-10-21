"use client";

import React from "react";
import { Globe, X, TrendUp, TrendDown } from "@phosphor-icons/react";
import { BenchmarkItem } from "../types/market";
import { playTick } from "../utils/audio";

interface MacroContextPanelProps {
  benchmarks: BenchmarkItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const MacroContextPanel: React.FC<MacroContextPanelProps> = ({
  benchmarks,
  isOpen,
  onClose,
}) => {
  const vix = benchmarks.find((b) => b.ticker === "VIX");
  const vixVal = parseFloat(vix?.value.replace(/,/g, "") || "0");
  const vixLevel = isNaN(vixVal) ? 15 : vixVal;

  const tnx = benchmarks.find((b) => b.ticker === "TNX");
  const tnxVal = parseFloat(tnx?.value.replace(/,/g, "") || "0");

  const riskAppetite =
    vixLevel < 15
      ? { label: "RISK ON", color: "text-[var(--risk-success)]", bg: "bg-[var(--risk-success-bg)]", border: "border-[var(--risk-success-border)]" }
      : vixLevel < 20
      ? { label: "NEUTRAL", color: "text-[var(--accent)]", bg: "bg-[var(--accent-dim)]", border: "border-[var(--accent-border)]" }
      : vixLevel < 30
      ? { label: "ELEVATED RISK", color: "text-[var(--risk-warning)]", bg: "bg-[var(--risk-warning-bg)]", border: "border-[var(--risk-warning-border)]" }
      : { label: "HIGH VOLATILITY", color: "text-[var(--risk-critical)]", bg: "bg-[var(--risk-critical-bg)]", border: "border-[var(--risk-critical-border)]" };

  const yieldSignal =
    tnxVal > 4.5
      ? { label: "RESTRICTIVE", color: "text-[var(--risk-critical)]", bg: "bg-[var(--risk-critical-bg)]" }
      : tnxVal > 4.0
      ? { label: "NEUTRAL TIGHT", color: "text-[var(--risk-warning)]", bg: "bg-[var(--risk-warning-bg)]" }
      : { label: "ACCOMMODATIVE", color: "text-[var(--risk-success)]", bg: "bg-[var(--risk-success-bg)]" };

  const isChangePositive = (changeStr: string): boolean => {
    return changeStr.startsWith("+") || (!changeStr.startsWith("-") && parseFloat(changeStr) > 0);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[48] bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => {
            playTick("click");
            onClose();
          }}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[49] w-80 bg-[var(--surface)] border-l border-[var(--divider-strong)] shadow-raised flex flex-col transition-transform duration-200 ease-out font-mono text-xs ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <Globe size={15} weight="bold" className="text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Macro Context
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)]">
              LIVE
            </span>
          </div>
          <button
            onClick={() => {
              playTick("click");
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
            title="Close Macro Panel (ESC or M)"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
          {/* Derived Signals */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">
              Macro Regime Indicators
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
                <span className="text-[var(--text-secondary)]">Risk Appetite</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskAppetite.bg} ${riskAppetite.color} ${riskAppetite.border}`}>
                  {riskAppetite.label}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
                <span className="text-[var(--text-secondary)]">US 10Y Yield Regime</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${yieldSignal.bg} ${yieldSignal.color}`}>
                  {yieldSignal.label}
                </span>
              </div>
            </div>
          </div>

          {/* Benchmark tiles */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">
              Cross-Market Benchmarks
            </div>
            <div className="space-y-1.5">
              {benchmarks.map((b) => {
                const isPos = isChangePositive(b.change);
                return (
                  <div
                    key={b.ticker}
                    className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--text-primary)]">
                          {b.ticker}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px]">
                          {b.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded ${
                          isPos
                            ? "bg-[var(--risk-success-bg)] text-[var(--risk-success)] border border-[var(--risk-success-border)]"
                            : "bg-[var(--risk-critical-bg)] text-[var(--risk-critical)] border border-[var(--risk-critical-border)]"
                        }`}
                      >
                        {isPos ? (
                          <TrendUp size={10} weight="bold" />
                        ) : (
                          <TrendDown size={10} weight="bold" />
                        )}
                        {b.change}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)] text-[10px]">
                        Last Print:
                      </span>
                      <span className="font-black text-[var(--text-primary)] tabular-nums">
                        {b.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIX Fear Gauge */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">
              VIX Fear & Volatility Gauge
            </div>
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                <span>Calm (10)</span>
                <span>Neutral (20)</span>
                <span>Panic (40+)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--divider)] overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    vixLevel < 15
                      ? "bg-[var(--risk-success)]"
                      : vixLevel < 20
                      ? "bg-[var(--accent)]"
                      : vixLevel < 30
                      ? "bg-[var(--risk-warning)]"
                      : "bg-[var(--risk-critical)]"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, ((vixLevel - 10) / 35) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-[var(--divider)]">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  CBOE Volatility Index: <strong className={`font-black ${riskAppetite.color}`}>{vix?.value || "15.42"}</strong>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${riskAppetite.bg} ${riskAppetite.color}`}>
                  {riskAppetite.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-between font-mono flex-shrink-0">
          <span>Press M or ESC to dismiss</span>
          <span>AlphaFlow Macro</span>
        </div>
      </div>
    </>
  );
};
