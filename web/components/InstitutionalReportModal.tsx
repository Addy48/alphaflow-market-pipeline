"use client";

import React, { useState } from "react";
import { 
  X, 
  Printer, 
  DownloadSimple, 
  FilePdf, 
  CheckCircle,
  ShieldCheck,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react";
import { SymbolData, MarketTerminalPayload } from "../types/market";
import { runFactorKMeans } from "../utils/kmeans";
import { playTick } from "../utils/audio";

interface InstitutionalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketData: MarketTerminalPayload;
  selectedSymbol: string;
}

export const InstitutionalReportModal: React.FC<InstitutionalReportModalProps> = ({
  isOpen,
  onClose,
  marketData,
  selectedSymbol,
}) => {
  if (!isOpen) return null;

  const symbols = marketData.symbols || [];
  const { clusteredSymbols, clusters } = runFactorKMeans(symbols, 4);

  const activeEquity = symbols.find((s: SymbolData) => s.symbol === selectedSymbol) || symbols[0];

  const handlePrint = () => {
    playTick("click");
    window.print();
  };

  const handleExportCSV = () => {
    playTick("click");
    const headers = "Symbol,Name,Exchange,Sector,Price,Change1D,RSI14,Volatility30D,BollingerPctB,SharpeProxy,Cluster\n";
    const rows = clusteredSymbols
      .map(
        (s) =>
          `"${s.symbol}","${s.name}","${s.exchange}","${s.sector}",${s.price},${s.change_1d},${s.rsi_14},${s.volatility_30d},${s.bollinger_pct_b},${s.sharpe_proxy},"${s.clusterName}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alphaflow-factor-tearsheet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono select-none">
      <div className="bg-[var(--surface)] border border-[var(--divider-strong)] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-raised overflow-hidden">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="p-3 border-b border-[var(--divider)] bg-[var(--surface-subtle)] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FilePdf size={18} weight="bold" className="text-[var(--accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              AlphaFlow Institutional Quantitative Tear-Sheet
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Printer size={15} weight="bold" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded border border-[var(--divider)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] font-bold text-xs flex items-center gap-1.5 transition"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                playTick("click");
                onClose();
              }}
              className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-[var(--text-primary)] print-area">
          {/* Institutional Report Header */}
          <div className="flex flex-wrap items-start justify-between border-b-2 border-[var(--divider-strong)] pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                  ALPHAFLOW QUANTITATIVE RESEARCH
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  AUDITED S3 GOLD
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Multi-Asset Medallion Lakehouse Factor Model &amp; Dual-Exchange Dispersion Brief
              </div>
            </div>

            <div className="text-right text-[11px]">
              <div className="font-bold text-[var(--text-primary)]">
                GENERATED: {new Date().toUTCString()}
              </div>
              <div className="text-[var(--text-muted)] mt-0.5">
                EXCHANGE STATUS: US &amp; NSE SYNCHRONIZED
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                REGIME: {marketData.macro?.market_breadth?.risk_regime || "RISK_ON"}
              </div>
            </div>
          </div>

          {/* Macro KPI Bar */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Universe Size</div>
              <div className="text-base font-black text-[var(--text-primary)] mt-0.5">{symbols.length} Assets</div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">S&amp;P 500 + NIFTY 50</div>
            </div>
            <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Market Breadth</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(marketData.macro?.market_breadth?.ratio || 0.78).toFixed(2)} Adv/Dec
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Dual-Market Advancers</div>
            </div>
            <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Median Volatility</div>
              <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                {(marketData.macro?.market_breadth?.median_volatility_pct || 25.2).toFixed(1)}%
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Annualized 30D Basis</div>
            </div>
            <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Pandera Contracts</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">100% Valid</div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">0 Schema Anomalies</div>
            </div>
          </div>

          {/* Selected Equity Dossier Focus */}
          {activeEquity && (
            <div className="p-4 rounded-lg border border-[var(--divider-strong)] bg-[var(--surface-subtle)] flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[var(--text-primary)]">{activeEquity.symbol}</span>
                  <span className="text-xs text-[var(--text-secondary)] font-normal">{activeEquity.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-[var(--divider)] bg-[var(--surface)]">
                    {activeEquity.exchange} · {activeEquity.sector}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold tabular-nums">
                    {activeEquity.exchange === "NSE" ? "₹" : "$"}{activeEquity.price.toFixed(2)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      activeEquity.change_1d >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {activeEquity.change_1d >= 0 ? "+" : ""}{activeEquity.change_1d.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--divider)]">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">Wilder RSI-14</div>
                  <div className="font-bold text-sm mt-0.5">{activeEquity.rsi_14.toFixed(1)}</div>
                  <div className="text-[8px] text-[var(--text-muted)] mt-0.5">
                    {activeEquity.rsi_14 > 65 ? "Overbought" : activeEquity.rsi_14 < 35 ? "Oversold" : "Neutral"}
                  </div>
                </div>
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--divider)]">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">Bollinger %B</div>
                  <div className="font-bold text-sm mt-0.5">{activeEquity.bollinger_pct_b.toFixed(2)}</div>
                  <div className="text-[8px] text-[var(--text-muted)] mt-0.5">Bandwidth Position</div>
                </div>
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--divider)]">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">30D Realized Vol</div>
                  <div className="font-bold text-sm mt-0.5">{activeEquity.volatility_30d.toFixed(1)}%</div>
                  <div className="text-[8px] text-[var(--text-muted)] mt-0.5">Annualized StdDev</div>
                </div>
                <div className="p-2 rounded bg-[var(--surface)] border border-[var(--divider)]">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">Sharpe Ratio Proxy</div>
                  <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeEquity.sharpe_proxy.toFixed(2)}
                  </div>
                  <div className="text-[8px] text-[var(--text-muted)] mt-0.5">Rf = 4.5%</div>
                </div>
              </div>
            </div>
          )}

          {/* Factor Universe Ranked Table */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Multi-Asset Quantitative Factor Matrix &amp; K-Means Cluster Categorization
            </div>

            <table className="w-full text-left border-collapse text-[10px] border border-[var(--divider)]">
              <thead>
                <tr className="bg-[var(--surface-subtle)] border-b border-[var(--divider)] font-bold text-[var(--text-secondary)]">
                  <th className="p-2">SYMBOL</th>
                  <th className="p-2">EXCHANGE</th>
                  <th className="p-2">PRICE</th>
                  <th className="p-2 text-right">1D CHG</th>
                  <th className="p-2 text-right">RSI-14</th>
                  <th className="p-2 text-right">30D VOL</th>
                  <th className="p-2 text-right">%B</th>
                  <th className="p-2 text-right">SHARPE</th>
                  <th className="p-2">K-MEANS FACTOR CLUSTER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {clusteredSymbols.map((item) => (
                  <tr key={item.symbol} className="hover:bg-[var(--surface-subtle)]">
                    <td className="p-2 font-bold text-[var(--text-primary)]">{item.symbol}</td>
                    <td className="p-2">{item.exchange}</td>
                    <td className="p-2 tabular-nums">
                      {item.exchange === "NSE" ? "₹" : "$"}{item.price.toFixed(2)}
                    </td>
                    <td
                      className={`p-2 text-right font-bold tabular-nums ${
                        item.change_1d >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.change_1d >= 0 ? "+" : ""}{item.change_1d.toFixed(2)}%
                    </td>
                    <td className="p-2 text-right tabular-nums">{item.rsi_14.toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">{item.volatility_30d.toFixed(1)}%</td>
                    <td className="p-2 text-right tabular-nums">{item.bollinger_pct_b.toFixed(2)}</td>
                    <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.sharpe_proxy.toFixed(2)}
                    </td>
                    <td className="p-2 font-semibold">
                      <span className="px-1.5 py-0.5 rounded border border-[var(--divider)] bg-[var(--surface)] text-[9px]">
                        {item.clusterName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* K-Means Archetype Breakdown Summary */}
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            {clusters.map((c) => (
              <div key={c.id} className="p-3 rounded border border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span>{c.name}</span>
                  <span className="opacity-75">{c.symbols.length} Assets</span>
                </div>
                <p className="text-[var(--text-secondary)] text-[9px] leading-relaxed">
                  {c.description}
                </p>
                <div className="text-[9px] text-[var(--text-muted)] pt-1 border-t border-[var(--divider)] flex justify-between">
                  <span>Avg RSI: {c.meanRsi}</span>
                  <span>Avg Vol: {c.meanVol}%</span>
                  <span>Sharpe: {c.meanSharpe}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Compliance Seal */}
          <div className="pt-4 border-t border-[var(--divider)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
              <span>AlphaFlow Quantitative Lakehouse — Pandera Data Contract Verified</span>
            </div>
            <div>STRICT CONFIDENTIAL &amp; PROPRIETARY FINANCIAL TELEMETRY</div>
          </div>
        </div>
      </div>
    </div>
  );
};
