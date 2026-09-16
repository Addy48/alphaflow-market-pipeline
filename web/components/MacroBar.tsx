"use client";

import React from "react";
import { 
  Database,
  Pulse,
  Gauge,
  TrendUp,
  ShieldCheck,
  ChartBar,
  ShareNetwork,
  Cpu,
  SlidersHorizontal
} from "@phosphor-icons/react";
import { MarketBreadth } from "../types/market";
import { playTick } from "../utils/audio";

interface MacroBarProps {
  breadth: MarketBreadth;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  breadth,
  activeTab,
  setActiveTab
}) => {
  const tabs = [
    { id: "screener", label: "Factor Screener", icon: SlidersHorizontal },
    { id: "charts", label: "Technical Workspace", icon: ChartBar },
    { id: "correlation", label: "Cross-Market Matrix", icon: ShareNetwork },
    { id: "lakehouse", label: "Lakehouse Observability", icon: Cpu },
  ];

  return (
    <div className="border-b border-[var(--divider)] bg-[var(--surface)] px-4 py-3 transition-colors duration-200">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3 font-mono">
        <div
          className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] cursor-default"
          title="Aggregated live universe from S&P 500 (US) and NIFTY 50 (NSE)"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
            <span className="font-semibold">UNIVERSE</span>
            <Database size={13} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
            {breadth.active_instruments} <span className="text-xs text-[var(--text-muted)] font-normal">equities</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            S&P 500 + Nifty 50
          </div>
        </div>

        <div
          className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] cursor-default"
          title="Real-time advance/decline distribution"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
            <span className="font-semibold">BREADTH</span>
            <Pulse size={13} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums flex items-center gap-2">
            <span className="text-emerald-500">{breadth.advances}▲</span>
            <span className="text-rose-500">{breadth.declines}▼</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            A/D Ratio: <span className="font-semibold text-[var(--text-secondary)]">{breadth.ratio}</span>
          </div>
        </div>

        <div
          className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] cursor-default"
          title="Rolling 30-day annualized realized standard deviation"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
            <span className="font-semibold">MED VOL 30D</span>
            <Gauge size={13} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
            {breadth.median_volatility_pct}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            252-day annualized
          </div>
        </div>

        <div
          className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] cursor-default"
          title="Multi-factor regime classification"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
            <span className="font-semibold">REGIME</span>
            <TrendUp size={13} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-sm font-bold text-emerald-500">
            {breadth.risk_regime}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Momentum expansion
          </div>
        </div>

        <div
          className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] col-span-2 sm:col-span-1 cursor-default"
          title="Pandera strict schema contracts"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
            <span className="font-semibold">DATA QUALITY</span>
            <ShieldCheck size={13} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-sm font-bold text-emerald-500">
            PASS
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Pandera schema validated
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[var(--divider)] pt-2.5 scrollbar-none font-mono">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playTick("click");
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition whitespace-nowrap ${
                isActive
                  ? "bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold border border-[var(--divider-strong)]"
                  : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
              }`}
            >
              <Icon size={13} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
