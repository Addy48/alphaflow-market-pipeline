"use client";

import React, { useMemo } from "react";

interface RadialGaugeProps {
  score: number;
  label?: string;
  sublabel?: string;
  size?: number;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  score,
  label = "ALPHA SCORE",
  sublabel,
  size = 170
}) => {
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0));

  // 200° sweep from 170° to 370° (10°)
  // cx = 80, cy = 68, r = 52
  // Arc length = (2 * PI * 52 * 200) / 360 = 181.51
  const arcLength = 181.51;
  const strokeDashoffset = arcLength - (safeScore / 100) * arcLength;

  // Pip position
  const pipAngleDeg = 170 + (safeScore / 100) * 200;
  const pipRad = (pipAngleDeg * Math.PI) / 180;
  const pipX = (80 + 52 * Math.cos(pipRad)).toFixed(2);
  const pipY = (68 + 52 * Math.sin(pipRad)).toFixed(2);

  // Institutional non-neon financial status mapping
  const statusConfig = useMemo(() => {
    if (safeScore >= 75) {
      return {
        label: "STRONG MOMENTUM",
        color: "#15803D", // Forest Emerald (institutional)
        darkColor: "#22A06B",
        bg: "rgba(34, 160, 107, 0.12)",
        border: "rgba(34, 160, 107, 0.35)",
      };
    }
    if (safeScore >= 55) {
      return {
        label: "MODERATE EXPANSION",
        color: "#254B72", // Marine Steel
        darkColor: "#5B8AB5",
        bg: "rgba(91, 138, 181, 0.12)",
        border: "rgba(91, 138, 181, 0.35)",
      };
    }
    if (safeScore >= 40) {
      return {
        label: "CONSOLIDATION",
        color: "#B45309", // Warm Amber
        darkColor: "#D9822B",
        bg: "rgba(217, 130, 43, 0.12)",
        border: "rgba(217, 130, 43, 0.35)",
      };
    }
    return {
      label: "DEFENSIVE / OVERSOLD",
      color: "#B91C1C", // Deep Crimson
      darkColor: "#DC3858",
      bg: "rgba(220, 56, 88, 0.12)",
      border: "rgba(220, 56, 88, 0.35)",
    };
  }, [safeScore]);

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none font-mono"
      style={{ width: size, maxWidth: "100%" }}
      role="meter"
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        viewBox="0 0 160 126"
        className="w-full h-auto overflow-visible select-none block"
      >
        <defs>
          <filter id="alphaPipShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer tick marks */}
        <g stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeLinecap="round">
          <line x1="24.81" y1="77.72" x2="20.87" y2="78.42" />
          <line x1="37.11" y1="32.00" x2="34.04" y2="29.43" />
          <line x1="80.00" y1="12.00" x2="80.00" y2="8.00" />
          <line x1="122.89" y1="32.00" x2="125.96" y2="29.43" />
          <line x1="135.19" y1="77.72" x2="139.13" y2="78.42" />
        </g>

        {/* Min/Max value marks */}
        <g fill="currentColor" fillOpacity="0.35" className="text-[7px] font-bold">
          <text x="18" y="90" textAnchor="middle">0</text>
          <text x="142" y="90" textAnchor="middle">100</text>
        </g>

        {/* Inactive Track Arc */}
        <path
          d="M 28.84 77.03 A 52 52 0 1 1 131.16 77.03"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Active Animated Gradient Fill Arc */}
        <path
          d="M 28.84 77.03 A 52 52 0 1 1 131.16 77.03"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out text-[var(--accent)]"
        />

        {/* Precision Tracking Pip */}
        {safeScore > 0 && (
          <circle
            cx={pipX}
            cy={pipY}
            r="4.5"
            fill="currentColor"
            stroke="var(--surface)"
            strokeWidth="1.5"
            filter="url(#alphaPipShadow)"
            className="transition-all duration-700 ease-out text-[var(--text-primary)]"
          />
        )}

        {/* Center Precision Telemetry */}
        <text
          x="80"
          y="56"
          textAnchor="middle"
          className="font-bold tabular-nums tracking-tight"
          fill="currentColor"
          fontSize="26"
        >
          {safeScore.toFixed(1)}
        </text>

        <text
          x="80"
          y="69"
          textAnchor="middle"
          className="font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]"
          fill="currentColor"
          fontSize="7.5"
        >
          {label}
        </text>

        {/* Status Pill Badge */}
        <g className="transition-all duration-300">
          <rect
            x="24"
            y="93"
            width="112"
            height="20"
            rx="10"
            fill={statusConfig.bg}
            stroke={statusConfig.border}
            strokeWidth="1"
          />
          <circle
            cx="34"
            cy="103"
            r="2.5"
            fill="currentColor"
            className="text-[var(--text-primary)]"
          />
          <text
            x="76"
            y="106.5"
            textAnchor="middle"
            className="font-bold tracking-wider uppercase text-[var(--text-primary)]"
            fill="currentColor"
            fontSize="7"
          >
            {sublabel || statusConfig.label}
          </text>
        </g>
      </svg>
    </div>
  );
};
