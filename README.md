# BellCurve Data

A market-close data pipeline lab: ingest, validate, transform, alert and observe daily data for two exchange calendars (US and NSE), on a medallion lake (bronze / silver / gold Parquet) with Terraform-managed AWS resources and CI quality gates.

> **Data honesty.** The public demo runs on a **seeded market simulator** (`src/simulator.py`). Every record and every screen says where its data came from (`data_source`: `simulated`, `pipeline`, `mixed`). Real vendor data can be loaded locally (`--mode=pipeline`), but it is never published, because exchange and vendor terms restrict redistribution. Nothing here is investment advice.

Status: work in progress, formerly named AlphaFlow. See [`EVIDENCE.md`](./EVIDENCE.md) for what is verified and how to reproduce it.

## What exists today
- `src/extract.py`, `transform.py`, `load.py`: ingestion, Pandera schema contracts, medallion loaders.
- `src/observability.py`: SLA, volume-anomaly and outlier checks.
- `src/serverless_handler.py`, `alerts.py`: Lambda alerting with transition-based de-duplication (alerts fire on threshold crossings only).
- `src/simulator.py`: deterministic simulator (same seed gives the same data in every run and process).
- `scripts/export_terminal_data.py`: builds the web payload; every telemetry number is counted or measured, none hard-coded.
- `terraform/`: S3 lake, Glue catalog, Athena workgroup.
- `web/`: Next.js console with screener, charts, correlation matrix and a data-source banner.
- CI in `.github/workflows/`.

## Run it
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt pytest
pytest tests -q                       # 45 tests
python scripts/export_terminal_data.py  # simulated payload for the web app
cd web && npm install && npm run dev    # http://localhost:3000
```
Local real-data run (not published): `python run_pipeline.py --exchange "S&P 500" --tickers AAPL,MSFT` then `python scripts/export_terminal_data.py --mode=pipeline`.

## Roadmap
1. Fault injection with ground truth, and a measured detection benchmark for the data-quality checks.
2. A reliability "control room" UI: freshness SLOs per market close, quarantine view, replay and backfill.
3. Cloud deployment through GitHub Actions OIDC, with a budget kill-switch.
4. GitOps deployment on Kubernetes (separate project: Reliability Lab).

License: MIT.
