"use client";

import React, { useState } from "react";
import { ShieldCheck, Calculator } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

interface FactorDetail {
  id: string;
  name: string;
  category: "MOMENTUM" | "VOLATILITY" | "RISK_ADJUSTED" | "ENVELOPE";
  formula: string;
  panderaBound: string;
  description: string;
  institutionalUtility: string;
}

const FACTORS: FactorDetail[] = [
  {
    id: "rsi_14",
    name: "Wilder's RSI-14",
    category: "MOMENTUM",
    formula: "100 - (100 / (1 + (AvgGain₁₄ / AvgLoss₁₄)))",
    panderaBound: "0.0 <= rsi_14 <= 100.0",
    description: "14-period exponentially smoothed relative strength index measuring velocity of price changes.",
    institutionalUtility: "Identifies exhaustion regimes (>70 overbought, <30 oversold) and momentum divergences across active constituents.",
  },
  {
    id: "bollinger_pct_b",
    name: "Bollinger %B Position",
    category: "ENVELOPE",
    formula: "(Price - LowerBand₂₀) / (UpperBand₂₀ - LowerBand₂₀)",
    panderaBound: "-0.5 <= bollinger_pct_b <= 1.5",
    description: "Normalized price position relative to 20-period 2-standard-deviation moving envelopes.",
    institutionalUtility: "%B > 1.0 indicates upper envelope penetrations; %B < 0.0 signals breakdown below lower threshold.",
  },
  {
    id: "bollinger_bandwidth",
    name: "Bollinger Bandwidth Squeeze",
    category: "VOLATILITY",
    formula: "(UpperBand₂₀ - LowerBand₂₀) / SMA₂₀",
    panderaBound: "bandwidth > 0.0",
    description: "Measures normalized width of volatility bands relative to the central moving average.",
    institutionalUtility: "Multi-month lows in bandwidth signal impending directional expansion and volatility breakout regimes.",
  },
  {
    id: "volatility_30d",
    name: "30-Day Realized Volatility",
    category: "VOLATILITY",
    formula: "StdDev(ln(P_t / P_{t-1}))_{30d} * sqrt(252) * 100",
    panderaBound: "volatility_30d >= 0.0",
    description: "252-day annualized standard deviation of daily logarithmic returns over a rolling 30-day window.",
    institutionalUtility: "Fundamental risk input for position sizing, Value-at-Risk (VaR) estimations, and factor normalization.",
  },
  {
    id: "sharpe_proxy",
    name: "Rolling Sharpe Ratio Proxy",
    category: "RISK_ADJUSTED",
    formula: "(AnnualizedReturn - 0.045) / AnnualizedVol",
    panderaBound: "-5.0 <= sharpe_proxy <= 10.0",
    description: "Excess return over the 4.5% sovereign risk-free hurdle rate normalized by realized volatility.",
    institutionalUtility: "Distinguishes high-return equities that deliver true alpha from those simply taking on excess systemic beta.",
  },
  {
    id: "composite_score",
    name: "Composite Alpha Score",
    category: "MOMENTUM",
    formula: "0.35*Mom + 0.25*Vol + 0.25*Sharpe + 0.15*Reversion",
    panderaBound: "0.0 <= composite_score <= 100.0",
    description: "Multi-factor institutional rank combining momentum persistence, volatility compression, and risk efficiency.",
    institutionalUtility: "Unified screener ranking allowing instant cross-market comparison between US and Indian blue-chip equities.",
  },
];

export const FactorMethodologySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredFactors =
    selectedCategory === "ALL"
      ? FACTORS
      : FACTORS.filter((f) => f.category === selectedCategory);

  return (
    <section
      id="factors"
      aria-label="Factor Engineering & Mathematical Methodology"
      className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-12 md:py-16 transition-colors duration-200"
    >
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--divider)]">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold mb-1">
              [ QUANTITATIVE FACTOR MART & CONTRACTS ]
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
              14 Vectorized Mathematical Factors &amp; Data Contracts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {["ALL", "MOMENTUM", "VOLATILITY", "RISK_ADJUSTED", "ENVELOPE"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playTick("toggle");
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition btn-tactile cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--divider)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Asymmetric Factor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFactors.map((factor) => (
            <div
              key={factor.id}
              className="rounded-lg border border-[var(--divider)] bg-[var(--surface)] p-4 flex flex-col justify-between font-mono text-xs shadow-xs hover:border-[var(--accent-border)] transition"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--divider)]">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    {factor.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--divider)]">
                    {factor.category}
                  </span>
                </div>

                <div className="mb-2.5 p-2 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[10px] text-[var(--text-secondary)] overflow-x-auto">
                  <code className="text-[var(--text-primary)] font-semibold">{factor.formula}</code>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  {factor.description}
                </p>

                <div className="text-[10px] text-[var(--text-muted)] leading-normal mb-3">
                  <strong className="text-[var(--text-secondary)]">Institutional Utility:</strong>{" "}
                  {factor.institutionalUtility}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Pandera Contract:</span>
                <span className="text-[var(--risk-success)] font-semibold flex items-center gap-1">
                  <ShieldCheck size={11} weight="bold" />
                  <span>{factor.panderaBound}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Data Quality Guarantee Ribbon */}
        <div className="p-4 rounded-lg border border-[var(--divider-strong)] bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
              <Calculator size={16} weight="bold" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)] text-xs">
                Zero Synthetic Hallucination Standard
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Every metric is computed deterministically in vectorized Python/Pandas and validated against Pandera schemas before landing in S3 Gold partitions.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] shrink-0">
            <span className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--divider)]">
              Wilder Smoothed
            </span>
            <span className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--divider)]">
              252d Realized
            </span>
            <span className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--divider)]">
              4.5% Hurdle
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
