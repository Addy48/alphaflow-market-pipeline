# AlphaFlow: Dual-Exchange Quantitative Data Platform & Observability Engine

[![Production Web Terminal](https://img.shields.io/badge/Production-Terminal%20Live-06b6d4?style=flat&logo=vercel&logoColor=white)](https://alphaflow-terminal.vercel.app)
[![CI & Data Quality Gates](https://github.com/Addy48/alphaflow-market-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/Addy48/alphaflow-market-pipeline/actions/workflows/ci.yml)
[![Market Ingestion Cron](https://github.com/Addy48/alphaflow-market-pipeline/actions/workflows/etl_pipeline.yml/badge.svg)](https://github.com/Addy48/alphaflow-market-pipeline/actions/workflows/etl_pipeline.yml)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js-16%20(React%2019)-black?style=flat&logo=nextdotjs&logoColor=white)
![AWS Serverless](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20SNS%20%7C%20EventBridge-FF9900?style=flat&logo=amazon-aws&logoColor=white)
![AWS Lakehouse](https://img.shields.io/badge/Lakehouse-S3%20%7C%20Athena%20%7C%20Glue-569A31?style=flat&logo=amazon-s3&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

AlphaFlow is an enterprise-grade quantitative market data engineering platform and analytical factor mart spanning the **S&P 500 (US)** and the **NIFTY 50 (India)**. The system pairs a **Medallion Lakehouse (S3 / Parquet / DuckDB / Athena)** for daily batch historical factor marts with a **Serverless Event-Driven Sentinel (AWS Lambda / DynamoDB / EventBridge / SNS)** for real-time quantitative breakout alerting.

- **Live Bloomberg-Style Terminal:** [https://alphaflow-terminal.vercel.app](https://alphaflow-terminal.vercel.app)
- **Technical Interview Defense Guide:** [`INTERVIEW_DEFENSE.md`](./INTERVIEW_DEFENSE.md)
- **Operator & CLI Manual:** [`USER_MANUAL.md`](./USER_MANUAL.md)

---

## Unified System Architecture

The platform operates across two complementary processing planes:

```mermaid
flowchart TD
    subgraph MarketSources["1. Dual-Exchange Market Ingestion"]
        NSE[NIFTY 50 Constituents]
        SP[S&P 500 Constituents]
        YF[Multi-Source Market Feeds]
    end

    subgraph BatchLakehouse["2. Batch Medallion Lakehouse Layer"]
        BronzeGate[Bronze Gate: Non-blocking Schema Check]
        S3Bronze[(S3 Bronze: Raw JSON/Parquet)]
        CleanFilter[Zero-Vol Halts & ±15% Outlier Guard]
        S3Silver[(S3 Silver: Cleansed Parquet Mart)]
        QuantEngine[Vectorized Quant Engine: RSI / Bollinger / MACD / Sharpe]
        GoldGate[Gold Gate: Strict Pandera Analytical Schema]
        S3Gold[(S3 Gold: Partitioned Factor Store)]
        Glue[AWS Glue Data Catalog]
        Athena[AWS Athena Serverless SQL]
    end

    subgraph ServerlessSentinel["3. Event-Driven Serverless Sentinel"]
        Cron[EventBridge: cron(30 21 ? * MON-FRI *)]
        Lambda[AWS Lambda: Factor Sentinel]
        DDB[(DynamoDB: 90-Day TTL State Cache)]
        CrossDetect[Anti-Chatter Transition Detector]
        SNS[AWS SNS: Multi-Channel Topic]
        AlertDest[Subscribed Analysts / Webhooks]
    end

    subgraph Delivery["4. Delivery & Interactive Visualization"]
        Web[Next.js 16 Web Terminal (alphaflow-terminal.vercel.app)]
        Audit[Pandera Telemetry & Run Logs]
    end

    NSE & SP & YF --> BronzeGate --> S3Bronze
    S3Bronze --> CleanFilter --> S3Silver
    S3Silver --> QuantEngine --> GoldGate --> S3Gold
    S3Gold --> Glue --> Athena
    S3Gold --> Web
    GoldGate --> Audit

    Cron --> Lambda
    YF -.-> Lambda
    Lambda <--> DDB
    Lambda --> CrossDetect
    CrossDetect -- Breakout Detected --> SNS --> AlertDest
```

---

## Core Capabilities

### 1. Batch Medallion Lakehouse (Historical Factor Mart)
- **Multi-Exchange Alignment**: Daily automated ingestion aligned with exchange closing bells (NSE: 12:30 UTC, US: 21:30 UTC).
- **Partitioned Parquet Mart**: Snappy-compressed columnar partitions structured as `exchange=US|NSE / year=YYYY / month=MM`.
- **Pandera Schema Contracts**: Strict mathematical boundaries verified on ingestion (positive prices, non-zero volumes, bounded indicators).
- **14 Vectorized Factors**: Wilder's RSI-14, Bollinger Bands (%B position and squeeze bandwidth), 30-day annualized realized volatility, rolling max drawdown, Sharpe ratio proxy (4.5% risk-free rate), and composite momentum scores.

### 2. Event-Driven Serverless Sentinel (Real-Time Breakout Alerts)
- **AWS Lambda & EventBridge**: Automatically wakes post-market close to evaluate watchlists against live market closing prints.
- **DynamoDB State Store with 90-Day TTL**: Stores daily factor metrics per symbol (`PK=symbol`, `SK=date`) with native time-to-live expiration to eliminate storage bloat without operational overhead.
- **Anti-Chatter Transition Logic**: Alerts fire **only on boundary crossing transitions** (`prev < threshold <= current` or `prev > threshold >= current`), preventing alert spam during sustained out-of-band runs.
- **Multi-Factor Trigger Engine**:
  - **Price Resistance & Support**: Breakthrough of key horizontal bounds.
  - **Wilder's RSI-14 Overbought/Oversold**: Transitions crossing 70 (overbought momentum exhaustion) or 30 (oversold reversal setup).
  - **Bollinger %B Envelopes**: Upper band penetrations (%B > 1.0) and lower band breakdowns (%B < 0.0).
- **Rich AWS SNS Payload**: Structured notification with human-readable summary plus embedded machine-readable JSON in message attributes.

### 3. Quantitative Terminal (Next.js 16 + React 19)
- **Interactive Candlestick Workspace**: Dual-axis crosshairs normalized to SVG coordinate space, floating price and date axis badges, and real-time MACD indicator sub-panels.
- **Cross-Market Pearson Correlation Matrix**: Full row/column crosshair guides, active cell illumination, and live pair inspection ribbon.
- **Quantitative Factor Screener**: Instant sorting across composite alpha scores, factor tooltips, and micro area sparklines.

---

## Example Alert Output

When a factor transition triggers (e.g. NVDA breaking above resistance alongside an RSI overbought transition and Bollinger %B expansion), the Sentinel publishes structured telemetry to AWS SNS:

```json
[
  {
    "event_type": "ALPHAFLOW_FACTOR_ALERT",
    "symbol": "NVDA",
    "date": "2026-09-19",
    "close": 147.80,
    "metrics": {
      "rsi_14": 73.8,
      "bollinger_pct_b": 1.08,
      "alpha_score": 89.2,
      "volume": 78000000
    },
    "triggers": [
      "[NVDA] Crossed ABOVE upper resistance 145.00 (142.30 -> 147.80) on 2026-09-19",
      "[NVDA] RSI-14 crossed into OVERBOUGHT regime (68.4 -> 73.8)",
      "[NVDA] Bollinger %B UPPER BREAKOUT (0.92 -> 1.08)"
    ],
    "target_sns_topic": "arn:aws:sns:us-east-1:123456789012:alphaflow-factor-alerts",
    "simulated_message_id": "msg-8f92a10b-4d3e-4b2a-89f1-a1b2c3d4e5f6"
  }
]
```

**Delivered SNS Email Format:**
```text
ALPHAFLOW FACTOR SENTINEL ALERT
Symbol: NVDA | Date: 2026-09-19
Close Price: 147.80
RSI-14: 73.8
Bollinger %B: 1.08
Alpha Score: 89.2

Trigger Details:
  1. [NVDA] Crossed ABOVE upper resistance 145.00 (142.30 -> 147.80) on 2026-09-19
  2. [NVDA] RSI-14 crossed into OVERBOUGHT regime (68.4 -> 73.8)
  3. [NVDA] Bollinger %B UPPER BREAKOUT (0.92 -> 1.08)

Dashboard Terminal: https://alphaflow-terminal.vercel.app
Pipeline Source: Medallion S3 Factor Mart + Pandera Validated
```

---

## Repository Structure

```text
.
├── .github/
│   └── workflows/
│       ├── etl_pipeline.yml         # Dual-cron market ingestion (12:30 & 21:30 UTC)
│       └── ci.yml                   # Automated test suite and Pandera contracts
├── src/
│   ├── config.py                    # Pipeline parameters and exchange specs
│   ├── extract.py                   # Multi-source ingestion with session pooling
│   ├── transform.py                 # Vectorized factor engine & Pandera contracts
│   ├── observability.py             # Data quality, outlier detection, and telemetry
│   ├── load.py                      # Medallion partitioning & S3/local loader
│   ├── alerts.py                    # Multi-factor transition detector & SNS publisher
│   ├── serverless_storage.py        # DynamoDB state tracking with 90-day TTL
│   └── serverless_handler.py        # AWS Lambda entry point
├── scripts/
│   └── run_serverless_smoke.py      # Standalone local smoke test runner
├── terraform/                       # Unified Infrastructure as Code
│   ├── main.tf                      # S3, Glue, Athena, DynamoDB, SNS, Lambda, EventBridge
│   └── variables.tf                 # Cloud configuration variables
├── tests/                           # Comprehensive Pytest suite (32 test cases)
│   ├── test_extract.py              # Ingestion resiliency tests
│   ├── test_transform.py            # Feature engineering tests
│   ├── test_load.py                 # Medallion loader tests
│   ├── test_pandera_schemas.py      # Strict schema contract tests
│   ├── test_observability.py        # Outlier & SLA latency tests
│   ├── test_serverless_alerts.py    # Transition & anti-chatter tests
│   ├── test_serverless_storage.py   # DynamoDB TTL & query tests
│   └── test_serverless_handler.py   # Lambda execution tests
├── web/                             # Next.js 16 Quantitative Web Terminal
│   ├── app/                         # App router, theme provider, page layouts
│   ├── components/                  # CandleChart, ScreenerTable, CorrelationMatrix, Marquee
│   └── public/data/                 # Live analytical factor store payload
├── requirements.txt                 # Python dependencies (Pandera, DuckDB, Boto3, yfinance)
├── run_pipeline.py                  # Batch ETL CLI orchestrator
└── USER_MANUAL.md                   # Operator Runbook & Architecture Specification
```

---

## Quantitative Factor Definitions

| Factor | Formula | Operational Utility |
| :--- | :--- | :--- |
| **Wilder's RSI-14** | $100 - \frac{100}{1 + \text{RS}}$ | Momentum exhaustion and mean-reversion trigger |
| **Bollinger Bands** | $\text{SMA}_{20} \pm (2 \times \sigma_{20})$ | Dynamic 2-sigma volatility boundary |
| **Bollinger %B** | $\frac{\text{Close} - \text{Lower}}{\text{Upper} - \text{Lower}}$ | Normalized bandwidth position (>1.0: upper breach, <0.0: lower breach) |
| **MACD (12, 26, 9)** | $\text{EMA}_{12} - \text{EMA}_{26}$ | Trend acceleration & signal line crossovers |
| **30D Volatility** | $\sigma_{30}(\Delta \ln P) \times \sqrt{252}$ | Realized annualized risk indicator |
| **Sharpe Proxy** | $\frac{\text{Annualized Return} - 4.5\%}{\text{Volatility}_{30D}}$ | Risk-adjusted rank scoring |
| **Alpha Momentum Score** | Weighted multi-factor normalized rank | Composite 0-100 quantitative conviction score |

---

## Quick Start

### 1. Environment Setup

```bash
git clone https://github.com/Addy48/alphaflow-market-pipeline.git
cd alphaflow-market-pipeline

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Test Suite (32 Passing Tests)

```bash
pytest tests/ -v
```

### 3. Run Serverless Sentinel Smoke Simulation Locally

Verify factor breakout detection, transition logic, and alert generation with zero AWS charges:

```bash
python scripts/run_serverless_smoke.py
```
*Outputs execution logs and generated alert payload to `logs/serverless_sample_alert.json`.*

### 4. Run Batch Lakehouse Ingestion Locally

```bash
# Ingest targeted tickers across dual exchanges
python run_pipeline.py --exchange "S&P 500" --tickers AAPL,MSFT,NVDA
python run_pipeline.py --exchange "Nifty 50" --tickers RELIANCE.NS,TCS.NS
```

### 5. Launch Next.js Web Terminal

```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

### 6. Deploy Unified Cloud Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```
*Provisions S3 Medallion Lakehouse, Glue Catalog, Athena Workgroup, DynamoDB factor state table (with 90d TTL), SNS alerts topic, Lambda Sentinel, and EventBridge post-market cron.*

---

## Verification & Quality Assurance

- **Unit Tests**: 32/32 tests passing across ingestion, schemas, transformation, DynamoDB storage, alerting, and Lambda handlers.
- **Data Contracts**: Pandera non-null, positive close, zero-volume halt isolation, and $\pm 15\%$ outlier anomaly filtering.
- **Production URL**: Verified active at [https://alphaflow-terminal.vercel.app](https://alphaflow-terminal.vercel.app) (`HTTP/2 200 OK`).

---

## License

MIT License. Authored and maintained by **Aaditya Upadhyay** ([@Addy48](https://github.com/Addy48)).
