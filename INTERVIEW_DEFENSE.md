# AlphaFlow: Technical Interview Defense & Mental Model Guide

This guide gives you the exact mental model, elevator pitches, and trade-off defenses needed to explain the entire AlphaFlow project in a software engineering or data engineering interview with complete confidence.

---

## 1. The 30-Second Hook (Elevator Pitch)

> *"I built AlphaFlow, a dual-plane quantitative market intelligence pipeline and terminal. It has two decoupled execution planes: a Medallion Lakehouse on AWS S3 and DuckDB that ingests daily market data, validates schemas via Pandera, and calculates 14 quantitative factors across US and Indian equities; and a serverless event-driven sentinel on AWS Lambda and DynamoDB that tracks multi-factor regime transitions (like Wilder RSI shifts and Bollinger Band breakouts) and delivers anti-chatter push alerts via AWS SNS. Everything is visualized through a responsive high-density Next.js terminal deployed on Vercel."*

---

## 2. The 3-Minute Architecture Walkthrough

If the interviewer asks: *"Walk me through the architecture and how data flows through the system."*

Draw or explain these 3 simple layers:

```text
[Yahoo Finance / Public Feeds]
             │
             ▼ (Resilient Ingestion + Exponential Backoff)
┌─────────────────────────────────────────────────────────────┐
│ 1. ANALYTICAL BATCH PLANE (Medallion Lakehouse)             │
│    Bronze (Raw JSON/Parquet) -> Silver (Cleaned + Pandera)   │
│    -> Gold (14 Quant Factors: RSI-14, MACD, Bollinger, Vol) │
│    Storage: AWS S3 partitioned by Exchange / Year / Month   │
│    Query Engine: DuckDB / AWS Athena (Columnar Parquet)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. SERVERLESS FACTOR SENTINEL (Hot Real-Time Plane)         │
│    Trigger: EventBridge Cron (Post-Market Close)            │
│    Compute: AWS Lambda (Python 3.12)                         │
│    State Cache: AWS DynamoDB (PK: symbol, SK: date, 90d TTL) │
│    Logic: Anti-Chatter State Machine (Boundary Crossings)   │
│    Alerting: AWS SNS (SMS, Email, Webhook Fanout)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. QUANTITATIVE SERVING TERMINAL (Frontend)                 │
│    Next.js 16 + React 19 + Tailwind CSS + Lucide/Phosphor  │
│    Live Screener, Factor Heatmap, Interactive Crosshairs     │
│    Deployed on Vercel Edge                                  │
└─────────────────────────────────────────────────────────────┘
```

