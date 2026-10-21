"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowUp, Cookie } from "@phosphor-icons/react";
import { BrandLogo } from "./BrandLogo";
import { playTick } from "../utils/audio";

interface FooterProps {
  slaSeconds: number;
  slaStatus: string;
  onOpenReport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  slaSeconds,
  slaStatus,
  onOpenReport,
}) => {
  const handleOpenCookiePreferences = () => {
    playTick("click");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alphaflow_open_cookie_preferences"));
    }
  };

  const scrollToTop = () => {
    playTick("click");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[var(--divider)] bg-[var(--surface-subtle)] px-4 py-8 font-mono text-xs text-[var(--text-muted)] transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Brand & Platform Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BrandLogo variant="icon" size="sm" />
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                AlphaFlow Platform
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Dual-Exchange Quantitative Data Platform &amp; Observability Engine spanning S&amp;P 500 (US) and NIFTY 50 (India).
            </p>
            <div className="text-[10px] text-[var(--text-muted)]">
              Partitioned Medallion Lakehouse + Serverless Sentinel
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Workspace &amp; Marts
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/" className="hover:text-[var(--text-primary)] transition">
                  Factor Screener
                </Link>
              </li>
              <li>
                <Link href="/charts" className="hover:text-[var(--text-primary)] transition">
                  Technical Charts
                </Link>
              </li>
              <li>
                <Link href="/matrix" className="hover:text-[var(--text-primary)] transition">
                  Correlation &amp; Heatmap
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-[var(--text-primary)] transition">
                  Dual-Plane Architecture
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-[var(--text-primary)] transition">
                  14 Vectorized Factors
                </Link>
              </li>
              <li>
                <Link href="/inquiry" className="hover:text-[var(--text-primary)] transition">
                  Institutional Inquiry
                </Link>
              </li>
              {onOpenReport && (
                <li>
                  <button
                    onClick={onOpenReport}
                    className="hover:text-[var(--text-primary)] transition text-left cursor-pointer"
                  >
                    Institutional Tear-Sheet (PDF)
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Governance & Legal */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Governance &amp; Privacy
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/privacy" className="hover:text-[var(--text-primary)] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--text-primary)] transition">
                  Terms of Service &amp; MIT License
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="hover:text-[var(--text-primary)] transition flex items-center gap-1 cursor-pointer"
                >
                  <Cookie size={12} />
                  <span>Cookie &amp; Storage Preferences</span>
                </button>
              </li>
              <li>
                <Link href="/report" className="hover:text-[var(--text-primary)] transition">
                  Audited Research Docket
                </Link>
              </li>
            </ul>
          </div>

          {/* Pipeline Telemetry State */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Pipeline Health
            </div>
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Ingestion Clock:</span>
                <span className="font-bold text-[var(--text-primary)]">{slaSeconds}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span>SLA Threshold:</span>
                <span className="text-[var(--text-secondary)]">&lt;120s Target</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Athena Status:</span>
                <span className="text-[var(--risk-success)] font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} weight="bold" />
                  <span>{slaStatus === "OK" ? "Gold S3 Ready" : slaStatus}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-4 border-t border-[var(--divider)] text-[10px] text-[var(--text-muted)] leading-relaxed space-y-1">
          <p>
            <strong className="text-[var(--text-secondary)]">Regulatory Disclaimer:</strong> AlphaFlow is an open-source quantitative market data engineering platform provided strictly for research, engineering, and algorithmic educational purposes. AlphaFlow is not a registered investment advisor, broker-dealer, or commodity trading advisor under the jurisdiction of the US SEC, FINRA, or SEBI India.
          </p>
          <p>
            Technical factor outputs (RSI-14, Bollinger %B, Sharpe Proxy, Realized Volatility) are computed deterministically from publicly reported closing prints. Nothing displayed on this platform constitutes personalized financial advice, investment recommendations, or an offer to buy or sell securities.
          </p>
        </div>

        {/* Bottom Utility Bar */}
        <div className="pt-3 border-t border-[var(--divider)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-3">
            <span>© 2026 AlphaFlow Engineering</span>
            <span>•</span>
            <span>MIT Open Source</span>
            <span>•</span>
            <span>Pandera Schema Validated</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition btn-tactile cursor-pointer"
            aria-label="Scroll back to top"
          >
            <span>Top</span>
            <ArrowUp size={12} weight="bold" />
          </button>
        </div>
      </div>
    </footer>
  );
};
