"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  MagnifyingGlass, 
  X, 
  ArrowRight, 
  SlidersHorizontal, 
  ChartBar, 
  ShareNetwork, 
  Cpu 
} from "@phosphor-icons/react";
import { SymbolData } from "../types/market";
import { playTick } from "../utils/audio";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: SymbolData[];
  onSelectSymbol: (symbol: string) => void;
  onSelectTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  symbols,
  onSelectSymbol,
  onSelectTab
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
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

  if (!isOpen) return null;

  const filteredSymbols = symbols.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.sector.toLowerCase().includes(query.toLowerCase())
  );

  const views = [
    { id: "screener", label: "Factor Screener & Data Grid", icon: SlidersHorizontal },
    { id: "charts", label: "Technical Workspace & Candlestick Charts", icon: ChartBar },
    { id: "correlation", label: "Cross-Market Correlation Matrix", icon: ShareNetwork },
    { id: "lakehouse", label: "Medallion Lakehouse & Ingestion SLA", icon: Cpu },
  ].filter((v) => v.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg w-full max-w-lg shadow-raised overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)]">
          <MagnifyingGlass size={16} weight="bold" className="text-cyan-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search equities, views, or quant factors..."
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
                      <Icon size={14} weight="bold" className="text-cyan-500" />
                      <span>{v.label}</span>
                    </div>
                    <ArrowRight size={13} weight="bold" className="text-[var(--text-muted)]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Equities section */}
          <div>
            <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase font-semibold">
              Equities & Factor Mart
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
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-cyan-500 transition">
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
          <span>Navigate with mouse or click</span>
          <span>ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