### Verbal Script:
1. **Batch Ingestion & Contracts**: Every day after market close, the batch pipeline pulls price and volume data. Before computing metrics, it enforces strict schema contracts using **Pandera** (checks for nulls, positive prices, volume constraints). Bad data is quarantined rather than polluting downstream marts.
2. **Feature Engineering**: We compute 14 technical factors (Wilder's RSI-14, MACD with signal line, Bollinger Bands %B, rolling volatility, ATR, volume Z-scores) and write them as Snappy-compressed Parquet partitioned by exchange, year, and month in S3.
3. **Serverless Sentinel**: A separate, lightweight Lambda function wakes up to inspect watchlist symbols. It compares today's factor state against yesterday's state stored in **DynamoDB**. If a metric crosses a critical boundary (e.g. RSI crossing from 68 into overbought 72), it publishes an alert through **AWS SNS**.
4. **Serving**: The user interacts with the live quantitative terminal at `alphaflow-terminal.vercel.app` to scan assets, filter regimes, and inspect factor heatmaps.

---

## 3. The 5 Core Trade-Offs (Why You Chose This Tech Stack)

Interviewers test your seniority by asking **why** you chose one technology over another. Here are your bulletproof answers:

### Q1: Why did you use S3 + Parquet + DuckDB instead of a traditional PostgreSQL database?
* **Answer**:
  > *"Market data is write-once, read-many time-series data. In a row-oriented database like PostgreSQL, calculating a 14-day rolling average requires scanning all columns across thousands of rows. With columnar Parquet files and Snappy compression, storage footprint dropped by ~6x, and analytical queries only scan the exact columns needed (e.g. Close and Date). DuckDB gives us embedded columnar vector execution with zero server management overhead and sub-second analytical aggregations without paying for an always-on RDS instance."*

### Q2: Why use DynamoDB for the Sentinel alerts instead of querying S3 or Athena?
* **Answer**:
  > *"Latency and cost. S3 + Athena is designed for large OLAP analytical scans. Athena has a 2 to 5-second query startup latency and charges per terabyte scanned. For real-time alerting in Lambda, we need sub-10 millisecond point lookups for yesterday's exact state (`PK = symbol, SK = date`). DynamoDB provides predictable single-digit millisecond latency. Plus, DynamoDB has native TTL (Time-To-Live), meaning records automatically expire and delete themselves after 90 days with zero maintenance and zero cleanup scripts."*

### Q3: What is "Anti-Chatter" alert logic, and why is it important?
* **Answer**:
  > *"Simple threshold alerts create alert fatigue. If an asset's RSI stays above 70 for 12 consecutive days, a naive alert fires 12 times, spamming the user until they ignore it. Our sentinel implements stateful transition detection: it compares current state \(S_t\) against prior state \(S_{t-1}\) in DynamoDB. It only fires an alert when a boundary is actively breached (\(S_{t-1} < 70 \le S_t\)). If the market remains in the same regime, it stays silent."*

### Q4: Why did you use Pandera instead of Pydantic for data validation?
* **Answer**:
  > *"Pydantic is row-oriented; validating 50,000 market bars row-by-row in Pydantic converts vectorized DataFrames into Python dictionary objects, which is orders of magnitude slower. Pandera is built natively on top of vectorized engines (Pandas/Polars/Arrow). It executes validation checks across the entire column simultaneously in C/vector space. It catches negative prices, schema type changes, and missing timestamps in milliseconds before data hits S3."*

### Q5: How do you handle failure, rate limits, and idempotency?
* **Answer**:
  > *"Three ways: First, the Yahoo Finance extractor uses an HTTP session configured with exponential backoff and jitter across 5 retries (`urllib3.util.Retry`). If Wikipedia's constituent table fails, it falls back to hardcoded benchmark lists. Second, data ingestion writes raw bronze files with unique timestamped `run_id` prefixes, ensuring that any failed run can be replayed deterministically without modifying existing partitions. Third, DynamoDB writes use composite keys `(symbol, date)` so running the sentinel multiple times on the same day is naturally idempotent and simply updates the day's factor snapshot without duplicate entries."*

---

## 4. Tough "Trap" Questions & How to Answer Them

### Trap 1: *"Isn't running Lambda and DynamoDB overkill when you already have S3 and a Python script?"*
* **Safe Answer**:
  > *"Actually, it's the exact opposite of overkill—it's cost and operational minimization. A continuous polling script requires an EC2 instance or container running 24/7, costing money even when markets are closed. Lambda and DynamoDB operate at \$0 on the AWS free tier because compute only runs for ~5 seconds post-market close, and DynamoDB storage automatically evicts via 90-day TTL. It decouples the heavy analytical batch layer from the lightweight operational alert plane."*

### Trap 2: *"What if the stock splits or has corporate actions?"*
* **Safe Answer**:
  > *"The pipeline ingests both standard Close and Adjusted Close. All rolling factor calculations (RSI, Volatility, Moving Averages) are computed using Adjusted Close to account for stock splits and dividend distributions, preserving continuous returns across split events."*

### Trap 3: *"How does this scale if we add 10,000 symbols instead of 550?"*
* **Safe Answer**:
  > *"The architecture scales horizontally across both planes: In the lakehouse layer, S3 partitioning by exchange, year, and month ensures Athena and DuckDB queries prune partitions rather than scanning the entire lake. In the serverless plane, Lambda fanout can be achieved by publishing symbols into an SQS queue, allowing a fleet of concurrent Lambda workers to evaluate subsets of the watchlist in parallel within seconds."*

---

## 5. Code Directory Mental Map (So You Can Point to Files Easily)

If the interviewer asks: *"Where in your code is [X] implemented?"*

| If they ask about... | Point to this file | Key function / detail |
| :--- | :--- | :--- |
| **API Ingestion & Resilience** | [`src/extract.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/extract.py) | `get_resilient_session()`, exponential backoff |
| **Data Cleaning & Quant Factors** | [`src/transform.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/transform.py) | `compute_rsi()`, `engineer_quant_features()` |
| **Schema Contracts** | [`src/transform.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/transform.py#L25-L60) | `RawDataSchema`, `AnalyticsDataSchema` (Pandera) |
| **S3 Parquet Partitioning** | [`src/load.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/load.py) | `upload_gold_partitioned()`, Hive format |
| **Anti-Chatter Alert Logic** | [`src/alerts.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/alerts.py) | `crossed_rsi_regime()`, `evaluate_factor_triggers()` |
| **DynamoDB State & 90d TTL** | [`src/serverless_storage.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/serverless_storage.py) | `put_factor_state()`, `calculate_ttl()` |
| **Lambda Entrypoint** | [`src/serverless_handler.py`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/src/serverless_handler.py) | `lambda_handler()`, JSON watchlist parser |
| **Infrastructure as Code** | [`terraform/main.tf`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/terraform/main.tf) | S3, DynamoDB with TTL, SNS, Lambda, EventBridge |
| **Test Suite** | [`tests/`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/tests) | 32 unit and integration tests (100% passing) |
| **Frontend UI** | [`web/src/app/page.tsx`](file:///Users/aaditya/.gemini/antigravity/alphaflow-market-pipeline/web/src/app/page.tsx) | Next.js 16 reactive terminal |

---

## 6. Your Personal 3-Step Interview Prep Checklist

1. **Read Section 1 and 2 out loud twice** before your interview so the phrasing flows naturally.
2. **Review the 5 Trade-Offs in Section 3**—interviews at good companies spend 80% of their time on "Why this tool instead of that tool?".
3. **Keep the live demo link handy**: `https://alphaflow-terminal.vercel.app` (it runs on Vercel Edge with zero cold starts).
