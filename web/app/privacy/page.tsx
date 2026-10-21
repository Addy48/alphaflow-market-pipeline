import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { BrandLogo } from "../../components/BrandLogo";

export const metadata: Metadata = {
  title: "Privacy Policy | AlphaFlow Quantitative Platform",
  description: "Factual privacy and data governance policy for the AlphaFlow quantitative terminal and factor mart.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
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
                AlphaFlow Governance
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
            Effective Date: March 2026
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        {/* Table of Contents Sticky Sidebar */}
        <aside className="w-full md:w-64 shrink-0 text-xs text-[var(--text-muted)] space-y-2">
          <div className="sticky top-20 p-4 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
              <ShieldCheck size={14} weight="bold" className="text-[var(--accent)]" />
              <span>Governance Index</span>
            </div>
            <nav className="space-y-1.5 text-[11px]">
              <a href="#scope" className="block hover:text-[var(--accent)] transition">1. Scope & Purpose</a>
              <a href="#local-storage" className="block hover:text-[var(--accent)] transition">2. Client Local Storage</a>
              <a href="#ai-analyst" className="block hover:text-[var(--accent)] transition">3. AI Analyst & APIs</a>
              <a href="#serverless" className="block hover:text-[var(--accent)] transition">4. Ingestion Logs</a>
              <a href="#unspecified" className="block hover:text-[var(--accent)] transition">5. Deployer Placeholders</a>
            </nav>
            <div className="pt-2 border-t border-[var(--divider)] text-[10px]">
              <span className="text-[var(--text-secondary)] font-semibold">Standard:</span> Zero-tracker, client-first architecture.
            </div>
          </div>
        </aside>

        {/* Document Body */}
        <article className="flex-1 space-y-8 text-xs leading-relaxed">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
              AlphaFlow Privacy Policy
            </h1>
            <p className="text-[var(--text-muted)] text-[11px]">
              Factual data processing and privacy commitments for the AlphaFlow quantitative platform.
            </p>
          </div>

          {/* Section 1 */}
          <section id="scope" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">01.</span> Scope & Architecture
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              AlphaFlow is an open-source quantitative market data engineering platform and factor mart spanning the US S&amp;P 500 and the Indian NSE NIFTY 50. The application is structured as a client-side analytical terminal powered by Next.js and static or serverless market partitions.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We do not operate third-party tracking pixels, marketing beacons, behavioral fingerprinting scripts, or cross-site advertising networks.
            </p>
          </section>

          {/* Section 2 */}
          <section id="local-storage" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">02.</span> Client-Side Local Storage Usage
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The application uses browser <code className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] text-[11px]">localStorage</code> strictly to persist state necessary for user experience:
            </p>
            <ul className="space-y-1.5 text-[var(--text-secondary)] list-disc list-inside">
              <li><strong className="text-[var(--text-primary)]">alphaflow_theme</strong>: Records selected interface theme (&quot;dark&quot; or &quot;light&quot;).</li>
              <li><strong className="text-[var(--text-primary)]">alphaflow_watchlist</strong>: Stores user-pinned stock symbols locally on the device.</li>
              <li><strong className="text-[var(--text-primary)]">alphaflow_sound</strong>: Stores user audio feedback preference.</li>
              <li><strong className="text-[var(--text-primary)]">alphaflow_briefing</strong>: Stores collapse/expansion preference for the daily briefing.</li>
              <li><strong className="text-[var(--text-primary)]">alphaflow_cookie_consent_v1</strong>: Records user consent settings for anonymous telemetry.</li>
            </ul>
            <p className="text-[11px] text-[var(--text-muted)]">
              This data remains on your local machine and is never transmitted to an external database.
            </p>
          </section>

          {/* Section 3 */}
          <section id="ai-analyst" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">03.</span> Optional AI Analyst Ingestion
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              When using the optional Alpha Analyst slide-over panel, your typed natural language prompt and the current anonymized market snapshot (factor metrics for active equities) are sent to the Google Gemini API (<code className="px-1 py-0.5 rounded bg-[var(--surface-subtle)] text-[10px]">gemini-2.0-flash</code>) via the deployer&apos;s server-side proxy route.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              No personal identification information, browser cookies, or IP addresses are passed inside the prompt payload. If no <code className="px-1 py-0.5 rounded bg-[var(--surface-subtle)] text-[10px]">GEMINI_API_KEY</code> is configured by the deployer, the endpoint is disabled.
            </p>
          </section>

          {/* Section 4 */}
          <section id="serverless" className="p-5 rounded border border-[var(--divider)] bg-[var(--surface)] space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--accent)]">04.</span> Ingestion Logs & Hosting Infrastructure
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The project is deployed on serverless cloud infrastructure (Vercel edge network and AWS). Infrastructure providers collect standard transient server logs (IP address, user-agent, requested URL, response latency) to maintain network availability and protect against distributed denial-of-service (DDoS) attacks.
            </p>
          </section>

          {/* Section 5 - Unspecified Facts Placeholder Gate */}
          <section id="unspecified" className="p-5 rounded border border-amber-600/30 bg-amber-950/10 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span className="text-amber-500">05.</span> Deployer Legal Entity Placeholders
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              In accordance with strict factual governance, the following legal attributes are deployment-specific and must be completed by the entity hosting this instance:
            </p>
            <div className="p-3 rounded border border-amber-800/40 bg-black/40 space-y-1.5 text-[11px]">
              <div><strong className="text-amber-400">[TODO: Legal Entity Name]</strong> — Designated corporate owner or open-source consortium.</div>
              <div><strong className="text-amber-400">[TODO: Physical Address &amp; Jurisdiction]</strong> — Registered corporate office location.</div>
              <div><strong className="text-amber-400">[TODO: Contact Email]</strong> — Designated privacy and data governance officer.</div>
              <div><strong className="text-amber-400">[TODO: Data Retention Schedule]</strong> — Production log rotation policy (typically 30–90 days).</div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
