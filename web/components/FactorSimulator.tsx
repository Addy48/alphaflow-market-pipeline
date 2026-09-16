"use client";

import React from "react";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { playTick } from "../utils/audio";

export interface FactorWeights {
  momentum: number;
  volatility: number;
  sharpe: number;
  meanReversion: number;
}

interface FactorSimulatorProps {
  weights: FactorWeights;
  setWeights: React.Dispatch<React.SetStateAction<FactorWeights>>;
}

export const FactorSimulator: React.FC<FactorSimulatorProps> = ({
  weights,
  setWeights
}) => {
  const applyPreset = (preset: "BALANCED" | "MOMENTUM" | "DEFENSIVE" | "REVERSION") => {
    playTick("toggle");
    if (preset === "BALANCED") {
      setWeights({ momentum: 35, volatility: 25, sharpe: 25, meanReversion: 15 });
    } else if (preset === "MOMENTUM") {
      setWeights({ momentum: 60, volatility: 10, sharpe: 20, meanReversion: 10 });
    } else if (preset === "DEFENSIVE") {
      setWeights({ momentum: 15, volatility: 50, sharpe: 30, meanReversion: 5 });
    } else if (preset === "REVERSION") {
      setWeights({ momentum: 10, volatility: 20, sharpe: 20, meanReversion: 50 });
    }
  };

  const handleSliderChange = (key: keyof FactorWeights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="p-3 border-t border-[var(--divider)] bg-[var(--surface-subtle)] flex flex-col gap-3 font-mono text-xs transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} weight="bold" className="text-cyan-500" />
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs">
            Dynamic Strategy Factor Weighting Engine
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--divider)] text-[var(--text-muted)] text-[10px]">
            REAL-TIME RE-RANKING
          </span>
        </div>

        {/* Preset Strategies */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] uppercase mr-1">Presets:</span>
          <button
            onClick={() => applyPreset("BALANCED")}
            className="px-2 py-0.5 rounded text-[10px] border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-cyan-500/40 transition btn-tactile cursor-pointer"
          >
            Balanced Alpha
          </button>
          <button
            onClick={() => applyPreset("MOMENTUM")}
            className="px-2 py-0.5 rounded text-[10px] border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-cyan-500/40 transition btn-tactile cursor-pointer"
          >
            Trend Expansion
          </button>
          <button
            onClick={() => applyPreset("DEFENSIVE")}
            className="px-2 py-0.5 rounded text-[10px] border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-cyan-500/40 transition btn-tactile cursor-pointer"
          >
            Defensive Vol
          </button>
          <button
            onClick={() => applyPreset("REVERSION")}
            className="px-2 py-0.5 rounded text-[10px] border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-cyan-500/40 transition btn-tactile cursor-pointer"
          >
            Mean Reversion
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Momentum Slider */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1.5 shadow-xs">
          <div className="flex justify-between text-[var(--text-secondary)] text-[11px]">
            <span>Momentum (RSI & MACD)</span>
            <span className="text-cyan-500 font-bold tabular-nums">{weights.momentum}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.momentum}
            onChange={(e) => handleSliderChange("momentum", Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-[var(--surface-subtle)] rounded-lg cursor-pointer"
          />
        </div>

        {/* Volatility Penalty Slider */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1.5 shadow-xs">
          <div className="flex justify-between text-[var(--text-secondary)] text-[11px]">
            <span>Low-Vol Priority</span>
            <span className="text-purple-500 font-bold tabular-nums">{weights.volatility}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.volatility}
            onChange={(e) => handleSliderChange("volatility", Number(e.target.value))}
            className="w-full accent-purple-500 h-1.5 bg-[var(--surface-subtle)] rounded-lg cursor-pointer"
          />
        </div>

        {/* Sharpe Ratio Priority */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1.5 shadow-xs">
          <div className="flex justify-between text-[var(--text-secondary)] text-[11px]">
            <span>Sharpe Ratio Weight</span>
            <span className="text-emerald-500 font-bold tabular-nums">{weights.sharpe}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.sharpe}
            onChange={(e) => handleSliderChange("sharpe", Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-[var(--surface-subtle)] rounded-lg cursor-pointer"
          />
        </div>

        {/* Mean Reversion Squeeze */}
        <div className="p-2.5 rounded border border-[var(--divider)] bg-[var(--surface)] flex flex-col gap-1.5 shadow-xs">
          <div className="flex justify-between text-[var(--text-secondary)] text-[11px]">
            <span>Reversion Dip (%B Squeeze)</span>
            <span className="text-amber-500 font-bold tabular-nums">{weights.meanReversion}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.meanReversion}
            onChange={(e) => handleSliderChange("meanReversion", Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-[var(--surface-subtle)] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
