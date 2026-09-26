/**
 * AlphaFlow Quantitative K-Means Factor Clustering Engine
 * 
 * Partitions equities across a 4-dimensional normalized factor space:
 * 1. Momentum (RSI-14)
 * 2. Risk (30D Realized Volatility)
 * 3. Mean Reversion (Bollinger %B)
 * 4. Risk-Adjusted Quality (Annualized Sharpe Proxy)
 */

import { SymbolData } from "../types/market";

export interface ClusterInfo {
  id: number;
  name: string;
  shortLabel: string;
  description: string;
  theme: {
    darkBg: string;
    darkText: string;
    darkBorder: string;
    lightBg: string;
    lightText: string;
    lightBorder: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
  centroid: {
    rsi_14: number;
    volatility_30d: number;
    bollinger_pct_b: number;
    sharpe_proxy: number;
  };
  symbols: SymbolData[];
  meanSharpe: number;
  meanVol: number;
  meanRsi: number;
}

export interface ClusteredSymbol extends SymbolData {
  clusterId: number;
  clusterName: string;
  clusterLabel: string;
  distanceToCentroid: number;
}

/**
 * Standardize features into z-scores: (x - mean) / std
 */
function standardize(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n || 1);
  const std = Math.sqrt(variance) || 1;
  return values.map((v) => (v - mean) / std);
}

/**
 * Euclidean distance in 4D standardized space
 */
function distance(a: number[], b: number[]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2) +
    Math.pow(a[3] - b[3], 2)
  );
}

/**
 * Run deterministic K-Means clustering (k=4) on equity universe
 */
