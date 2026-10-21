"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  X, 
  Lightning, 
  ChartLine, 
  SquaresFour, 
  Cpu, 
  BookOpen, 
  ArrowRight,
} from "@phosphor-icons/react";
import { useMarketData } from "../context/MarketDataContext";
import { Header } from "../components/Header";
import { ExecutiveHero } from "../components/ExecutiveHero";
import { MacroBar } from "../components/MacroBar";
import { AlphaBriefing } from "../components/AlphaBriefing";
import { ScreenerTable } from "../components/ScreenerTable";
import { SymbolComparison } from "../components/SymbolComparison";
import { MacroContextPanel } from "../components/MacroContextPanel";
import { AlphaAnalyst } from "../components/AlphaAnalyst";
import { CommandPalette } from "../components/CommandPalette";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { InstitutionalReportModal } from "../components/InstitutionalReportModal";
import { Footer } from "../components/Footer";
import { playTick } from "../utils/audio";

export default function TerminalPage() {
  const router = useRouter();

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
    isComparisonOpen,
    setIsComparisonOpen,
    handleExportJson,
    handleExportCsv,
  } = useMarketData();

  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(true);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);

  // Initialize briefing preference from storage
  useEffect(() => {
    const savedBriefing = localStorage.getItem("alphaflow_briefing");
    if (savedBriefing === "collapsed") {
      requestAnimationFrame(() => setIsBriefingOpen(false));
    }
  }, []);

  const handleToggleBriefing = useCallback(() => {
    setIsBriefingOpen((prev) => {
      const next = !prev;
      localStorage.setItem("alphaflow_briefing", next ? "expanded" : "collapsed");
      return next;
    });
  }, []);

  const handleOpenChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    router.push(`/charts?symbol=${encodeURIComponent(symbol)}`);
  };

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

      {/* Executive Hero & Pipeline Ledger */}
      <ExecutiveHero
        onLaunchTerminal={() => {
          const el = document.getElementById("screener-workspace");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenReport={() => {
          setSelectedReportSymbol(selectedSymbol);
          setIsReportOpen(true);
        }}
        slaSeconds={data.telemetry.ingestion_sla_seconds}
        slaStatus={data.telemetry.sla_status}
        activeInstruments={data.macro.market_breadth.active_instruments}
      />

      {/* Analytical Hub Navigation Cards */}
      <section aria-label="Terminal Modules" className="px-4 py-3 bg-[var(--surface-subtle)] border-y border-[var(--divider)]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/charts"
            onClick={() => playTick("click")}
            className="p-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] transition flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--accent)] font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <ChartLine size={15} weight="bold" />
                  <span>Technical Workspace</span>
                </span>
                <ArrowRight size={12} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Full-screen interactive candlesticks, RSI-14, MACD, and Bollinger Bands.
              </p>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2 font-mono flex items-center gap-1">
              <span>Deep link: /charts?symbol=NVDA</span>
            </div>
          </Link>

          <Link
            href="/matrix"
            onClick={() => playTick("click")}
            className="p-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] transition flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--accent)] font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <SquaresFour size={15} weight="bold" />
                  <span>Cross-Asset Matrix</span>
                </span>
                <ArrowRight size={12} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Dual-Exchange Pearson correlation, K-Means clusters, and Sector Treemap.
              </p>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2 font-mono flex items-center gap-1">
              <span>S&P 500 vs. NIFTY 50</span>
            </div>
          </Link>

          <Link
            href="/architecture"
            onClick={() => playTick("click")}
            className="p-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] transition flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--accent)] font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Cpu size={15} weight="bold" />
                  <span>Lakehouse Observability</span>
                </span>
                <ArrowRight size={12} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Medallion Lakehouse telemetry, Dual-Plane diagram, and SNS breakout schema.
              </p>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2 font-mono flex items-center gap-1">
              <span>SLA: {data.telemetry.ingestion_sla_seconds}s (Compliant)</span>
            </div>
          </Link>

          <Link
            href="/methodology"
            onClick={() => playTick("click")}
            className="p-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] transition flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--accent)] font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={15} weight="bold" />
                  <span>Factor Methodology</span>
                </span>
                <ArrowRight size={12} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                14 Vectorized Factors formulated with Wilder EWM, Sharpe, and Pandera contracts.
              </p>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-2 font-mono flex items-center gap-1">
              <span>Mathematical Invariants</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Main Terminal Workspace (Dominant Interactive Module) */}
      <div id="screener-workspace" className="scroll-mt-16 flex flex-col">
        {/* Macro Breadth Bar */}
        <MacroBar
          breadth={data.macro.market_breadth}
          activeTab="screener"
          setActiveTab={(tab) => {
            if (tab === "charts") router.push("/charts");
            else if (tab === "correlation" || tab === "clusters" || tab === "heatmap") router.push("/matrix");
            else if (tab === "lakehouse") router.push("/architecture");
          }}
        />

        {/* Daily Alpha Briefing Banner */}
        <AlphaBriefing
          symbols={data.symbols}
          generatedAt={data.metadata?.generated_at || new Date().toISOString()}
          isOpen={isBriefingOpen}
          onClose={handleToggleBriefing}
          onSelectSymbol={handleOpenChart}
        />

        {/* Sleek Collapsed Briefing Ribbon */}
        {!isBriefingOpen && (
          <div className="border-b border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-1.5 transition-colors duration-200 shadow-2xs">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="text-[var(--accent)] font-bold flex items-center gap-1.5">
                  <Lightning size={12} weight="fill" />
                  <span>ALPHA BRIEFING</span>
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[var(--text-muted)]">
                  Top Alpha: <strong className="text-[var(--risk-success)]">{data.symbols[0]?.symbol || "AAPL"}</strong>
                </span>
                <span className="text-[var(--text-muted)] hidden md:inline">•</span>
                <span className="text-[var(--text-muted)] hidden md:inline">
                  Real-time factor intelligence active
                </span>
              </div>
              <button
                onClick={handleToggleBriefing}
                className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer btn-tactile"
                title="Expand Alpha Briefing (B)"
              >
                <span>Expand Briefing</span>
                <kbd className="px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--divider-strong)] text-[9px] text-[var(--text-muted)] font-mono font-bold">
                  B
                </kbd>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Container: Factor Screener Table */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        <ScreenerTable
          symbols={data.symbols}
          onOpenChart={handleOpenChart}
          onOpenReport={(sym) => {
            setSelectedReportSymbol(sym);
            setIsReportOpen(true);
          }}
          showWatchlistOnly={showWatchlistOnly}
          onToggleWatchlistFilter={() => setShowWatchlistOnly((prev) => !prev)}
        />
      </main>

      {/* Symbol Comparison Modal */}
      {isComparisonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-raised overflow-y-auto p-4 relative animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--divider)]">
              <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">
                Cross-Asset Quantitative Factor Comparison
              </span>
              <button
                onClick={() => {
                  playTick("click");
                  setIsComparisonOpen(false);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
                title="Dismiss comparison (ESC)"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
            <SymbolComparison
              symbols={data.symbols}
              initialSymbolA={selectedSymbol}
              initialSymbolB={selectedSymbol === "TCS.NS" ? "INFY.NS" : "TCS.NS"}
            />
          </div>
        </div>
      )}

      {/* Macro Context Slide-over Panel */}
      <MacroContextPanel
        benchmarks={data.macro.benchmarks}
        isOpen={isMacroOpen}
        onClose={() => setIsMacroOpen(false)}
      />

      {/* AI Alpha Analyst Slide-over Chatbot */}
      <AlphaAnalyst
        marketData={data}
        isOpen={isAnalystOpen}
        onClose={() => setIsAnalystOpen(false)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        symbols={data.symbols}
        onSelectSymbol={handleOpenChart}
        onSelectTab={(tab) => {
          if (tab === "charts") router.push("/charts");
          else if (tab === "correlation" || tab === "clusters" || tab === "heatmap") router.push("/matrix");
          else if (tab === "lakehouse") router.push("/architecture");
        }}
        onOpenMacro={() => setIsMacroOpen(true)}
        onOpenAnalyst={() => setIsAnalystOpen(true)}
        onToggleBriefing={handleToggleBriefing}
        onOpenComparison={() => setIsComparisonOpen(true)}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Institutional Research Tear-Sheet Printable Modal */}
      <InstitutionalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        marketData={data}
        selectedSymbol={selectedReportSymbol}
        isDark={isDark}
      />

      {/* Comprehensive Institutional Footer */}
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
