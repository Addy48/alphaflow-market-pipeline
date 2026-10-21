"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  SquaresFour, 
  ArrowLeft, 
  Graph, 
  CircleDashed, 
  ChartDonut 
} from "@phosphor-icons/react";
import { useMarketData } from "../../context/MarketDataContext";
import { Header } from "../../components/Header";
import { CorrelationMatrix } from "../../components/CorrelationMatrix";
import { KMeansClusters } from "../../components/KMeansClusters";
import { SectorHeatmap } from "../../components/SectorHeatmap";
import { MacroContextPanel } from "../../components/MacroContextPanel";
import { AlphaAnalyst } from "../../components/AlphaAnalyst";
import { CommandPalette } from "../../components/CommandPalette";
import { KeyboardShortcutsModal } from "../../components/KeyboardShortcutsModal";
import { InstitutionalReportModal } from "../../components/InstitutionalReportModal";
import { Footer } from "../../components/Footer";
import { playTick } from "../../utils/audio";

export default function MatrixPage() {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"correlation" | "clusters" | "heatmap">("correlation");

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

  const handleOpenChart = (sym: string) => {
    setSelectedSymbol(sym);
    router.push(`/charts?symbol=${encodeURIComponent(sym)}`);
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

      {/* Sub-Header & Sub-Tab Bar */}
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
              <SquaresFour size={14} weight="bold" className="text-[var(--accent)]" />
              <span>Cross-Asset Analytics & Factor Dispersion</span>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--divider)] rounded p-0.5">
            <button
              onClick={() => {
                playTick("click");
                setSubTab("correlation");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition btn-tactile ${
                subTab === "correlation"
                  ? "bg-[var(--accent)] text-white font-bold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Graph size={13} weight={subTab === "correlation" ? "bold" : "regular"} />
              <span>Correlation Matrix</span>
            </button>
            <button
              onClick={() => {
                playTick("click");
                setSubTab("clusters");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition btn-tactile ${
                subTab === "clusters"
                  ? "bg-[var(--accent)] text-white font-bold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <CircleDashed size={13} weight={subTab === "clusters" ? "bold" : "regular"} />
              <span>K-Means Clusters</span>
            </button>
            <button
              onClick={() => {
                playTick("click");
                setSubTab("heatmap");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition btn-tactile ${
                subTab === "heatmap"
                  ? "bg-[var(--accent)] text-white font-bold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ChartDonut size={13} weight={subTab === "heatmap" ? "bold" : "regular"} />
              <span>Sector Heatmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        {subTab === "correlation" && (
          <div className="space-y-4">
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>Pearson correlation coefficient evaluated across 30-day log return trajectories (S&P 500 vs. Nifty 50).</span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">1.0 = High Co-movement | -1.0 = Inverse Hedge</span>
            </div>
            <CorrelationMatrix matrix={data.correlation_matrix} />
          </div>
        )}

        {subTab === "clusters" && (
          <div className="space-y-4">
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>Unsupervised K-Means factor clustering over normalized 2D space: 30D Annualized Volatility vs. Rolling Sharpe Proxy.</span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">k = 3 Partitioning</span>
            </div>
            <KMeansClusters
              symbols={data.symbols}
              onSelectSymbol={handleOpenChart}
              onOpenReport={(sym: string) => {
                setSelectedReportSymbol(sym);
                setIsReportOpen(true);
              }}
            />
          </div>
        )}

        {subTab === "heatmap" && (
          <div className="space-y-4">
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>Cross-Asset Sector Treemap grouped by GICS industry classification with daily performance spectrum.</span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">Green = Positive Advance | Red = Decline</span>
            </div>
            <SectorHeatmap
              symbols={data.symbols}
              onSelectSymbol={handleOpenChart}
            />
          </div>
        )}
      </main>

      {/* Slide-overs and Modals */}
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
        onSelectSymbol={handleOpenChart}
        onSelectTab={(tab) => {
          if (tab === "screener") router.push("/");
          else if (tab === "charts") router.push("/charts");
          else if (tab === "lakehouse") router.push("/architecture");
          else setSubTab(tab as "correlation" | "clusters" | "heatmap");
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
