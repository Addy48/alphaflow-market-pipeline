"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  ShieldCheck, 
  ArrowsClockwise, 
  SpeakerHigh, 
  SpeakerSimpleX, 
  Sun, 
  Moon, 
  Question, 
  DownloadSimple, 
  MagnifyingGlass,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react";
import { BenchmarkItem } from "../types/market";
import { Marquee } from "./Marquee";
import { playTick, toggleSound } from "../utils/audio";

interface HeaderProps {
  benchmarks: BenchmarkItem[];
  slaSeconds: number;
  slaStatus: string;
  onSearchClick: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  lastUpdated: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  benchmarks,
  slaSeconds,
  slaStatus,
  onSearchClick,
  onExportJson,
  onExportCsv,
  refreshInterval,
  setRefreshInterval,
  lastUpdated,
  isDark,
  onToggleTheme,
  onOpenShortcuts
}) => {
  const [times, setTimes] = useState({
    utc: "",
    ny: "",
    ist: ""
  });
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimes({
        utc: now.toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false }) + " UTC",
        ny: now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }) + " ET",
        ist: now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) + " IST"
      });
    };
    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSoundToggle = () => {
    const state = toggleSound();
    setSoundOn(state);
  };

  return (
    <header className="border-b border-[var(--divider)] bg-[var(--surface)] backdrop-blur-md sticky top-0 z-40 transition-colors duration-200 shadow-xs">
      {/* Top Utility Ribbon */}
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-[var(--divider)] text-xs text-[var(--text-secondary)] gap-2 bg-[var(--surface-subtle)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[var(--text-primary)] font-bold tracking-wider">ALPHAFLOW</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-muted)]">Market Intelligence Pipeline</span>
          </div>

          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Clock size={13} weight="bold" className="text-[var(--text-muted)]" />
              <span>NY:</span>
              <span className="text-[var(--text-primary)] font-semibold">{times.ny || "16:00 ET"}</span>
            </span>
            <span className="opacity-30">/</span>
            <span className="flex items-center gap-1">
              <span>MUM:</span>
              <span className="text-[var(--text-primary)] font-semibold">{times.ist || "15:30 IST"}</span>
            </span>
            <span className="opacity-30">/</span>
            <span className="flex items-center gap-1">
              <span>UTC:</span>
              <span className="text-[var(--text-primary)] font-semibold">{times.utc || "20:00 UTC"}</span>
            </span>
            <span className="opacity-30 hidden md:inline">/</span>
            <span className="items-center gap-1 hidden md:flex text-[var(--text-muted)]">
              <span>SYNC:</span>
              <span className="text-[var(--text-secondary)]">{lastUpdated}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* SLA Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-900/40 bg-emerald-950/20 text-emerald-500 font-mono text-[11px]">
            <ShieldCheck size={14} weight="bold" />
            <span>SLA: {slaSeconds}s ({slaStatus})</span>
          </div>

          {/* Refresh Cadence */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--divider)] rounded px-1.5 py-0.5 text-[11px] font-mono">
            <ArrowsClockwise size={13} weight="bold" className={`text-[var(--text-muted)] ${refreshInterval > 0 ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
            <select
              value={refreshInterval}
              onChange={(e) => {
                playTick("click");
                setRefreshInterval(Number(e.target.value));
              }}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer py-0.5 text-[10px]"
            >
              <option value={5}>LIVE (5s)</option>
              <option value={15}>15s</option>
              <option value={60}>60s</option>
              <option value={0}>PAUSED</option>
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition btn-tactile"
            title={soundOn ? "Mute Terminal Audio" : "Unmute Terminal Audio"}
          >
            {soundOn ? <SpeakerHigh size={14} weight="bold" /> : <SpeakerSimpleX size={14} weight="bold" className="text-zinc-500" />}
          </button>

          {/* Theme Toggle (Sentinel Style) */}
          <button
            onClick={() => {
              playTick("toggle");
              onToggleTheme();
            }}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition flex items-center gap-1 text-[11px] btn-tactile"
            title={isDark ? "Switch to Editorial Light" : "Switch to Drafting Dark"}
          >
            {isDark ? <Sun size={14} weight="bold" className="text-amber-400" /> : <Moon size={14} weight="bold" className="text-cyan-600" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => {
              playTick("click");
              onOpenShortcuts();
            }}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition btn-tactile"
            title="Keyboard Shortcuts (?)"
          >
            <Question size={14} weight="bold" />
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                playTick("click");
                onExportJson();
              }}
              className="px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[11px] font-mono flex items-center gap-1 transition btn-tactile"
              title="Download Full Mart Data (JSON)"
            >
              <DownloadSimple size={13} weight="bold" />
              JSON
            </button>
            <button
              onClick={() => {
                playTick("click");
                onExportCsv();
              }}
              className="px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[11px] font-mono flex items-center gap-1 transition btn-tactile"
              title="Download Constituents CSV"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Bar & Live Ticker Strip */}
      <div className="px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-[var(--divider)] flex items-center justify-center font-mono font-bold text-[var(--text-secondary)] text-base">
              α
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-mono">
                  AlphaFlow Terminal
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] border border-[var(--divider)] bg-[var(--surface-subtle)]">
                  S&P 500 + NSE
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Vectorized technical factor pipeline
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTick("click");
              onSearchClick();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition btn-tactile"
          >
            <MagnifyingGlass size={14} weight="bold" className="text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Search symbol, sector or factor...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[10px] text-[var(--text-muted)] font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Live Smooth Benchmark Marquee Ticker */}
        <div className="w-full lg:max-w-xl overflow-hidden font-mono">
          <Marquee speedSeconds={40} pauseOnHover={true}>
            {benchmarks.map((bm) => {
              const isPos = bm.change.startsWith("+");
              return (
                <div
                  key={bm.ticker}
                  className="flex-shrink-0 px-2.5 py-1 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center gap-2 text-xs transition hover:border-cyan-500/40"
                >
                  <span className="font-semibold text-[var(--text-secondary)]">{bm.ticker}</span>
                  <span className="text-[var(--text-primary)] tabular-nums font-bold">{bm.value}</span>
                  <span
                    className={`text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${
                      isPos ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {isPos ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
                    {bm.change}
                  </span>
                </div>
              );
            })}
          </Marquee>
        </div>
      </div>
    </header>
  );
};
