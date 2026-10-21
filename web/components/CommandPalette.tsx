"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  MagnifyingGlass, 
  X, 
  SlidersHorizontal, 
  ChartBar, 
  ShareNetwork, 
  Cpu,
  CirclesFour,
  SquaresFour,
  ArrowsLeftRight,
  Globe,
  Robot,
  Lightning,
  TerminalWindow
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { playTick } from "../utils/audio";
import { fuzzyScore } from "../utils/fuzzy";

const ALL_VIEWS = [
  { id: "screener", label: "Factor Screener & Data Grid", shortcut: "1", icon: SlidersHorizontal },
  { id: "charts", label: "Technical Workspace & Candlesticks", shortcut: "2", icon: ChartBar },
  { id: "correlation", label: "Cross-Market Correlation Matrix", shortcut: "3", icon: ShareNetwork },
  { id: "clusters", label: "K-Means Factor Clustering Archetypes", shortcut: "4", icon: CirclesFour },
  { id: "heatmap", label: "Sector Heatmap Treemap", shortcut: "5", icon: SquaresFour },
  { id: "lakehouse", label: "Medallion Lakehouse Observability", shortcut: "6", icon: Cpu },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: SymbolData[];
  onSelectSymbol: (symbol: string) => void;
  onSelectTab: (tab: string) => void;
  onOpenMacro?: () => void;
  onOpenAnalyst?: () => void;
  onToggleBriefing?: () => void;
  onOpenComparison?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  symbols,
  onSelectSymbol,
  onSelectTab,
  onOpenMacro,
  onOpenAnalyst,
  onToggleBriefing,
  onOpenComparison
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    inputRef.current?.blur();
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement)?.blur?.();
      document.body?.focus?.();
    }
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      inputRef.current?.blur();
      if (typeof document !== "undefined" && document.activeElement === inputRef.current) {
        (document.activeElement as HTMLElement)?.blur?.();
        document.body?.focus?.();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) handleClose();
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const filteredSymbols = useMemo(() => {
    if (!query.trim()) return symbols;
    return symbols
      .map((s) => {
        const symScore = fuzzyScore(query, s.symbol);
        const nameScore = fuzzyScore(query, s.name);
        const secScore = fuzzyScore(query, s.sector);
        const maxScore = Math.max(symScore, nameScore, secScore);
        return { s, score: maxScore };
      })
      .filter((x) => x.score > 0.08)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
  }, [symbols, query]);

  const views = useMemo(() => {
    if (!query.trim()) return ALL_VIEWS;
    return ALL_VIEWS.filter(
      (v) =>
        v.label.toLowerCase().includes(query.toLowerCase()) ||
        v.id.toLowerCase().includes(query.toLowerCase()) ||
        fuzzyScore(query, v.label) > 0.15
    );
  }, [query]);

  const allActions = useMemo(() => [
    {
      id: "briefing",
      label: "Toggle Daily Alpha Briefing",
      shortcut: "B",
      icon: Lightning,
      action: onToggleBriefing,
    },
    {
      id: "compare",
      label: "Symbol Factor Comparison & Radar",
      shortcut: "C",
      icon: ArrowsLeftRight,
      action: onOpenComparison,
    },
    {
      id: "macro",
      label: "Open Macro Context Panel",
      shortcut: "M",
      icon: Globe,
      action: onOpenMacro,
    },
    {
      id: "analyst",
      label: "Open AI Alpha Analyst Assistant",
      shortcut: "A",
      icon: Robot,
      action: onOpenAnalyst,
    },
  ], [onToggleBriefing, onOpenComparison, onOpenMacro, onOpenAnalyst]);

  const actions = useMemo(() => {
    if (!query.trim()) return allActions;
    return allActions.filter(
      (a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        fuzzyScore(query, a.label) > 0.15
    );
  }, [allActions, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg w-full max-w-lg shadow-raised overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)]">
          <MagnifyingGlass size={16} weight="bold" className="text-[var(--accent)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search equities, views, or commands (e.g. 'nvidia', 'heatmap', 'macro')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm text-[var(--text-primary)] focus:outline-none w-full placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={() => {
              playTick("click");
              handleClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1 text-xs">
          {/* Quick Actions section */}
          {actions.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Quick Actions
              </div>
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      playTick("click");
                      a.action?.();
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition btn-tactile cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} weight="bold" className="text-[var(--accent)]" />
                      <span>{a.label}</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[10px] text-[var(--text-muted)]">
                      {a.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}

          {/* Views section */}
          {views.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Workspaces & Views
              </div>
              {views.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      playTick("click");
                      onSelectTab(v.id);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition btn-tactile cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} weight="bold" className="text-[var(--accent)]" />
                      <span>{v.label}</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[10px] text-[var(--text-muted)]">
                      {v.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}

          {/* Equities section */}
          <div>
            <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase font-semibold">
              Equities & Factor Mart ({filteredSymbols.length})
            </div>
            {filteredSymbols.length === 0 ? (
              <div className="px-3 py-4 text-center text-[var(--text-muted)] text-xs">
                No matching instruments found.
              </div>
            ) : (
              filteredSymbols.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => {
                    playTick("blip");
                    onSelectSymbol(s.symbol);
                    onSelectTab("charts");
                    handleClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left transition group btn-tactile cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition">
                      {s.symbol}
                    </span>
                    <span className="text-[10px] px-1 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[var(--text-muted)]">
                      {s.exchange}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]">
                      {s.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-[var(--text-primary)] font-semibold">
                      {s.exchange === "NSE" ? "₹" : "$"}
                      {s.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        s.change_1d >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {s.change_1d >= 0 ? "+" : ""}
                      {s.change_1d.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-1.5 border-t border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TerminalWindow size={13} weight="bold" className="text-[var(--accent)]" />
            <span>Command Matrix</span>
          </div>
          <span>ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
