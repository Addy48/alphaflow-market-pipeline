"use client";

import React, { useState } from "react";
import { PaperPlaneTilt, CheckCircle, WarningCircle, Spinner, ShieldCheck } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

interface FormState {
  name: string;
  email: string;
  organization: string;
  dataset: string;
  message: string;
  website_url: string; // Honeypot spam trap
}

export const InquirySection: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    organization: "",
    dataset: "DUAL_EXCHANGE",
    message: "",
    website_url: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [docketId, setDocketId] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTick("click");

    // Client-side validation
    if (form.name.trim().length < 2) {
      setStatus("error");
      setErrorMessage("Please enter your name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setStatus("error");
      setErrorMessage("Please enter a valid organizational email address.");
      return;
    }

    if (form.message.trim().length < 10) {
      setStatus("error");
      setErrorMessage("Please provide a brief research summary (minimum 10 characters).");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setStatus("success");
      setDocketId(data.docketId || "AF-INQ-SUCCESS");
      setForm({
        name: "",
        email: "",
        organization: "",
        dataset: "DUAL_EXCHANGE",
        message: "",
        website_url: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <section
      id="inquiry"
      aria-label="Factor Mart Ingestion & Research Inquiry"
      className="border-b border-[var(--divider)] bg-[var(--surface)] px-4 py-12 md:py-16 transition-colors duration-200"
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Context & Governance */}
          <div className="md:col-span-5 space-y-4 font-mono">
            <div className="text-[11px] uppercase tracking-widest text-[var(--accent)] font-semibold">
              [ RESEARCH DATA INGESTION REQUEST ]
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Institutional Access &amp; Custom Factor Feeds
            </h2>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Submit an institutional inquiry for custom S3 Parquet partition access, historical factor backtesting extracts, or custom sentinel alert webhook integration.
            </p>

            <div className="p-3.5 rounded-lg border border-[var(--divider)] bg-[var(--surface-subtle)] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] text-[11px]">
                <ShieldCheck size={14} className="text-[var(--risk-success)]" />
                <span>Data Ingestion Guarantees</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[var(--text-muted)] list-disc list-inside">
                <li>Snappy compressed partitioned Parquet exports</li>
                <li>Pandera mathematical schema audit trail</li>
                <li>Dual exchange alignment (NYSE + NSE)</li>
                <li>Honeypot-protected and rate-limited gateway</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="md:col-span-7">
            <div className="rounded-lg border border-[var(--divider-strong)] bg-[var(--surface-subtle)] p-6 font-mono text-xs shadow-xs">
              {status === "success" ? (
                <div className="py-8 text-center space-y-3 animate-in fade-in duration-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-[var(--risk-success)] flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle size={22} weight="bold" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Inquiry Docket Created
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    Your institutional inquiry has been queued with tracking docket:
                  </p>
                  <div className="inline-block px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--divider-strong)] text-xs font-bold text-[var(--accent)]">
                    {docketId}
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="px-3 py-1.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] transition btn-tactile cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot Spam Trap (Hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website_url">Website (leave empty)</label>
                    <input
                      type="text"
                      id="website_url"
                      name="website_url"
                      value={form.website_url}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="inquiry-name" className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Full Name <span className="text-[var(--risk-critical)]">*</span>
                      </label>
                      <input
                        id="inquiry-name"
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Dr. Eleanor Vance"
                        className="w-full px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus-ring transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="inquiry-email" className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Institutional Email <span className="text-[var(--risk-critical)]">*</span>
                      </label>
                      <input
                        id="inquiry-email"
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="vance@capital.edu"
                        className="w-full px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus-ring transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="inquiry-org" className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Organization / Fund
                      </label>
                      <input
                        id="inquiry-org"
                        type="text"
                        name="organization"
                        value={form.organization}
                        onChange={handleChange}
                        placeholder="Vance Quantitative Research"
                        className="w-full px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus-ring transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="inquiry-dataset" className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Requested Dataset
                      </label>
                      <select
                        id="inquiry-dataset"
                        name="dataset"
                        value={form.dataset}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] text-xs focus-ring transition cursor-pointer"
                      >
                        <option value="DUAL_EXCHANGE">Dual-Exchange (S&amp;P 500 + Nifty 50)</option>
                        <option value="SP500">US S&amp;P 500 Factor Mart</option>
                        <option value="NIFTY50">NSE Nifty 50 Factor Mart</option>
                        <option value="LAKEHOUSE_PARQUET">Raw S3 Parquet Mirror Access</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="inquiry-message" className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      Research Summary / Use Case <span className="text-[var(--risk-critical)]">*</span>
                    </label>
                    <textarea
                      id="inquiry-message"
                      name="message"
                      required
                      rows={3}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Specify your factor universe requirements, desired backtest horizon, or webhook trigger specifications..."
                      className="w-full px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus-ring transition resize-y"
                    />
                  </div>

                  {/* Accessible Error Container */}
                  <div className="min-h-5">
                    {status === "error" && (
                      <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-[var(--risk-critical)] text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150">
                        <WarningCircle size={13} weight="bold" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Protected by serverless honeypot &amp; sliding window rate limit
                    </span>

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="px-4 py-2 rounded border border-[var(--accent-border)] bg-[var(--accent)] hover:bg-[#345c85] disabled:opacity-50 text-white font-bold transition btn-tactile flex items-center gap-2 cursor-pointer"
                    >
                      {status === "submitting" ? (
                        <>
                          <Spinner size={13} className="animate-spin" />
                          <span>Queueing...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <PaperPlaneTilt size={13} weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
