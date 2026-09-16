"use client";

import React, { useState, useEffect } from "react";
import initialData from "../src/data/market_data.json";
import { MarketTerminalPayload } from "../types/market";
import { Header } from "../components/Header";
import { MacroBar } from "../components/MacroBar";
import { ScreenerTable } from "../components/ScreenerTable";
import { CandleChart } from "../components/CandleChart";
import { CorrelationMatrix } from "../components/CorrelationMatrix";
import { LakehouseTelemetry } from "../components/LakehouseTelemetry";
import { CommandPalette } from "../components/CommandPalette";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { playTick } from "../utils/audio";

export default function TerminalPage() {
  const [data, setData] = useState<MarketTerminalPayload>(initialData as unknown as MarketTerminalPayload);
  const [activeTab, setActiveTab] = useState<string>("screener");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString("en-GB", { hour12: false })
  );

  // Initialize theme from storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("alphaflow_theme");
    if (savedTheme === "light") {
      requestAnimationFrame(() => setIsDark(false));
    }
  }, []);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("alphaflow_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("alphaflow_theme", "light");
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Keyboard Shortcuts (Sentinel & Bloomberg hotkey standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user typing in form fields
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        if (e.key === "Escape") {
          setIsSearchOpen(false);
          setIsShortcutsOpen(false);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        playTick("click");
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        playTick("click");
        setActiveTab("screener");
      } else if (e.key === "2") {
        e.preventDefault();
        playTick("click");
        setActiveTab("charts");
      } else if (e.key === "3") {
        e.preventDefault();
        playTick("click");
        setActiveTab("correlation");
      } else if (e.key === "4") {
        e.preventDefault();
        playTick("click");
        setActiveTab("lakehouse");
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        playTick("toggle");
        handleToggleTheme();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        playTick("toggle");
        setRefreshInterval((prev) => (prev === 0 ? 5 : 0));
      } else if (e.key === "?") {
        e.preventDefault();
        playTick("click");
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live Market Micro-Ticking Simulation when Live interval active
  useEffect(() => {
    if (refreshInterval === 0) return;

    const interval = setInterval(() => {
      setData((prev) => {
        const updatedSymbols = prev.symbols.map((sym) => {
          // Subtle micro-tick on a subset of active instruments
          if (Math.random() > 0.4) {
            const delta = (Math.random() - 0.49) * 0.002 * sym.price;
            const newPrice = Math.max(round(sym.price + delta, 2), 1);
            const newChg = round(sym.change_1d + (delta / sym.price) * 100, 2);
            return {
              ...sym,
              price: newPrice,
              change_1d: newChg,
              change_amount: round(sym.change_amount + delta, 2)
            };
          }
          return sym;
        });

        const updatedBenchmarks = prev.macro.benchmarks.map((bm) => {
          if (Math.random() > 0.5) {
            return bm;
          }
          return bm;
        });

        return {
          ...prev,
          macro: {
            ...prev.macro,
            benchmarks: updatedBenchmarks
          },
          symbols: updatedSymbols
        };
      });

      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const round = (num: number, dec: number) => {
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `alphaflow_terminal_mart_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Symbol",
      "Security",
      "Exchange",
      "Sector",
      "Price",
      "Change_1D_Pct",
      "Volume",
      "RSI_14",
      "Bollinger_PctB",
      "Volatility_30D",
      "Sharpe_Proxy",
      "Regime"
    ];
    const rows = data.symbols.map((s) => [
      s.symbol,
      `"${s.name}"`,
      s.exchange,
      `"${s.sector}"`,
      s.price,
      s.change_1d,
      s.volume,
      s.rsi_14,
      s.bollinger_pct_b,
      s.volatility_30d,
      s.sharpe_proxy,
      s.regime
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `alphaflow_factor_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab("charts");
  };

  return (
    <div className={`min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col font-mono selection:bg-cyan-950 selection:text-cyan-300 transition-colors duration-200 ${isDark ? "dark" : ""}`}>
      {/* Top Fixed Header */}
      <Header
        benchmarks={data.macro.benchmarks}
        slaSeconds={data.telemetry.ingestion_sla_seconds}
        slaStatus={data.telemetry.sla_status}
        onSearchClick={() => setIsSearchOpen(true)}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        lastUpdated={lastUpdated}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Macro Breadth Bar & Tab Selector */}
      <MacroBar
        breadth={data.macro.market_breadth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        {activeTab === "screener" && (
          <ScreenerTable
            symbols={data.symbols}
            onOpenChart={handleOpenChart}
          />
        )}

        {activeTab === "charts" && (
          <CandleChart
            symbols={data.symbols}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
          />
        )}

        {activeTab === "correlation" && (
          <CorrelationMatrix matrix={data.correlation_matrix} />
        )}

        {activeTab === "lakehouse" && (
          <LakehouseTelemetry telemetry={data.telemetry} />
        )}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        symbols={data.symbols}
        onSelectSymbol={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab("charts");
        }}
        onSelectTab={setActiveTab}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-3 text-[11px] text-[var(--text-muted)] font-mono mt-auto transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-secondary)]">AlphaFlow Quantitative Terminal</span>
            <span>•</span>
            <span>Dual-Exchange Pipeline</span>
            <span>•</span>
            <span>Pandera Strictly Validated Parquet Marts</span>
          </div>

          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
            <span>SLA Ingestion Clock: 41.8s (&lt;300s window)</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">S3 / Athena Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
