"use client";

import React from "react";
import { X, Compass, Cpu, Wrench, Keyboard } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  desc: string;
}

interface ShortcutGroup {
  category: string;
  icon: React.ComponentType<{ size: number; weight: "bold" | "regular"; className?: string }>;
  items: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const groups: ShortcutGroup[] = [
    {
      category: "Workspaces & Navigation",
      icon: Compass,
      items: [
        { key: "1", desc: "Factor Screener & Quantitative Data Grid" },
        { key: "2", desc: "Technical Workspace & Interactive Candlesticks" },
        { key: "3", desc: "Cross-Market Correlation Matrix (30D Pearson)" },
        { key: "4", desc: "K-Means Factor Clustering Archetypes" },
        { key: "5", desc: "Sector Heatmap Multi-Factor Treemap" },
        { key: "6", desc: "Medallion Lakehouse Telemetry & Ingestion SLA" },
      ],
    },
    {
      category: "Analysis & Intelligence",
      icon: Cpu,
      items: [
        { key: "A", desc: "Toggle AI Alpha Analyst Assistant Drawer" },
        { key: "B", desc: "Toggle Daily Alpha Market Briefing Banner" },
        { key: "C", desc: "Open Cross-Asset Symbol Comparison & Factor Radar" },
        { key: "M", desc: "Toggle Macro Context & 10Y Yield / VIX Drawer" },
        { key: "W", desc: "Toggle Watchlist Filter in Factor Screener" },
      ],
    },
    {
      category: "Controls & Output",
      icon: Wrench,
      items: [
        { key: "R", desc: "Generate Institutional Research Tear-Sheet (PDF)" },
        { key: "T", desc: "Toggle Drafting Dark / Editorial Light Mode" },
        { key: "P", desc: "Pause / Resume Live Simulated Micro-Ticks" },
        { key: "⌘ K", desc: "Open Fuzzy Command Palette & Equities Search" },
        { key: "?", desc: "Open This Keyboard Shortcuts Guide" },
        { key: "ESC", desc: "Dismiss Active Modal, Palette, or Drawer" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg w-full max-w-lg shadow-raised overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
              <Keyboard size={13} weight="bold" />
            </span>
            <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">
              Terminal Keyboard Shortcuts
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)] text-[9px] font-bold">
              Bloomberg Std
            </span>
          </div>
          <button
            onClick={() => {
              playTick("click");
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
            title="Dismiss (ESC)"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Content by category */}
        <div className="p-4 max-h-[72vh] overflow-y-auto flex flex-col gap-4 text-xs divide-y divide-[var(--divider)]">
          {groups.map((group, gIdx) => {
            const Icon = group.icon;
            return (
              <div key={group.category} className={gIdx > 0 ? "pt-3" : ""}>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider mb-2">
                  <Icon size={12} weight="bold" />
                  <span>{group.category}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.items.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between hover:bg-[var(--surface-hover)] px-2 py-1 rounded transition-colors"
                    >
                      <span className="text-[var(--text-secondary)]">{s.desc}</span>
                      <kbd className="px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider-strong)] text-[var(--text-primary)] font-bold text-[11px] shadow-xs min-w-[28px] text-center">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] flex justify-between items-center">
          <span>Global hotkeys active anytime</span>
          <span>Press ESC or click outside to exit</span>
        </div>
      </div>
    </div>
  );
};
