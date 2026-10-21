"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cpu, ArrowLeft } from "@phosphor-icons/react";
import { useMarketData } from "../../context/MarketDataContext";
import { Header } from "../../components/Header";
import { LakehouseTelemetry } from "../../components/LakehouseTelemetry";
import { ArchitectureSection } from "../../components/ArchitectureSection";
import { MacroContextPanel } from "../../components/MacroContextPanel";
import { AlphaAnalyst } from "../../components/AlphaAnalyst";
import { CommandPalette } from "../../components/CommandPalette";
import { KeyboardShortcutsModal } from "../../components/KeyboardShortcutsModal";
import { InstitutionalReportModal } from "../../components/InstitutionalReportModal";
import { Footer } from "../../components/Footer";
import { playTick } from "../../utils/audio";

export default function ArchitecturePage() {
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
    setIsComparisonOpen,
    handleExportJson,
    handleExportCsv,
  } = useMarketData();

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

      {/* Sub-Header & Breadcrumb */}
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
              <Cpu size={14} weight="bold" className="text-[var(--accent)]" />
              <span>Medallion Lakehouse Observability & Dual-Plane Architecture</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>S3 / Parquet / Athena</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">100% Pandera Pass</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
        {/* Lakehouse Telemetry & Ingestion SLA */}
        <LakehouseTelemetry telemetry={data.telemetry} />

        {/* Dual-Plane Architecture Deep Dive Specification */}
        <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface)] overflow-hidden shadow-subtle">
          <ArchitectureSection />
        </div>
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
        onSelectSymbol={(sym) => {
          setSelectedSymbol(sym);
          router.push(`/charts?symbol=${encodeURIComponent(sym)}`);
        }}
        onSelectTab={(tab) => {
          if (tab === "screener") router.push("/");
          else if (tab === "charts") router.push("/charts");
          else if (tab === "correlation" || tab === "clusters" || tab === "heatmap") router.push("/matrix");
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
