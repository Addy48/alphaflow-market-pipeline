"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Robot, X, PaperPlaneTilt, Spinner, Copy, Check, Cpu } from "@phosphor-icons/react";
import { MarketTerminalPayload } from "../types/market";
import { playTick } from "../utils/audio";

interface AlphaAnalystProps {
  marketData: MarketTerminalPayload;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_QUERIES = [
  "Which stocks are overbought right now?",
  "What's the highest Sharpe ratio stock?",
  "Which NSE stocks show bullish momentum?",
  "Compare NVDA and TCS factor profiles",
  "Summarize the current market breadth",
  "Which cluster has the most defensive stocks?",
  "Show me all stocks with RSI below 35",
  "What's the current risk-off/risk-on signal?",
];

/** Institutional markdown renderer: bold, inline code, bullets, newlines */
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    const isBullet = line.startsWith("* ") || line.startsWith("- ");
    const content = isBullet ? line.slice(2) : line;

    // Parse inline code `code` and **bold**
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="text-[var(--text-primary)] font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={j} className="px-1 py-0.2 rounded bg-[var(--surface)] text-[var(--accent)] font-bold border border-[var(--divider)]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    return (
      <div key={i} className={`leading-relaxed ${isBullet ? "flex items-start gap-1.5 pl-2 my-0.5" : "my-0.5"}`}>
        {isBullet && <span className="text-[var(--accent)] font-bold">•</span>}
        <span>{parts}</span>
      </div>
    );
  });
}

export const AlphaAnalyst: React.FC<AlphaAnalystProps> = ({
  marketData,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input when opened, release focus cleanly when closed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else {
      inputRef.current?.blur();
      if (typeof document !== "undefined" && document.activeElement === inputRef.current) {
        (document.activeElement as HTMLElement)?.blur?.();
        document.body?.focus?.();
      }
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClose = useCallback(() => {
    inputRef.current?.blur();
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement)?.blur?.();
      document.body?.focus?.();
    }
    playTick("click");
    onClose();
  }, [onClose]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    playTick("click");
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userText = text.trim();
      setQuery("");
      playTick("click");

      // Append user message immediately
      setMessages((prev) => [...prev, { role: "user", text: userText }]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/alpha-analyst", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: userText,
            snapshot: {
              symbols: marketData.symbols,
              benchmarks: marketData.macro.benchmarks,
              breadth: marketData.macro.market_breadth,
              telemetry: marketData.telemetry,
            },
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.response },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "API error";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `[SYSTEM NOTICE] Error: ${msg}\n\nVerify that GEMINI_API_KEY is configured in web/.env.local`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, marketData]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const isEmpty = useMemo(() => messages.length === 0, [messages]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[48] bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={handleClose}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[49] w-96 max-w-[95vw] bg-[var(--surface)] border-l border-[var(--divider-strong)] shadow-raised flex flex-col transition-transform duration-200 ease-out font-mono text-xs ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
              <Robot size={13} weight="bold" />
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Alpha Analyst
            </span>
            <span className="px-1.5 py-0.2 text-[9px] rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)] font-bold">
              Gemini Flash
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  playTick("click");
                  setMessages([]);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--risk-critical)] px-2 py-0.5 rounded border border-transparent hover:border-[var(--divider)] hover:bg-[var(--surface-hover)] transition btn-tactile text-[10px]"
                title="Clear conversation"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--surface-hover)] transition btn-tactile cursor-pointer"
              title="Close AI Analyst (A or ESC)"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isEmpty && (
            <div className="space-y-3">
              <div className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs mb-1">
                  <Cpu size={14} weight="bold" className="text-[var(--accent)]" />
                  <span>Quantitative Market Intelligence</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  I have real-time access to live factor data for all 16 equities across US S&P 500 and NSE Nifty 50. Ask any question about alpha scores, RSI divergences, cluster archetypes, or cross-market pairs.
                </p>
              </div>

              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-2">
                  Suggested Queries
                </div>
                <div className="space-y-1.5">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSubmit(q)}
                      className="w-full text-left px-2.5 py-1.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition text-[11px] btn-tactile cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-lg p-3 text-[11px] leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--text-primary)]"
                    : "bg-[var(--surface-subtle)] border-[var(--divider)] text-[var(--text-secondary)] shadow-2xs"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[var(--divider)]">
                    <div className="flex items-center gap-1">
                      <Robot size={11} weight="bold" className="text-[var(--accent)]" />
                      <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider">
                        Alpha Analyst
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.text, i)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      title="Copy response"
                    >
                      {copiedIdx === i ? (
                        <Check size={11} weight="bold" className="text-emerald-500" />
                      ) : (
                        <Copy size={11} weight="bold" />
                      )}
                    </button>
                  </div>
                )}
                <div>{renderMarkdown(msg.text)}</div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface-subtle)] border border-[var(--divider)] rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <Spinner size={13} weight="bold" className="animate-spin text-[var(--accent)]" />
                Synthesizing multi-factor intelligence…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-[var(--divider)] bg-[var(--surface-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about factors, signals, regimes…"
              disabled={!isOpen || isLoading}
              tabIndex={isOpen ? 0 : -1}
              className="flex-1 px-3 py-2 rounded border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none text-xs font-mono placeholder:text-[var(--text-muted)] disabled:opacity-50"
            />
            <button
              onClick={() => handleSubmit(query)}
              disabled={!query.trim() || isLoading}
              className="p-2 rounded border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition btn-tactile disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Send (Enter)"
            >
              <PaperPlaneTilt size={14} weight="bold" />
            </button>
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-1.5 flex justify-between items-center">
            <span>Press Enter to send · ESC to close</span>
            <span>Gemini 2.0 Flash</span>
          </div>
        </div>
      </div>
    </>
  );
};