export function runFactorKMeans(symbols: SymbolData[], k = 4): {
  clusteredSymbols: ClusteredSymbol[];
  clusters: ClusterInfo[];
} {
  if (!symbols || symbols.length === 0) {
    return { clusteredSymbols: [], clusters: [] };
  }

  // Extract raw feature arrays
  const rsiRaw = symbols.map((s) => s.rsi_14);
  const volRaw = symbols.map((s) => s.volatility_30d);
  const pctBRaw = symbols.map((s) => s.bollinger_pct_b);
  const sharpeRaw = symbols.map((s) => s.sharpe_proxy);

  // Standardize features
  const rsiZ = standardize(rsiRaw);
  const volZ = standardize(volRaw);
  const pctBZ = standardize(pctBRaw);
  const sharpeZ = standardize(sharpeRaw);

  const vectors: number[][] = symbols.map((_, i) => [
    rsiZ[i],
    volZ[i],
    pctBZ[i],
    sharpeZ[i],
  ]);

  // Deterministic initialization across factor percentiles (k-means++ style)
  const actualK = Math.min(k, symbols.length);
  const initialIndices: number[] = [];
  
  // Pick extreme prototypes for stability:
  // 1. Highest Sharpe
  let bestSharpeIdx = 0;
  // 2. Highest Volatility
  let highestVolIdx = 0;
  // 3. Lowest RSI (Oversold)
  let lowestRsiIdx = 0;
  // 4. Highest RSI (Momentum)
  let highestRsiIdx = 0;

  for (let i = 0; i < symbols.length; i++) {
    if (sharpeRaw[i] > sharpeRaw[bestSharpeIdx]) bestSharpeIdx = i;
    if (volRaw[i] > volRaw[highestVolIdx]) highestVolIdx = i;
    if (rsiRaw[i] < rsiRaw[lowestRsiIdx]) lowestRsiIdx = i;
    if (rsiRaw[i] > rsiRaw[highestRsiIdx]) highestRsiIdx = i;
  }

  const candidateIndices = [highestRsiIdx, bestSharpeIdx, lowestRsiIdx, highestVolIdx];
  const uniqueInit = Array.from(new Set(candidateIndices));
  while (uniqueInit.length < actualK) {
    for (let i = 0; i < symbols.length; i++) {
      if (!uniqueInit.includes(i)) {
        uniqueInit.push(i);
        if (uniqueInit.length >= actualK) break;
      }
    }
  }

  let centroids = uniqueInit.slice(0, actualK).map((idx) => [...vectors[idx]]);
  let assignments = new Array(symbols.length).fill(0);

  // Lloyd's iteration
  const MAX_ITER = 40;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < vectors.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;
      for (let c = 0; c < actualK; c++) {
        const d = distance(vectors[i], centroids[c]);
        if (d < minDist) {
          minDist = d;
          closestCluster = c;
        }
      }
      if (assignments[i] !== closestCluster) {
        assignments[i] = closestCluster;
        changed = true;
      }
    }

    if (!changed && iter > 0) break;

    // Update step
    const counts = new Array(actualK).fill(0);
    const newCentroids = Array.from({ length: actualK }, () => [0, 0, 0, 0]);

    for (let i = 0; i < vectors.length; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let dim = 0; dim < 4; dim++) {
        newCentroids[c][dim] += vectors[i][dim];
      }
    }

    for (let c = 0; c < actualK; c++) {
      if (counts[c] > 0) {
        for (let dim = 0; dim < 4; dim++) {
          centroids[c][dim] = newCentroids[c][dim] / counts[c];
        }
      }
    }
  }

  // Calculate unstandardized centroids and classify cluster profiles
  interface RawCentroid {
    clusterId: number;
    meanRsi: number;
    meanVol: number;
    meanPctB: number;
    meanSharpe: number;
    count: number;
  }

  const rawCentroids: RawCentroid[] = [];
  for (let c = 0; c < actualK; c++) {
    const clusterMembers = symbols.filter((_, i) => assignments[i] === c);
    const count = clusterMembers.length || 1;
    rawCentroids.push({
      clusterId: c,
      meanRsi: clusterMembers.reduce((a, s) => a + s.rsi_14, 0) / count,
      meanVol: clusterMembers.reduce((a, s) => a + s.volatility_30d, 0) / count,
      meanPctB: clusterMembers.reduce((a, s) => a + s.bollinger_pct_b, 0) / count,
      meanSharpe: clusterMembers.reduce((a, s) => a + s.sharpe_proxy, 0) / count,
      count: clusterMembers.length,
    });
  }

  // Institutional cluster classification matching quantitative archetypes
  // We sort by dominant profile traits
  const clusterDefinitions = [
    {
      name: "Momentum Breakout Leaders",
      shortLabel: "MOMENTUM",
      description: "Equities with accelerating trend velocity, positive Bollinger expansion, and strong relative strength.",
      theme: {
        darkBg: "rgba(100, 139, 174, 0.15)",
        darkText: "#A3C1E0",
        darkBorder: "rgba(100, 139, 174, 0.4)",
        lightBg: "rgba(42, 77, 110, 0.08)",
        lightText: "#1E3B5A",
        lightBorder: "rgba(42, 77, 110, 0.25)",
        badgeBg: "var(--surface-hover)",
        badgeText: "var(--text-primary)",
        badgeBorder: "var(--divider-strong)",
      }
    },
    {
      name: "Low-Vol Quality Compounders",
      shortLabel: "DEFENSIVE",
      description: "Conservative equities with suppressed 30-day volatility and resilient annualized Sharpe ratios.",
      theme: {
        darkBg: "rgba(34, 160, 107, 0.15)",
        darkText: "#6EE7B7",
        darkBorder: "rgba(34, 160, 107, 0.4)",
        lightBg: "rgba(21, 128, 61, 0.08)",
        lightText: "#15803D",
        lightBorder: "rgba(21, 128, 61, 0.25)",
        badgeBg: "var(--surface-hover)",
        badgeText: "var(--text-primary)",
        badgeBorder: "var(--divider-strong)",
      }
    },
    {
      name: "Mean-Reversion / Oversold Value",
      shortLabel: "VALUE REVERT",
      description: "Assets compressed against lower Bollinger bands with depressed RSI-14 exhibiting mean-reversion potential.",
      theme: {
        darkBg: "rgba(217, 130, 43, 0.15)",
        darkText: "#FCD34D",
        darkBorder: "rgba(217, 130, 43, 0.4)",
        lightBg: "rgba(180, 83, 9, 0.08)",
        lightText: "#B45309",
        lightBorder: "rgba(180, 83, 9, 0.25)",
        badgeBg: "var(--surface-hover)",
        badgeText: "var(--text-primary)",
        badgeBorder: "var(--divider-strong)",
      }
    },
    {
      name: "High-Beta Speculative Expansion",
      shortLabel: "HIGH BETA",
      description: "High-volatility equities with wide trading envelopes, sensitive to macroeconomic liquidity surges.",
      theme: {
        darkBg: "rgba(220, 56, 88, 0.15)",
        darkText: "#FDA4AF",
        darkBorder: "rgba(220, 56, 88, 0.4)",
        lightBg: "rgba(185, 28, 28, 0.08)",
        lightText: "#991B1B",
        lightBorder: "rgba(185, 28, 28, 0.25)",
        badgeBg: "var(--surface-hover)",
        badgeText: "var(--text-primary)",
        badgeBorder: "var(--divider-strong)",
      }
    }
  ];

  // Assign cluster archetypes based on centroid scores
  // Sort centroids to map sensibly:
  // - Lowest RSI -> Mean Reversion (idx 2)
  // - Highest Vol -> High Beta (idx 3)
  // - Highest Sharpe & lowest vol -> Defensive (idx 1)
  // - Remainder -> Momentum (idx 0)
  const sortedByRsi = [...rawCentroids].sort((a, b) => a.meanRsi - b.meanRsi);
  const oversoldClusterId = sortedByRsi[0]?.clusterId;

  const remaining1 = rawCentroids.filter((c) => c.clusterId !== oversoldClusterId);
  const sortedByVol = [...remaining1].sort((a, b) => b.meanVol - a.meanVol);
  const highBetaClusterId = sortedByVol[0]?.clusterId;

  const remaining2 = remaining1.filter((c) => c.clusterId !== highBetaClusterId);
  const sortedBySharpe = [...remaining2].sort((a, b) => b.meanSharpe - a.meanSharpe);
  const defensiveClusterId = sortedBySharpe[0]?.clusterId;

  const momentumClusterId = remaining2.find((c) => c.clusterId !== defensiveClusterId)?.clusterId ?? 0;

  const idToArchetypeIndex: Record<number, number> = {};
  if (oversoldClusterId !== undefined) idToArchetypeIndex[oversoldClusterId] = 2; // Value Revert
  if (highBetaClusterId !== undefined) idToArchetypeIndex[highBetaClusterId] = 3; // High Beta
  if (defensiveClusterId !== undefined) idToArchetypeIndex[defensiveClusterId] = 1; // Defensive
  if (momentumClusterId !== undefined) idToArchetypeIndex[momentumClusterId] = 0; // Momentum

  // Build finalized cluster info
  const clusters: ClusterInfo[] = rawCentroids.map((rc) => {
    const archetypeIdx = idToArchetypeIndex[rc.clusterId] ?? 0;
    const def = clusterDefinitions[archetypeIdx] || clusterDefinitions[0];
    const memberSymbols = symbols.filter((_, i) => assignments[i] === rc.clusterId);

    return {
      id: rc.clusterId,
      name: def.name,
      shortLabel: def.shortLabel,
      description: def.description,
      theme: def.theme,
      centroid: {
        rsi_14: Math.round(rc.meanRsi * 10) / 10,
        volatility_30d: Math.round(rc.meanVol * 10) / 10,
        bollinger_pct_b: Math.round(rc.meanPctB * 100) / 100,
        sharpe_proxy: Math.round(rc.meanSharpe * 100) / 100,
      },
      symbols: memberSymbols,
      meanSharpe: Math.round(rc.meanSharpe * 100) / 100,
      meanVol: Math.round(rc.meanVol * 10) / 10,
      meanRsi: Math.round(rc.meanRsi * 10) / 10,
    };
  });

  // Build clustered symbols
  const clusteredSymbols: ClusteredSymbol[] = symbols.map((s, i) => {
    const cId = assignments[i];
    const cInfo = clusters.find((c) => c.id === cId) || clusters[0];
    const dist = distance(vectors[i], centroids[cId]);

    return {
      ...s,
      clusterId: cId,
      clusterName: cInfo.name,
      clusterLabel: cInfo.shortLabel,
      distanceToCentroid: Math.round(dist * 100) / 100,
    };
  });

  return { clusteredSymbols, clusters };
}
