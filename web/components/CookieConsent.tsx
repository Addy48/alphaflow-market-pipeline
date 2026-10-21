"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, X, SlidersHorizontal, Check } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "alphaflow_cookie_consent_v1";

export function getStoredCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const CookieConsent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
    () => getStoredCookieConsent()?.analytics ?? false
  );

  useEffect(() => {
    const stored = getStoredCookieConsent();
    if (!stored) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }

    const handleOpenModal = () => {
      setIsOpen(true);
      setShowPreferences(true);
    };

    window.addEventListener("alphaflow_open_cookie_preferences", handleOpenModal);
    return () => window.removeEventListener("alphaflow_open_cookie_preferences", handleOpenModal);
  }, []);

  const saveConsent = (analytics: boolean) => {
    playTick("click");
    const payload: CookiePreferences = {
      essential: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage unavailable fallback
    }
    setAnalyticsEnabled(analytics);
    setIsOpen(false);
    setShowPreferences(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("alphaflow_consent_changed", { detail: payload })
      );
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      role="region"
      aria-label="Privacy and Cookie Preferences"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-lg shadow-raised p-4 font-mono text-xs text-[var(--text-primary)]">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--surface-subtle)] border border-[var(--divider)] flex items-center justify-center text-[var(--accent)]">
              <ShieldCheck size={14} weight="bold" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Data & Storage Governance
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile"
            aria-label="Close cookie banner"
          >
            <X size={13} weight="bold" />
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-3">
          AlphaFlow uses client-side local storage exclusively for your active symbol watchlist, interface theme, and audio preferences. No third-party marketing cookies or tracker scripts are loaded.
        </p>

        {showPreferences && (
          <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <span className="font-semibold text-[var(--text-primary)]">Essential State</span>
                <span className="text-[10px] text-[var(--text-muted)] block">Terminal theme, pinned watchlist, audio mute</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--risk-success)]">ALWAYS ON</span>
            </div>

            <div className="border-t border-[var(--divider)] pt-2 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-semibold text-[var(--text-primary)]">Ingestion Observability</span>
                <span className="text-[10px] text-[var(--text-muted)] block">Anonymous factor latency benchmarking</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsEnabled((prev) => !prev)}
                className={`w-9 h-5 rounded-full transition relative ${
                  analyticsEnabled ? "bg-[var(--accent)]" : "bg-[var(--divider-strong)]"
                }`}
                role="switch"
                aria-checked={analyticsEnabled}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    analyticsEnabled ? "left-4.5" : "left-0.75"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-[var(--divider)]">
          {!showPreferences ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-2.5 py-1 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[11px] font-mono transition btn-tactile flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal size={12} />
                <span>Customize</span>
              </button>
              <button
                type="button"
                onClick={() => saveConsent(false)}
                className="px-2.5 py-1 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[11px] font-mono transition btn-tactile cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="px-3 py-1 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] text-[11px] font-bold font-mono transition btn-tactile cursor-pointer"
              >
                Accept All
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="px-2.5 py-1 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[11px] font-mono transition btn-tactile cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => saveConsent(analyticsEnabled)}
                className="px-3 py-1 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] text-[11px] font-bold font-mono transition btn-tactile flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} weight="bold" />
                <span>Save Preferences</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
