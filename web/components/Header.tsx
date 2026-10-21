"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Clock, 
  ShieldCheck, 
  ArrowsClockwise, 
  SpeakerHigh, 
  SpeakerSimpleX, 
  Sun, 
  Moon, 
  Question, 
  MagnifyingGlass,
  TrendUp,
  TrendDown,
  FileText,
  Globe,
  Robot,
  ChartLine,
  Table,
  SquaresFour,
  Cpu,
  BookOpen
} from "@phosphor-icons/react";
import { BenchmarkItem } from "../types/market";
import { Marquee } from "./Marquee";
import { playTick, toggleSound, isSoundEnabled } from "../utils/audio";
import { BrandLogo } from "./BrandLogo";

interface HeaderProps {
  benchmarks: BenchmarkItem[];
  slaSeconds: number;
  slaStatus: string;
  onSearchClick: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onOpenReport?: () => void;
  onOpenMacro?: () => void;
  onOpenAnalyst?: () => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  lastUpdated: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  benchmarks,
  slaSeconds,
  slaStatus,
  onSearchClick,
  onExportJson,
  onExportCsv,
  onOpenReport,
  onOpenMacro,
  onOpenAnalyst,
  refreshInterval,
  setRefreshInterval,
  lastUpdated,
  isDark,
  onToggleTheme,
  onOpenShortcuts,
  onRefreshData,
  isRefreshing = false
}) => {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState<boolean>(() => (typeof window !== "undefined" ? isSoundEnabled() : false));
  const [times, setTimes] = useState({ ny: "", ist: "", utc: "" });

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimes({
        ny: now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }),
        ist: now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false }),
        utc: now.toLocaleTimeString("en-US", { timeZone: "UTC", hour12: false })
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

  const navLinks = [
    { label: "Screener", href: "/", icon: Table },
    { label: "Charts", href: "/charts", icon: ChartLine },
    { label: "Matrix & Heatmap", href: "/matrix", icon: SquaresFour },
    { label: "Architecture", href: "/architecture", icon: Cpu },
    { label: "Methodology", href: "/methodology", icon: BookOpen },
  ];

  return (
    <header className="border-b border-[var(--divider)] bg-[var(--surface)] backdrop-blur-md sticky top-0 z-40 transition-colors duration-200 shadow-xs font-mono">
      {/* Primary Authoritative Navigation Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-[var(--divider)]">
        {/* Left: Singular Brand Identity + Nav Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => playTick("click")}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="AlphaFlow Quantitative Intelligence"
          >
            <div className="w-7 h-7 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-center p-0.5 shadow-2xs group-hover:border-[var(--accent-border)] transition">
              <BrandLogo variant="icon" size="sm" priority />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tracking-wider text-[var(--text-primary)]">
                ALPHAFLOW
              </span>
              <span className="hidden sm:inline px-1 py-0.2 rounded text-[9px] font-mono text-[var(--text-muted)] border border-[var(--divider)] bg-[var(--surface-subtle)]">
                v2.4
              </span>
            </div>
          </Link>

          {/* Dedicated Page Navigation Tabs */}
          <nav aria-label="Terminal Navigation" className="hidden lg:flex items-center gap-1 border-l border-[var(--divider)] pl-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => playTick("click")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition btn-tactile ${
                    isActive
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)] font-semibold shadow-2xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
                  }`}
                >
                  <Icon size={13} weight={isActive ? "bold" : "regular"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Trigger (Command Palette) */}
        <div className="flex-1 max-w-xs hidden md:block">
          <button
            onClick={() => {
              playTick("click");
              onSearchClick();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition btn-tactile cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              <MagnifyingGlass size={13} weight="bold" />
              <span className="text-[11px]">Search assets, factors...</span>
            </span>
            <kbd className="px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--divider)] text-[9px] font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Market Clocks + SLA + Cadence + Utilities */}
        <div className="flex items-center gap-2">
          {/* World Clocks (Collapses on Mobile) */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-[var(--text-secondary)] border-r border-[var(--divider)] pr-2" suppressHydrationWarning>
            <span className="flex items-center gap-1">
              <Clock size={12} weight="bold" className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-muted)]">NY:</span>
              <span className="text-[var(--text-primary)] font-semibold" suppressHydrationWarning>{times.ny || "16:00"}</span>
            </span>
            <span className="opacity-30">/</span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">MUM:</span>
              <span className="text-[var(--text-primary)] font-semibold" suppressHydrationWarning>{times.ist || "15:30"}</span>
            </span>
            <span className="opacity-30">/</span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">UTC:</span>
              <span className="text-[var(--text-primary)] font-semibold" suppressHydrationWarning>{times.utc || "20:00"}</span>
            </span>
          </div>

          {/* SLA Badge */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--risk-success-border)] bg-[var(--risk-success-bg)] text-[var(--risk-success)] text-[10px]"
            title={`Pandera SLA: ${slaSeconds}s (${slaStatus}) • Last Synced: ${lastUpdated}`}
          >
            <ShieldCheck size={12} weight="bold" />
            <span>SLA: {slaSeconds}s</span>
          </div>

          {/* Refresh Cadence & Real-time Trigger */}
          <div className="flex items-center gap-1 bg-[var(--surface-subtle)] border border-[var(--divider)] rounded px-1.5 py-0.5 text-[10px]">
            <button
              onClick={() => {
                playTick("click");
                if (onRefreshData) onRefreshData();
              }}
              disabled={isRefreshing}
              className="p-0.5 hover:text-[var(--accent)] transition cursor-pointer disabled:opacity-50"
              title="Sync latest market data now"
            >
              <ArrowsClockwise 
                size={12} 
                weight="bold" 
                className={`${isRefreshing || refreshInterval > 0 ? "animate-spin text-[var(--accent)]" : "text-[var(--text-muted)]"}`} 
                style={{ animationDuration: isRefreshing ? "1s" : "6s" }} 
              />
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => {
                playTick("click");
                setRefreshInterval(Number(e.target.value));
              }}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer py-0.5 text-[10px] pr-1"
            >
              <option value={5}>LIVE 5s</option>
              <option value={15}>15s</option>
              <option value={60}>60s</option>
              <option value={0}>PAUSED</option>
            </select>
          </div>

          {/* AI Alpha Analyst Assistant */}
          {onOpenAnalyst && (
            <button
              onClick={() => {
                playTick("click");
                onOpenAnalyst();
              }}
              className="px-2 py-0.5 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] text-[11px] flex items-center gap-1 transition btn-tactile font-semibold cursor-pointer"
              title="Open AI Analyst Assistant (A)"
            >
              <Robot size={13} weight="bold" />
              <span className="hidden sm:inline">Analyst</span>
            </button>
          )}

          {/* Research Tear-Sheet PDF */}
          {onOpenReport && (
            <button
              onClick={() => {
                playTick("click");
                onOpenReport();
              }}
              className="hidden md:flex px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] items-center gap-1 transition btn-tactile"
              title="Print Tear-Sheet (R)"
            >
              <FileText size={12} weight="bold" />
              <span>PDF</span>
            </button>
          )}

          {/* Export CSV / JSON */}
          <div className="hidden 2xl:flex items-center gap-1">
            <button
              onClick={() => {
                playTick("click");
                onExportJson();
              }}
              className="px-1.5 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] text-[10px] transition btn-tactile"
              title="Export JSON"
            >
              JSON
            </button>
            <button
              onClick={() => {
                playTick("click");
                onExportCsv();
              }}
              className="px-1.5 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] text-[10px] transition btn-tactile"
              title="Export CSV"
            >
              CSV
            </button>
          </div>

          {/* Macro Context Drawer */}
          {onOpenMacro && (
            <button
              onClick={() => {
                playTick("click");
                onOpenMacro();
              }}
              className="p-1 rounded border border-[var(--divider)] hover:border-[var(--accent-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition btn-tactile cursor-pointer"
              title="Macro Context (M)"
            >
              <Globe size={14} weight="bold" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition btn-tactile"
            title={soundOn ? "Mute Terminal Audio" : "Unmute Terminal Audio"}
          >
            {soundOn ? <SpeakerHigh size={14} weight="bold" /> : <SpeakerSimpleX size={14} weight="bold" className="text-zinc-500" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              playTick("toggle");
              onToggleTheme();
            }}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition flex items-center justify-center btn-tactile"
            title={isDark ? "Switch to Light Mode (T)" : "Switch to Dark Mode (T)"}
          >
            {isDark ? <Sun size={14} weight="bold" className="text-amber-400" /> : <Moon size={14} weight="bold" className="text-[var(--accent)]" />}
          </button>

          {/* Keyboard Shortcuts (?) */}
          <button
            onClick={() => {
              playTick("click");
              onOpenShortcuts();
            }}
            className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition btn-tactile cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <Question size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Secondary Ribbon: Mobile Nav (if small screen) + Live Smooth Benchmark Marquee */}
      <div className="px-4 py-1 flex items-center justify-between gap-3 bg-[var(--surface-subtle)] text-xs">
        {/* Mobile Nav Links */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-0.5 text-[11px]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => playTick("click")}
                className={`px-2 py-0.5 rounded whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Benchmark Marquee */}
        <div className="w-full overflow-hidden">
          <Marquee speedSeconds={40} pauseOnHover={true}>
            {benchmarks.map((bm) => {
              const isPos = bm.change.startsWith("+");
              return (
                <div
                  key={bm.ticker}
                  className="flex-shrink-0 px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex items-center gap-1.5 text-[11px] transition hover:border-[var(--accent-border)]"
                >
                  <span className="font-semibold text-[var(--text-secondary)]">{bm.ticker}</span>
                  <span className="text-[var(--text-primary)] tabular-nums font-bold">{bm.value}</span>
                  <span
                    className={`text-[10px] font-bold tabular-nums flex items-center gap-0.5 ${
                      isPos ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {isPos ? <TrendUp size={11} weight="bold" /> : <TrendDown size={11} weight="bold" />}
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
