"use client";

import React from "react";
import { Flask } from "@phosphor-icons/react";
import { useMarketData } from "../context/MarketDataContext";

/** Always tells the visitor where the numbers on screen come from. */
export const DataSourceBanner: React.FC = () => {
  const { data } = useMarketData();
  const source = data?.metadata?.data_source ?? "simulated";
  if (source === "pipeline") return null;

  const label =
    source === "mixed"
      ? "MIXED DATA: some symbols come from the local pipeline, the rest are simulated."
      : "SIMULATED DATA: seeded market simulator, not real prices. Pipeline, checks and alerts are real code.";

  return (
    <div
      role="status"
      className="w-full bg-[var(--accent-dim)] border-b border-[var(--accent-border)] text-[var(--accent)] text-[10px] px-3 py-1 flex items-center justify-center gap-1.5 font-bold tracking-wide"
    >
      <Flask size={12} weight="bold" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};
