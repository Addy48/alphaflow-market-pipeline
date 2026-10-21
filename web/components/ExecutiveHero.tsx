"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown, Database, ShieldCheck, ArrowUpRight } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

interface ExecutiveHeroProps {
  onLaunchTerminal: () => void;
  onOpenReport?: () => void;
  slaSeconds: number;
  slaStatus: string;
  activeInstruments: number;
}

export const ExecutiveHero: React.FC<ExecutiveHeroProps> = ({
  onLaunchTerminal,
  onOpenReport,
  slaSeconds,
  slaStatus,
  activeInstruments,
}) => {
  return (
    <section
      aria-label="Platform Executive Overview"
      className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-8 md:py-12 transition-colors duration-200"
    >
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Authoritative Editorial Statement & Single Clear CTA */}
        <div className="lg:col-span-7 flex flex-col items-start gap-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold flex items-center gap-2">
            <span>[ SYSTEM ARCHITECTURE // FACTOR MART ]</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] font-mono leading-tight">
            Dual-Exchange Quantitative Data Platform &amp; Observability Engine
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono leading-relaxed max-w-2xl">
            AlphaFlow pairs a partitioned Medallion Lakehouse (S3 / Snappy Parquet / DuckDB / Athena) for daily batch historical factor marts with a serverless event-driven sentinel (AWS Lambda / DynamoDB / EventBridge / SNS) for real-time breakout alerting across the US S&amp;P 500 and the Indian NSE NIFTY 50.
          </p>

          {/* Primary & Secondary CTA Hierarchy */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Clear Primary CTA */}
            <button
              onClick={() => {
                playTick("click");
                onLaunchTerminal();
              }}
              className="px-4 py-2.5 rounded border border-[var(--accent-border)] bg-[var(--accent)] hover:bg-[#345c85] text-white font-mono text-xs font-bold transition btn-tactile shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Terminal Workspace</span>
              <ArrowDown size={14} weight="bold" />
            </button>

            {/* Secondary Actions */}
            {onOpenReport && (
              <button
                onClick={() => {
                  playTick("click");
                  onOpenReport();
                }}
                className="px-3.5 py-2.5 rounded border border-[var(--divider-strong)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-mono text-xs font-semibold transition btn-tactile flex items-center gap-1.5 cursor-pointer"
              >
                <span>Institutional Tear-Sheet</span>
                <ArrowUpRight size={13} weight="bold" className="text-[var(--text-muted)]" />
              </button>
            )}

            <Link
              href="/architecture"
              className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-xs transition underline-offset-4 hover:underline"
            >
              System Blueprint
            </Link>
          </div>

          {/* Key Quantitative Proofs */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full border-t border-[var(--divider)] font-mono text-xs">
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Coverage</div>
              <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                {activeInstruments} Liquid Equities
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">S&amp;P 500 + Nifty 50</div>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Contracts</div>
              <div className="text-sm font-bold text-[var(--risk-success)] tabular-nums mt-0.5 flex items-center gap-1">
                <ShieldCheck size={13} weight="bold" />
                <span>100% Validated</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Pandera Schemas</div>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Ingestion SLA</div>
              <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                {slaSeconds}s
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">&lt;120s Target Window</div>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Factor Models</div>
              <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                14 Vectorized
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">RSI, Vol, %B, Sharpe</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Pipeline Verification Ledger */}
        <div className="lg:col-span-5 w-full">
          <div className="rounded-lg border border-[var(--divider-strong)] bg-[var(--surface)] p-4 font-mono text-xs shadow-raised transition-colors duration-200">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--divider)]">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-[var(--accent)]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  Pipeline Telemetry Ledger
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-[var(--risk-success)]">
                {slaStatus === "OK" ? "OPERATIONAL" : slaStatus}
              </span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">NYSE / NASDAQ Plane</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Bell: 16:00 ET • Ingest: 21:30 UTC</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">exchange=US</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Snappy Parquet</div>
                </div>
              </div>

              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">NSE India Plane</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Bell: 15:30 IST • Ingest: 12:30 UTC</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">exchange=NSE</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Snappy Parquet</div>
                </div>
              </div>

              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Real-Time Breakout Sentinel</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Anti-chatter transition triggers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">AWS Lambda</div>
                  <div className="text-[10px] text-[var(--text-muted)]">DynamoDB 90d TTL</div>
                </div>
              </div>

              <div className="p-2 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Pandera Schema Contracts</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Deterministic mathematical bounds</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--risk-success)]">PASSED (0 Err)</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Enforced Ingest</div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--divider)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>Dual closing bell sync</span>
              <span>Zero synthetic data fabrication</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
