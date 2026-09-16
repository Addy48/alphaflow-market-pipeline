export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number | null;
  bb_upper?: number | null;
  bb_lower?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
}

export interface SymbolData {
  symbol: string;
  name: string;
  exchange: "US" | "NSE";
  sector: string;
  price: number;
  change_1d: number;
  change_amount: number;
  volume: number;
  avg_volume_20d: number;
  rsi_14: number;
  bollinger_pct_b: number;
  bollinger_upper: number;
  bollinger_lower: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  volatility_30d: number;
  sharpe_proxy: number;
  regime: string;
  sparkline: number[];
  candles: CandleData[];
}

export interface CorrelationRow {
  symbol: string;
  correlations: Record<string, number>;
}

export interface BenchmarkItem {
  name: string;
  ticker: string;
  value: string;
  change: string;
  status: "bullish" | "bearish" | "neutral";
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  ratio: number;
  median_volatility_pct: number;
  risk_regime: string;
  active_instruments: number;
}

export interface StorageBreakdown {
  bronze_mb: number;
  silver_mb: number;
  gold_parquet_mb: number;
  compression_ratio: string;
}

export interface QualityGates {
  zero_volume_halts_detected: number;
  price_outlier_spikes_flagged: number;
  schema_contract_violations: number;
  pandera_validation_status: string;
}

export interface RunHistoryItem {
  run_id: string;
  market: string;
  records: number;
  latency_s: number;
  anomalies: number;
  status: string;
}

export interface TelemetryData {
  pipeline_health: string;
  last_run_timestamp: string;
  ingestion_sla_seconds: number;
  sla_target_seconds: number;
  sla_status: string;
  total_records_processed: number;
  bronze_records: number;
  silver_records: number;
  gold_records: number;
  storage_breakdown: StorageBreakdown;
  quality_gates: QualityGates;
  recent_runs: RunHistoryItem[];
}

export interface MarketTerminalPayload {
  metadata: {
    version: string;
    generated_at: string;
    environment: string;
    engine: string;
  };
  macro: {
    benchmarks: BenchmarkItem[];
    market_breadth: MarketBreadth;
  };
  symbols: SymbolData[];
  correlation_matrix: CorrelationRow[];
  telemetry: TelemetryData;
}
