"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import initialData from "../src/data/market_data.json";
import { MarketTerminalPayload, SymbolData } from "../types/market";
import { playTick } from "../utils/audio";

interface MarketDataContextType {
  data: MarketTerminalPayload;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  refreshData: (forceSync?: boolean) => Promise<void>;
  isDark: boolean;
  toggleTheme: () => void;
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isReportOpen: boolean;
  setIsReportOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  selectedReportSymbol: string;
  setSelectedReportSymbol: (sym: string) => void;
  isMacroOpen: boolean;
  setIsMacroOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isAnalystOpen: boolean;
  setIsAnalystOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  handleExportJson: () => void;
  handleExportCsv: () => void;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<MarketTerminalPayload>(initialData as unknown as MarketTerminalPayload);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [lastUpdated, setLastUpdated] = useState<string>("15:30:00");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");

  // Global modals and drawers
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [selectedReportSymbol, setSelectedReportSymbol] = useState<string>("NVDA");
  const [isMacroOpen, setIsMacroOpen] = useState<boolean>(false);
  const [isAnalystOpen, setIsAnalystOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  // Initialize theme from storage
  useEffect(() => {
    requestAnimationFrame(() => {
      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    });
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

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Fetch real-time market data from the Next.js API
  const refreshData = useCallback(async (forceSync = false) => {
    try {
      setIsRefreshing(true);
      const url = forceSync ? "/api/market-data?refresh=true" : "/api/market-data";
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const freshData: MarketTerminalPayload = await res.json();
        setData(freshData);
        setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
      }
    } catch (err) {
      console.warn("[MarketDataContext] Fetch update failed:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh data on initial load asynchronously
  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/market-data", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok && active) {
          const freshData: MarketTerminalPayload = await res.json();
          setData(freshData);
          setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
        }
      } catch (err) {
        console.warn("[MarketDataContext] Initial fetch failed:", err);
      }
    };
    fetchInitial();
    return () => {
      active = false;
    };
  }, []);

  // Periodic polling & micro-ticking
  useEffect(() => {
    if (refreshInterval === 0) return;

    const interval = setInterval(() => {
      // Every 3rd interval, sync with server; in between, provide micro-tick responsiveness
      refreshData(false).catch(() => {});

      // Micro-tick on subset of active instruments for fluid feedback
      setData((prev) => {
        const updatedSymbols = prev.symbols.map((sym) => {
          if (Math.random() > 0.45) return sym;

          const deltaFactor = (Math.random() - 0.49) * 0.002;
          const newPrice = Math.max(0.1, Number((sym.price * (1 + deltaFactor)).toFixed(2)));
          const newChange1d = Number((sym.change_1d + deltaFactor * 100).toFixed(2));
          const newChangeAmt = Number((sym.change_amount + (newPrice - sym.price)).toFixed(2));
          const newSparkline = [...sym.sparkline.slice(1), newPrice];

          return {
            ...sym,
            price: newPrice,
            change_1d: newChange1d,
            change_amount: newChangeAmt,
            sparkline: newSparkline,
          };
        });

        const advances = updatedSymbols.filter((s) => s.change_1d >= 0).length;
        const declines = updatedSymbols.length - advances;
        const ratio = declines === 0 ? advances : Number((advances / declines).toFixed(2));

        return {
          ...prev,
          symbols: updatedSymbols,
          macro: {
            ...prev.macro,
            market_breadth: {
              ...prev.macro.market_breadth,
              advances,
              declines,
              ratio,
            },
          },
        };
      });

      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, refreshData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        if (e.key === "Escape") {
          e.preventDefault();
          target.blur?.();
          setIsSearchOpen(false);
          setIsShortcutsOpen(false);
          setIsReportOpen(false);
          setIsMacroOpen(false);
          setIsAnalystOpen(false);
          setIsComparisonOpen(false);
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
        e.preventDefault();
        setIsSearchOpen(false);
        setIsShortcutsOpen(false);
        setIsReportOpen(false);
        setIsMacroOpen(false);
        setIsAnalystOpen(false);
        setIsComparisonOpen(false);
        return;
      }

      // Safeguard against intercepting system commands
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        playTick("click");
        setIsMacroOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        playTick("click");
        setIsAnalystOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        playTick("click");
        setIsComparisonOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        playTick("click");
        setSelectedReportSymbol(selectedSymbol);
        setIsReportOpen(true);
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        playTick("toggle");
        toggleTheme();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        playTick("toggle");
        setRefreshInterval((prev) => (prev === 0 ? 5 : 0));
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        playTick("click");
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSymbol, toggleTheme]);

  const handleExportJson = useCallback(() => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `alphaflow_terminal_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [data]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      "symbol",
      "name",
      "exchange",
      "sector",
      "price",
      "change_1d",
      "volatility_30d",
      "rsi_14",
      "bollinger_pct_b",
      "sharpe_proxy",
      "macd",
      "regime",
    ];
    const rows = data.symbols.map((s: SymbolData) =>
      [
        s.symbol,
        `"${s.name.replace(/"/g, '""')}"`,
        s.exchange,
        s.sector,
        s.price,
        s.change_1d,
        s.volatility_30d,
        s.rsi_14,
        s.bollinger_pct_b,
        s.sharpe_proxy,
        s.macd,
        s.regime,
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `alphaflow_constituents_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [data]);

  return (
    <MarketDataContext.Provider
      value={{
        data,
        isLoading,
        isRefreshing,
        lastUpdated,
        refreshInterval,
        setRefreshInterval,
        refreshData,
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
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }
  return context;
};
