"use client";

import React from "react";
import { Keyboard, X } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "1", desc: "Switch to Factor Screener & Data Grid" },
    { key: "2", desc: "Switch to Technical Candlestick Workspace" },
    { key: "3", desc: "Switch to Cross-Market Correlation Matrix" },
    { key: "4", desc: "Switch to Lakehouse Ingestion SLA" },
    { key: "T", desc: "Toggle Dark Graphite / Editorial Light Theme" },
    { key: "P", desc: "Toggle Live Market Ticking Cadence" },
    { key: "⌘ K", desc: "Open Command Palette Search" },
    { key: "?", desc: "Display Keyboard Shortcuts Guide" },
    { key: "ESC", desc: "Dismiss Active Modal or Inspection Drawer" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg w-full max-w-md shadow-raised overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={16} weight="bold" className="text-cyan-500" />
            <span className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">
              Terminal Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={() => {
              playTick("click");
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2.5 divide-y divide-[var(--divider)] text-xs">
          {shortcuts.map((s, idx) => (
            <div key={s.key} className={`flex items-center justify-between ${idx > 0 ? "pt-2.5" : ""}`}>
              <span className="text-[var(--text-secondary)]">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[var(--text-primary)] font-bold text-[11px] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-2.5 border-t border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] flex justify-between">
          <span>Press any hotkey at any time</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
