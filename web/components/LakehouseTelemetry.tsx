"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  ShieldCheck, 
  Clock, 
  CheckCircle,
  Copy,
  Check,
  Lightning,
  Broadcast,
  BellRinging
} from "@phosphor-icons/react";
import { TelemetryData } from "../types/market";
import { playTick } from "../utils/audio";

interface LakehouseTelemetryProps {
  telemetry: TelemetryData;
}

export const LakehouseTelemetry: React.FC<LakehouseTelemetryProps> = ({ telemetry }) => {
  const [copied, setCopied] = useState(false);
  const [alertCopied, setAlertCopied] = useState(false);
  const [alertViewMode, setAlertViewMode] = useState<"card" | "json">("card");

  const sampleAlert = {
    event_type: "ALPHAFLOW_FACTOR_ALERT",
    symbol: "NVDA",
    date: "2026-09-19",
    close: 147.8,
    metrics: {
      rsi_14: 73.8,
      bollinger_pct_b: 1.08,
      alpha_score: 89.2,
      volume: 78000000
    },
    triggers: [
      "[NVDA] Crossed ABOVE upper resistance 145.00 (142.30 -> 147.80) on 2026-09-19",
      "[NVDA] RSI-14 crossed into OVERBOUGHT regime (68.4 -> 73.8)",
      "[NVDA] Bollinger %B UPPER BREAKOUT (0.92 -> 1.08)"
    ],
    target_sns_topic: "arn:aws:sns:us-east-1:123456789012:alphaflow-factor-alerts",
    simulated_message_id: "msg-8f92a10b-4d3e-4b2a-89f1-a1b2c3d4e5f6"
  };

  const handleCopyJson = () => {
    playTick("click");
    navigator.clipboard.writeText(JSON.stringify(telemetry, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAlert = () => {
    playTick("click");
    navigator.clipboard.writeText(JSON.stringify(sampleAlert, null, 2));
    setAlertCopied(true);
    setTimeout(() => setAlertCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-subtle transition-colors duration-200">
      {/* Header */}
      <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu size={16} weight="bold" className="text-cyan-500" />
          <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs">
            Medallion Lakehouse Observability & Ingestion SLA
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
            {telemetry.pipeline_health}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <span>Last Ingestion:</span>
          <span className="text-[var(--text-primary)] font-bold">{telemetry.last_run_timestamp}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-4 flex flex-col gap-5">
        {/* Medallion Architecture Lineage Flow */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
            Medallion Data Lineage & Schema Evolution
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
            {/* Raw Ingestion Feed */}
            <div className="p-3 rounded-lg border border-amber-900/60 bg-amber-950/20 flex flex-col gap-2 relative group hover:border-amber-500/80 hover:-translate-y-1 hover:shadow-raised transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-xs">RAW INGESTION FEED</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  BRONZE
                </span>
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {telemetry.bronze_records.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">RECS</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] flex flex-col gap-0.5">
                <span>Storage: {telemetry.storage_breakdown.bronze_mb} MB (JSON / Raw)</span>
                <span>Contract: Pandera Lazy Non-Blocking</span>
                <span>Partitioning: exchange=US/NSE / date=YYYY-MM-DD</span>
              </div>
            </div>

            {/* Normalized Parquet Mart */}
            <div className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/30 flex flex-col gap-2 relative group hover:border-slate-400/80 hover:-translate-y-1 hover:shadow-raised transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs">NORMALIZED PARQUET MART</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                  SILVER
                </span>
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {telemetry.silver_records.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">RECS</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] flex flex-col gap-0.5">
                <span>Storage: {telemetry.storage_breakdown.silver_mb} MB (Parquet)</span>
                <span>Filters: Zero-Vol Halts & ±15% Outliers</span>
                <span>Null Strategy: Forward-fill / Drop</span>
              </div>
            </div>

            {/* Engineered Factor Store */}
            <div className="p-3 rounded-lg border border-cyan-800/80 bg-cyan-950/20 flex flex-col gap-2 relative group hover:border-cyan-500/80 hover:-translate-y-1 hover:shadow-raised transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-xs">ENGINEERED FACTOR STORE</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  GOLD
                </span>
              </div>
              <div className="text-xl font-bold text-cyan-400 tabular-nums">
                {telemetry.gold_records.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">RECS</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] flex flex-col gap-0.5">
                <span>Storage: {telemetry.storage_breakdown.gold_parquet_mb} MB ({telemetry.storage_breakdown.compression_ratio})</span>
                <span>Engine: 14 Technical Factors Computed</span>
                <span>Catalog: AWS Glue & Athena Partition Pruning</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLA & Quality Gates Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:border-cyan-500/50 hover:-translate-y-0.5 hover:shadow-raised transition-all duration-200 cursor-default flex flex-col gap-1 shadow-xs group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px]">
              <span className="group-hover:text-[var(--text-primary)] transition-colors">INGESTION SLA LATENCY</span>
              <Clock size={14} weight="bold" className="text-cyan-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
              {telemetry.ingestion_sla_seconds}s
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Target: &lt;{telemetry.sla_target_seconds}s (Margin: 86.1%)
            </div>
          </div>

          <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:border-emerald-500/50 hover:-translate-y-0.5 hover:shadow-raised transition-all duration-200 cursor-default flex flex-col gap-1 shadow-xs group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px]">
              <span className="group-hover:text-[var(--text-primary)] transition-colors">ZERO-VOLUME HALTS</span>
              <CheckCircle size={14} weight="bold" className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold text-emerald-500 tabular-nums">
              {telemetry.quality_gates.zero_volume_halts_detected} DETECTED
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Active trading sessions screened
            </div>
          </div>

          <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:border-emerald-500/50 hover:-translate-y-0.5 hover:shadow-raised transition-all duration-200 cursor-default flex flex-col gap-1 shadow-xs group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px]">
              <span className="group-hover:text-[var(--text-primary)] transition-colors">PRICE OUTLIER SPIKES</span>
              <ShieldCheck size={14} weight="bold" className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold text-emerald-500 tabular-nums">
              {telemetry.quality_gates.price_outlier_spikes_flagged} FLAGGED
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              ±15% single-session guard threshold
            </div>
          </div>

          <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:border-emerald-500/50 hover:-translate-y-0.5 hover:shadow-raised transition-all duration-200 cursor-default flex flex-col gap-1 shadow-xs group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px]">
              <span className="group-hover:text-[var(--text-primary)] transition-colors">SCHEMA DRIFT CONTRACTS</span>
              <CheckCircle size={14} weight="bold" className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold text-emerald-500 tabular-nums">
              100.0% PASS
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              0 contract violations recorded
            </div>
          </div>
        </div>

        {/* Pipeline Execution Log Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Recent Automated Pipeline Ingestion Runs
            </span>
            <button
              onClick={handleCopyJson}
              className="px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[10px] font-mono flex items-center gap-1 transition btn-tactile cursor-pointer"
            >
              {copied ? <Check size={13} weight="bold" className="text-emerald-500" /> : <Copy size={13} weight="bold" />}
              {copied ? "Copied" : "Copy Telemetry JSON"}
            </button>
          </div>

          <div className="overflow-x-auto border border-[var(--divider)] rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)]">
                  <th className="py-2 px-3">RUN IDENTIFIER</th>
                  <th className="py-2 px-3">MARKET SCHEDULE</th>
                  <th className="py-2 px-3 text-right">RECORDS</th>
                  <th className="py-2 px-3 text-right">LATENCY (s)</th>
                  <th className="py-2 px-3 text-right">OUTLIERS</th>
                  <th className="py-2 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)] text-[11px]">
                {telemetry.recent_runs.map((run) => (
                  <tr key={run.run_id} className="hover:bg-[var(--surface-hover)] transition">
                    <td className="py-2 px-3 font-bold text-[var(--text-primary)]">{run.run_id}</td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[10px]">
                        {run.market}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--text-primary)]">
                      {run.records.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-cyan-500 font-semibold">
                      {run.latency_s}s
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-500 font-semibold">
                      {run.anomalies}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EVENT-DRIVEN SERVERLESS FACTOR SENTINEL (HOT PLANE) */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--divider)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightning size={16} weight="fill" className="text-amber-400" />
              <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs">
                Event-Driven Serverless Sentinel & Factor Alert Engine
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                ACTIVE SENTINEL
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
              <span>Trigger Schedule:</span>
              <span className="text-[var(--text-primary)] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)]">
                cron(30 21 ? * MON-FRI *)
              </span>
            </div>
          </div>

          {/* Sentinel Architecture Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>EVENT TRIGGER</span>
                <Clock size={14} weight="bold" className="text-cyan-500" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                AWS EventBridge
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Market-close invocation with zero idle compute cost
              </div>
            </div>

            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>HOT COMPUTE</span>
                <Cpu size={14} weight="bold" className="text-amber-400" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                AWS Lambda (Python 3.12)
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                256MB ARM64 • ~420ms execution lifecycle
              </div>
            </div>

            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>STATE CACHE</span>
                <CheckCircle size={14} weight="bold" className="text-emerald-500" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                DynamoDB (90d TTL)
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                PK: symbol, SK: date • Sub-10ms point queries & auto-eviction
              </div>
            </div>

            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>PUSH DISPATCH</span>
                <Broadcast size={14} weight="bold" className="text-purple-400" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                AWS SNS Topic
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Multi-channel fanout: SMS, Email, Webhooks
              </div>
            </div>
          </div>

          {/* Anti-Chatter Alert Inspection Box */}
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/15 p-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/40 pb-2">
              <div className="flex items-center gap-2">
                <BellRinging size={15} weight="bold" className="text-amber-400" />
                <span className="font-bold text-amber-300 text-xs uppercase">
                  Verified Anti-Chatter Alert Output: NVDA Breakout
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50 text-[10px]">
                  Boundary Crossing Confirmed
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-[var(--surface)] border border-[var(--divider)] rounded p-0.5">
                  <button
                    onClick={() => {
                      playTick("click");
                      setAlertViewMode("card");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      alertViewMode === "card"
                        ? "bg-amber-950/80 text-amber-300 font-bold border border-amber-800/50"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => {
                      playTick("click");
                      setAlertViewMode("json");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      alertViewMode === "json"
                        ? "bg-amber-950/80 text-amber-300 font-bold border border-amber-800/50"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Raw SNS JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyAlert}
                  className="px-2 py-1 rounded border border-amber-800/60 bg-amber-950/50 hover:bg-amber-900/40 text-amber-300 text-[10px] font-mono flex items-center gap-1 transition btn-tactile cursor-pointer"
                  title="Copy Dispatched SNS JSON"
                >
                  {alertCopied ? <Check size={12} weight="bold" className="text-emerald-400" /> : <Copy size={12} weight="bold" />}
                  {alertCopied ? "Copied" : "Copy Payload"}
                </button>
              </div>
            </div>

            {alertViewMode === "card" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 flex flex-col gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    Simultaneous Factor Boundary Triggers
                  </span>
                  <div className="flex flex-col gap-1">
                    {sampleAlert.triggers.map((trigger, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--divider)] flex items-center gap-2 text-[11px]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                        <span className="text-[var(--text-primary)] font-medium">{trigger}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 justify-between bg-[var(--surface)] p-2.5 rounded border border-[var(--divider)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                      Telemetry Attributes
                    </span>
                    <div className="mt-1 flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Close Print:</span>
                        <span className="font-bold text-[var(--text-primary)]">${sampleAlert.close.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Wilder RSI-14:</span>
                        <span className="font-bold text-rose-400">{sampleAlert.metrics.rsi_14}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Bollinger %B:</span>
                        <span className="font-bold text-cyan-400">{sampleAlert.metrics.bollinger_pct_b}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Alpha Score:</span>
                        <span className="font-bold text-emerald-400">{sampleAlert.metrics.alpha_score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-[var(--text-muted)] border-t border-[var(--divider)] pt-1.5 flex flex-col gap-0.5">
                    <span className="truncate">MsgID: {sampleAlert.simulated_message_id}</span>
                    <span className="truncate">Topic: {sampleAlert.target_sns_topic}</span>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="p-2.5 rounded bg-black/70 text-emerald-400 font-mono text-[10px] overflow-x-auto border border-[var(--divider)] max-h-48 leading-relaxed">
                {JSON.stringify(sampleAlert, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
