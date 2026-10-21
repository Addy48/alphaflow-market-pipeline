import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Scales } from "@phosphor-icons/react/dist/ssr";
import { BrandLogo } from "../../components/BrandLogo";

export const metadata: Metadata = {
  title: "Terms & Conditions | BellCurve Data Quantitative Platform",
  description: "Terms of service, open-source licensing, and quantitative research disclaimers for BellCurve Data.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] font-mono flex flex-col">
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
                Terms of Use
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
            Version 2.4 — MIT Open Source
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        {/* Table of Contents Sticky Sidebar */}
        <aside className="w-full md:w-64 shrink-0 text-xs text-[var(--text-muted)] space-y-2">
          <div className="sticky top-20 p-4 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
              <Scales size={14} weight="bold" className="text-[var(--accent)]" />
              <span>Legal Index</span>
            </div>
            <nav className="space-y-1.5 text-[11px]">
              <a href="#mit-license" className="block hover:text-[var(--accent)] transition">1. MIT Open Source License</a>
              <a href="#disclaimer" className="block hover:text-[var(--accent)] transition">2. Financial Non-Advisory</a>
              <a href="#data-accuracy" className="block hover:text-[var(--accent)] transition">3. Mathematical Models</a>
              <a href="#acceptable-use" className="block hover:text-[var(--accent)] transition">4. Acceptable Use &amp; API</a>
              <a href="#placeholders" className="block hover:text-[var(--accent)] transition">5. Deployer Placeholders</a>
            </nav>
            <div className="pt-2 border-t border-[var(--divider)] text-[10px]">
              <span className="text-[var(--text-secondary)] font-semibold">Jurisdiction:</span> As specified by instance host.
            </div>
          </div>
        </aside>

        {/* Document Body */}
        <article className="flex-1 space-y-8 text-xs leading-relaxed">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
              BellCurve Data Terms &amp; Conditions
            </h1>
            <p className="text-[var(--text-muted)] text-[11px]">
              Legal governance, software license boundaries, and regulatory disclaimers.
            </p>
          </div>

          {/* Section 1 */}
          <section id="mit-license" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">01.</span> MIT Open-Source Licensing
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              BellCurve Data is open-source software provided under the terms of the MIT License. The full code repository, lakehouse transform engine, and terminal frontend are made available freely for research, academic evaluation, and software development.
            </p>
            <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] font-mono text-[10px] text-[var(--text-muted)] leading-normal">
              THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.
            </div>
          </section>

          {/* Section 2 */}
          <section id="disclaimer" className="p-5 rounded border border-rose-900/30 bg-rose-950/10 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <span className="text-rose-400">02.</span> Non-Advisory &amp; Regulatory Status
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              BellCurve Data is NOT a registered investment advisor, broker-dealer, commodity trading advisor, or financial intermediary under the jurisdiction of the United States Securities and Exchange Commission (SEC), the Financial Industry Regulatory Authority (FINRA), or the Securities and Exchange Board of India (SEBI).
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Nothing displayed on this terminal—including alpha scores, momentum indicators, technical regimes, tear-sheets, or AI Analyst summaries—constitutes personalized financial advice, investment recommendations, or an offer to buy or sell securities.
            </p>
          </section>

          {/* Section 3 */}
          <section id="data-accuracy" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">03.</span> Mathematical Models &amp; Data Feeds
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Indicators generated by the platform (Wilder&apos;s RSI-14, Bollinger Band %B position, 30-day realized volatility, Sharpe ratio proxies, and Pearson correlation matrices) are mathematical derivations computed from historical closing prices.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              While the Medallion pipeline enforces Pandera data validation schemas on ingestion, no guarantee is made regarding real-time tick synchronization or exchange latency. Past performance metrics never guarantee future results.
            </p>
          </section>

          {/* Section 4 */}
          <section id="acceptable-use" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">04.</span> Acceptable Use &amp; API Quotas
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Users and automated clients agree not to subject public endpoints (<code className="px-1 py-0.5 rounded bg-[var(--surface-subtle)] text-[10px]">/api/alpha-analyst</code>, <code className="px-1 py-0.5 rounded bg-[var(--surface-subtle)] text-[10px]">/api/inquiry</code>) to excessive automated scraping, denial-of-service attempts, or bypass of rate limits.
            </p>
          </section>

          {/* Section 5 */}
          <section id="placeholders" className="p-5 rounded border border-amber-600/30 bg-amber-950/10 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span className="text-amber-500">05.</span> Deployer Legal Entity Placeholders
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The following contractual terms must be filled by the host entity deploying a commercial or private instance of BellCurve Data:
            </p>
            <div className="p-3 rounded border border-amber-800/40 bg-black/40 space-y-1.5 text-[11px]">
              <div><strong className="text-amber-400">[TODO: Operating Entity Name]</strong> — Legal entity maintaining this terminal instance.</div>
              <div><strong className="text-amber-400">[TODO: Governing Jurisdiction]</strong> — Choice of law (e.g. State of Delaware, United States or Maharashtra, India).</div>
              <div><strong className="text-amber-400">[TODO: Dispute Resolution Venue]</strong> — Binding arbitration forum or municipal court.</div>
              <div><strong className="text-amber-400">[TODO: Commercial Support Contact]</strong> — Official support channel for enterprise SLA contracts.</div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
