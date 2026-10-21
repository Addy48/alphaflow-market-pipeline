import React from "react";
import Link from "next/link";
import { WarningCircle, ArrowLeft, FileText } from "@phosphor-icons/react/dist/ssr";
import { BrandLogo } from "../components/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] font-mono flex flex-col selection:bg-[var(--accent-dim)]">
      {/* Top Header */}
      <header className="border-b border-[var(--divider)] bg-[var(--surface)] px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5 text-xs font-bold btn-tactile"
            >
              <ArrowLeft size={13} weight="bold" />
              <span>Back to Terminal</span>
            </Link>
            <div className="h-4 w-px bg-[var(--divider)]" />
            <div className="flex items-center gap-2">
              <BrandLogo size="sm" priority />
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                BellCurve Data Routing
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            HTTP 404 // Partition Null
          </span>
        </div>
      </header>

      {/* Main 404 Body */}
      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded border border-[var(--divider-strong)] bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-sm">
          <WarningCircle size={24} weight="bold" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-3">
          Error 404 // Unmapped Route Target
        </div>

        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          Target Route Not Found In Mart Partitions
        </h1>

        <p className="text-xs text-[var(--text-muted)] max-w-lg mb-8 leading-relaxed">
          The requested URL path does not correspond to an active terminal view, factor partition, or institutional report dossier. Verify the address or return to the main quantitative terminal.
        </p>

        {/* Action Grid */}
        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/"
            className="p-3 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] transition btn-tactile group block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase">Live Terminal</span>
              <ArrowLeft size={13} weight="bold" className="rotate-180 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="text-[11px] opacity-80 leading-normal">
              Return to real-time factor screener and technical candlestick charts.
            </p>
          </Link>

          <Link
            href="/report"
            className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition btn-tactile group block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase">Institutional Dossier</span>
              <FileText size={13} weight="bold" className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-normal">
              Inspect printable research tearsheets and factor clusters.
            </p>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--divider)] w-full max-w-md text-[10px] text-[var(--text-muted)] flex items-center justify-between">
          <span>Dual-Exchange Pipeline active</span>
          <span>Pandera verified</span>
        </div>
      </main>
    </div>
  );
}
