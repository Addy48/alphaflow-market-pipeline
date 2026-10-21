"use client";

import React from "react";
import { Database, Lightning } from "@phosphor-icons/react";

export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="architecture"
      aria-label="Unified Quantitative Architecture"
      className="border-b border-[var(--divider)] bg-[var(--surface)] px-4 py-12 md:py-16 transition-colors duration-200"
    >
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--divider)]">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold mb-1">
              [ DUAL-PLANE PROCESSING SPECIFICATION ]
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
              Unified System Architecture: Lakehouse + Sentinel
            </h2>
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] max-w-md">
            Decoupled analytical factor marts from real-time breakout evaluation with deterministic mathematical boundaries.
          </div>
        </div>

        {/* Asymmetric Side-by-Side Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Plane 1: Batch Medallion Lakehouse (7 cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[var(--divider-strong)] bg-[var(--surface-subtle)] p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-[var(--accent)]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] font-mono">
                    Plane A: Batch Medallion Lakehouse
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-secondary)]">
                  AWS S3 / Parquet / Athena
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed mb-4">
                Executes post-market closing bell ingestion across dual financial exchanges. Ingested raw price prints flow through strict mathematical validation before vectorized factor synthesis.
              </p>

              {/* Medallion Pipeline Flow */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)] flex items-start gap-3">
                  <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    BR
                  </span>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-xs">Bronze Layer: Raw Ingestion</div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Daily batch ingestion triggered at 12:30 UTC (NSE close) and 21:30 UTC (NYSE close). Raw JSON archives written to immutable S3 audit buckets.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)] flex items-start gap-3">
                  <span className="w-5 h-5 rounded bg-slate-500/10 text-[var(--accent)] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    SV
                  </span>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-xs">Silver Layer: Pandera Schema Contracts</div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Zero invalid ticks accepted. Enforces positive price bounds, non-zero trading volumes, monotonic date indices, and 14 factor boundary checks.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)] flex items-start gap-3">
                  <span className="w-5 h-5 rounded bg-emerald-500/10 text-[var(--risk-success)] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    GD
                  </span>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-xs">Gold Layer: Partitioned Parquet Mart</div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Snappy-compressed columnar partitions structured as <code className="text-[10px] text-[var(--text-primary)]">exchange=US|NSE/year=YYYY/month=MM</code>. Queried via AWS Athena and embedded DuckDB.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--divider)] flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
              <span>SLA Target: &lt;120s</span>
              <span>Columnar Compression: Snappy</span>
            </div>
          </div>

          {/* Plane 2: Serverless Event-Driven Sentinel (5 cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[var(--divider-strong)] bg-[var(--surface-subtle)] p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <Lightning size={16} className="text-amber-500" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] font-mono">
                    Plane B: Serverless Sentinel
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-secondary)]">
                  Lambda / DynamoDB / SNS
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed mb-4">
                Real-time breakout trigger engine evaluating multi-factor boundary transitions without alert chatter.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)]">
                  <div className="font-bold text-[var(--text-primary)] text-xs mb-1">
                    Anti-Chatter Transition Logic
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Alerts trigger <strong className="text-[var(--text-primary)]">only on state transition crossings</strong> (<code className="text-[10px]">prev &lt; threshold &lt;= current</code>), preventing repetitive spam during prolonged overbought or oversold runs.
                  </p>
                </div>

                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)]">
                  <div className="font-bold text-[var(--text-primary)] text-xs mb-1">
                    DynamoDB 90-Day TTL State Store
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Maintains trailing state per symbol (<code className="text-[10px]">PK=symbol, SK=date</code>) with native automatic TTL expiration to eliminate manual database vacuuming and cost overhead.
                  </p>
                </div>

                <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)]">
                  <div className="font-bold text-[var(--text-primary)] text-xs mb-1">
                    Dual Structured SNS Payload
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Publishes human-readable quantitative alert summaries plus embedded machine-readable JSON in message attributes for downstream algorithmic consumption.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--divider)] flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
              <span>Trigger: EventBridge Rule</span>
              <span>Channel: AWS SNS Topic</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
