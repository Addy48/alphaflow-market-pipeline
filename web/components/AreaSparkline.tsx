"use client";

import React, { useId } from "react";

interface AreaSparklineProps {
  points: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const AreaSparkline: React.FC<AreaSparklineProps> = ({
  points,
  isPositive,
  width = 84,
  height = 24,
  className = ""
}) => {
  const gradientId = useId();

  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 3;
  const availableHeight = height - paddingY * 2;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * availableHeight - paddingY;
    return { x, y };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const lastPt = coords[coords.length - 1];
  const strokeColor = isPositive ? "#10B981" : "#F43F5E";

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible select-none inline-block ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Shaded Area Under Curve */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Precision Hairline Stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pulsing Endpoint Indicator */}
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="2"
        fill={strokeColor}
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="4"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        strokeOpacity="0.5"
        className="animate-ping"
      />
    </svg>
  );
};
