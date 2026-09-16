# AlphaFlow Operator Manual & Architecture Guide

## 0. AWS Credit Shield & Lifecycle Toggle (Cost Protection)

To guarantee zero unexpected cloud charges, AlphaFlow includes an active **Credit Shield**:

### CLI Controls (`scripts/manage_aws.py`)

| Command | Action | Billing Impact |
| :--- | :--- | :--- |
| `python scripts/manage_aws.py status` | Inspects account & live cloud resources | **$0.00** (Read-only check) |
| `python scripts/manage_aws.py off` | Disables AWS streaming across pipeline | **$0.00 (Guaranteed zero AWS calls)** |
| `python scripts/manage_aws.py on` | Enables cloud streaming in environment | S3 & DynamoDB streaming enabled |
| `python scripts/manage_aws.py deploy` | Provisions pay-per-request resources via Terraform | Pay-per-request (Free-tier safe) |
| `python scripts/manage_aws.py teardown` | Destroys all AWS resources immediately (Kill Switch) | Purges everything, resets to **$0** |

---

## 1. Ingestion Pipeline CLI

### Command Line Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--exchange` | `all` | Target exchange universe (`all`, `S&P 500`, or `Nifty 50`) |
| `--period` | `1mo` | Historical lookback window (`1mo`, `3mo`, `6mo`, `1y`) |
| `--tickers` | `""` | Optional comma-separated list of symbols |
| `--bucket` | `alphaflow-market-data-lake` | Target AWS S3 bucket name |
| `--use-aws` | `false` | Stream to live AWS cloud (Default: False, Credit Shield active) |

### Execution Examples

```bash
# Ingest entire S&P 500 universe
python run_pipeline.py --exchange "S&P 500"

# Ingest entire Nifty 50 universe
python run_pipeline.py --exchange "Nifty 50"

# Target specific quantitative portfolio
python run_pipeline.py --exchange "all" --tickers AAPL,NVDA,RELIANCE.NS,TCS.NS
```

---

## 2. Event-Driven Serverless Sentinel Operations

The serverless factor sentinel operates as an AWS Lambda function waking post-market close to evaluate watchlists against prior-day state stored in DynamoDB.

### Local Smoke Simulation Runner

Run the offline smoke test to verify multi-factor transition logic and generate sample alert payloads without cloud credentials:

```bash
python scripts/run_serverless_smoke.py
```
*Outputs JSON artifact to `logs/serverless_sample_alert.json`.*

### Manual Lambda Smoke Invocation (AWS)

```bash
aws lambda invoke \
  --function-name alphaflow-serverless-sentinel \
  --payload '{}' \
  /tmp/alphaflow-sentinel-output.json

cat /tmp/alphaflow-sentinel-output.json
```

### Custom Watchlist Configuration via Environment

Set `ALPHAFLOW_WATCHLIST_JSON` in Lambda environment variables to customize thresholds:

```json
[
  {"symbol": "NVDA", "upper_price": 145.0, "lower_price": 115.0, "rsi_overbought": 70.0, "rsi_oversold": 30.0},
  {"symbol": "TCS.NS", "upper_price": 4500.0, "lower_price": 4100.0, "rsi_overbought": 70.0, "rsi_oversold": 30.0}
]
```

---

## 3. Quantitative Web Terminal (Next.js)

The interactive analytical interface is hosted in `web/` and deployed to Vercel at `https://alphaflow-terminal.vercel.app`.

### Local Execution

```bash
cd web
npm install
npm run dev
# Accessible at http://localhost:3000
```

### Production Deployment to Vercel

```bash
cd web
npx vercel --prod
```

---

## 4. Medallion Lakehouse Partition Layout

Partitions follow Hive naming conventions:

```text
s3://alphaflow-market-data-lake/
├── bronze/
│   └── run_id=YYYYMMDD_HHMMSS/
│       └── data.parquet
├── silver/
│   └── run_id=YYYYMMDD_HHMMSS/
│       └── data.parquet
├── gold/
│   └── Exchange=S%26P%20500/
│       └── year=2026/
│           └── month=09/
│               └── *.parquet
└── observability/
    └── run_id=YYYYMMDD_HHMMSS/
        └── telemetry.json
```

---

## 5. Terraform Cloud Infrastructure

To provision AWS resources:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Unified infrastructure provisioned:
- **Lakehouse**: S3 Medallion Bucket (`alphaflow-market-data-lake`), Glue Database (`alphaflow_analytics`), Athena Workgroup (`alphaflow-analytics-workgroup`).
- **Serverless Sentinel**: DynamoDB factor state table (`alphaflow_factor_state` with 90-day TTL & PITR), SNS topic (`alphaflow-factor-alerts`), Lambda execution role & policy, Lambda function (`alphaflow-serverless-sentinel`), and EventBridge market-close cron rule (`cron(30 21 ? * MON-FRI *)`).
