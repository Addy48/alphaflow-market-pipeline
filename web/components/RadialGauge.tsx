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

  const statusConfig = useMemo(() => {
    if (safeScore >= 75) {
      return {
        label: "STRONG MOMENTUM",
        color: "#10B981", // Emerald
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.35)",
      };
    }
    if (safeScore >= 55) {
      return {
        label: "MODERATE EXPANSION",
        color: "#06B6D4", // Cyan
        bg: "rgba(6, 182, 212, 0.12)",
        border: "rgba(6, 182, 212, 0.35)",
      };
    }
    if (safeScore >= 40) {
      return {
        label: "CONSOLIDATION",
        color: "#F59E0B", // Amber
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.35)",
      };
    }
    return {
      label: "DEFENSIVE SQUEEZE",
      color: "#F43F5E", // Rose
      bg: "rgba(244, 63, 94, 0.12)",
      border: "rgba(244, 63, 94, 0.35)",
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
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer tick marks */}
        <g stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round">
          <line x1="24.81" y1="77.72" x2="20.87" y2="78.42" />
          <line x1="37.11" y1="32.00" x2="34.04" y2="29.43" />
          <line x1="80.00" y1="12.00" x2="80.00" y2="8.00" />
          <line x1="122.89" y1="32.00" x2="125.96" y2="29.43" />
          <line x1="135.19" y1="77.72" x2="139.13" y2="78.42" />
        </g>

        {/* Min/Max value marks */}
        <g fill="currentColor" fillOpacity="0.4" className="text-[7px] font-bold">
          <text x="18" y="90" textAnchor="middle">0</text>
          <text x="142" y="90" textAnchor="middle">100</text>
        </g>

        {/* Inactive Track Arc */}
        <path
          d="M 28.79 77.03 A 52 52 0 1 1 131.21 77.03"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Active Progress Arc */}
        <path
          d="M 28.79 77.03 A 52 52 0 1 1 131.21 77.03"
          fill="none"
          stroke={statusConfig.color}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />

        {/* Endpoint Needle Pip */}
        {safeScore > 0 && (
          <circle
            cx={pipX}
            cy={pipY}
            r="4"
            fill="#ffffff"
            stroke={statusConfig.color}
            strokeWidth="2.5"
            filter="url(#alphaPipShadow)"
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Center Precision Telemetry */}
        <text
          x="80"
          y="56"
          textAnchor="middle"
          className="font-bold tabular-nums tracking-tight"
          fill={statusConfig.color}
          fontSize="26"
        >
          {safeScore.toFixed(1)}
        </text>

        <text
          x="80"
          y="69"
          textAnchor="middle"
          className="font-bold tracking-[0.2em] uppercase text-zinc-400"
          fill="currentColor"
          fillOpacity="0.6"
          fontSize="7.5"
        >
          {label}
        </text>

        {/* Status Pill Badge */}
        <g className="transition-all duration-300">
          <rect
            x="32"
            y="93"
            width="96"
            height="20"
            rx="10"
            fill={statusConfig.bg}
            stroke={statusConfig.border}
            strokeWidth="1"
          />
          <circle
            cx="44"
            cy="103"
            r="2.5"
            fill={statusConfig.color}
          />
          <text
            x="84"
            y="106.5"
            textAnchor="middle"
            className="font-bold tracking-wider uppercase"
            fill={statusConfig.color}
            fontSize="7.5"
          >
            {sublabel || statusConfig.label}
          </text>
        </g>
      </svg>
    </div>
  );
};
