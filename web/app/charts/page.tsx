"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChartLine, 
  ArrowLeft, 
  ShareNetwork, 
  Check 
} from "@phosphor-icons/react";
import { useMarketData } from "../../context/MarketDataContext";
import { Header } from "../../components/Header";
import { CandleChart } from "../../components/CandleChart";
import { MacroContextPanel } from "../../components/MacroContextPanel";
import { AlphaAnalyst } from "../../components/AlphaAnalyst";
import { CommandPalette } from "../../components/CommandPalette";
import { KeyboardShortcutsModal } from "../../components/KeyboardShortcutsModal";
import { InstitutionalReportModal } from "../../components/InstitutionalReportModal";
import { Footer } from "../../components/Footer";
import { playTick } from "../../utils/audio";

function ChartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get("symbol");

  const {
    data,
    isRefreshing,
    refreshInterval,
    setRefreshInterval,
    refreshData,
    lastUpdated,
    isDark,
    toggleTheme,
    selectedSymbol,
    setSelectedSymbol,
    isSearchOpen,
    setIsSearchOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isReportOpen,
    setIsReportOpen,
    selectedReportSymbol,
    setSelectedReportSymbol,
    isMacroOpen,
    setIsMacroOpen,
    isAnalystOpen,
    setIsAnalystOpen,
    setIsComparisonOpen,
    handleExportJson,
    handleExportCsv,
  } = useMarketData();

  const [copiedLink, setCopiedLink] = useState(false);

  // Sync selected symbol from URL query if present
  useEffect(() => {
    if (symbolParam && data.symbols.some((s) => s.symbol === symbolParam)) {
      setSelectedSymbol(symbolParam);
    }
  }, [symbolParam, data.symbols, setSelectedSymbol]);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    router.replace(`/charts?symbol=${encodeURIComponent(sym)}`, { scroll: false });
  };

  const handleCopyLink = () => {
    playTick("click");
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentStock = data.symbols.find((s) => s.symbol === selectedSymbol) || data.symbols[0];

  return (
    <div className={`min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col font-mono selection:bg-[var(--accent-dim)] selection:text-[var(--text-primary)] transition-colors duration-200 ${isDark ? "dark" : ""}`}>
      {/* Top Authoritative Header */}
      <Header
        benchmarks={data.macro.benchmarks}
        slaSeconds={data.telemetry.ingestion_sla_seconds}
        slaStatus={data.telemetry.sla_status}
        onSearchClick={() => setIsSearchOpen(true)}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onOpenReport={() => {
          setSelectedReportSymbol(selectedSymbol);
          setIsReportOpen(true);
        }}
        onOpenMacro={() => setIsMacroOpen((prev) => !prev)}
        onOpenAnalyst={() => setIsAnalystOpen((prev) => !prev)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        lastUpdated={lastUpdated}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onRefreshData={() => refreshData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Charts Workspace Sub-Header & Breadcrumb */}
      <div className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-2 text-xs">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={() => playTick("click")}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition btn-tactile text-[11px]"
            >
              <ArrowLeft size={12} weight="bold" />
              <span>Screener</span>
            </Link>
            <span className="text-[var(--text-muted)]">/</span>
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
              <ChartLine size={14} weight="bold" className="text-[var(--accent)]" />
              <span>Technical Candlestick Workspace</span>
            </div>
            {currentStock && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[10px] text-[var(--text-secondary)]">
                {currentStock.symbol} • {currentStock.sector} • {currentStock.exchange}
              </span>
            )}
          </div>

          {/* Quick Instrument Jump Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider hidden sm:inline">
              Jump:
            </span>
            {data.symbols.slice(0, 8).map((s) => (
              <button
                key={s.symbol}
                onClick={() => {
                  playTick("click");
                  handleSelectSymbol(s.symbol);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition btn-tactile ${
                  selectedSymbol === s.symbol
                    ? "bg-[var(--accent)] text-white font-bold shadow-2xs"
                    : "bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-border)]"
                }`}
              >
                {s.symbol}
              </button>
            ))}

            <button
              onClick={handleCopyLink}
              className="p-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition btn-tactile ml-1"
              title="Copy deep link to this chart"
            >
              {copiedLink ? <Check size={12} weight="bold" className="text-emerald-400" /> : <ShareNetwork size={12} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Candlestick Area */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        <CandleChart
          symbols={data.symbols}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={handleSelectSymbol}
        />
      </main>

      {/* Modals & Slide-overs */}
      <MacroContextPanel
        benchmarks={data.macro.benchmarks}
        isOpen={isMacroOpen}
        onClose={() => setIsMacroOpen(false)}
      />

      <AlphaAnalyst
        marketData={data}
        isOpen={isAnalystOpen}
        onClose={() => setIsAnalystOpen(false)}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        symbols={data.symbols}
        onSelectSymbol={handleSelectSymbol}
        onSelectTab={(tab) => {
          if (tab === "screener") router.push("/");
          else if (tab === "correlation" || tab === "clusters" || tab === "heatmap") router.push("/matrix");
          else if (tab === "lakehouse") router.push("/architecture");
        }}
        onOpenMacro={() => setIsMacroOpen(true)}
        onOpenAnalyst={() => setIsAnalystOpen(true)}
        onToggleBriefing={() => {}}
        onOpenComparison={() => setIsComparisonOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <InstitutionalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        marketData={data}
        selectedSymbol={selectedReportSymbol}
        isDark={isDark}
      />

      <Footer
        slaSeconds={data.telemetry.ingestion_sla_seconds}
        slaStatus={data.telemetry.sla_status}
        onOpenReport={() => {
          setSelectedReportSymbol(selectedSymbol);
          setIsReportOpen(true);
        }}
      />
    </div>
  );
}

export default function ChartsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
          Loading Technical Candlestick Workspace...
        </div>
      }
    >
      <ChartsContent />
    </Suspense>
  );
}
