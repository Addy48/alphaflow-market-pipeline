import argparse
import sys
from datetime import datetime, timezone
import pandas as pd

from src.config import setup_logging, S3_BUCKET_NAME, EXCHANGE_CONFIGS
from src.extract import get_constituents, fetch_ohlcv
from src.transform import (
    flatten_and_merge,
    validate_raw,
    clean_data,
    engineer_quant_features,
    validate_analytics,
)
from src.observability import (
    check_sla_compliance,
    detect_volume_anomalies,
    detect_price_outliers,
    generate_run_telemetry,
    dispatch_alert,
)
from src.load import (
    upload_bronze,
    upload_silver,
    upload_gold,
    upload_telemetry,
)

logger = setup_logging()


def run_single_exchange(
    exchange: str,
    run_id: str,
    period: str = "1mo",
    limit_tickers: list = None,
    s3_bucket: str = S3_BUCKET_NAME
) -> bool:
    """Executes the complete end-to-end Medallion pipeline for a specific market exchange."""
    logger.info(f"============================================================")
    logger.info(f" Starting AlphaFlow Pipeline Run [{run_id}] for {exchange}")
    logger.info(f"============================================================")

    # 1. Observability: Market Close SLA Check
    sla_result = check_sla_compliance(exchange)
    logger.info(f"SLA Compliance for {exchange}: Passed={sla_result['sla_passed']} (Delta: {sla_result['delta_hours_from_close']} hrs)")

    # 2. Extract Constituents
    constituents_df = get_constituents(exchange)
    if constituents_df.empty:
        logger.error(f"Zero constituents extracted for {exchange}. Aborting run.")
        return False

    tickers = constituents_df["Symbol"].tolist()
    if limit_tickers:
        tickers = [t for t in tickers if t in limit_tickers or any(t.startswith(lt) for lt in limit_tickers)]
        logger.info(f"Filtered execution scope to {len(tickers)} targeted tickers.")

    # 3. Extract OHLCV Market Data
    raw_ohlcv = fetch_ohlcv(tickers, period=period)
    if raw_ohlcv.empty:
        logger.warning(f"No OHLCV bars returned for {exchange}. Aborting.")
        return False

    # 4. Flatten & Merge Metadata
    raw_merged = flatten_and_merge(raw_ohlcv, constituents_df)

    # 5. Bronze Tier Validation & Persist
    valid_raw, dropped_symbols = validate_raw(raw_merged)
    upload_bronze(valid_raw, bucket_name=s3_bucket, run_id=run_id)

    # 6. Silver Tier Cleaning & Persist
    cleaned_df = clean_data(valid_raw)
    upload_silver(cleaned_df, bucket_name=s3_bucket, run_id=run_id)

    # 7. Gold Tier Quantitative Feature Engineering
    gold_df = engineer_quant_features(cleaned_df)

    # 8. Observability: Quality Anomaly & Outlier Checks
    vol_anomalies = detect_volume_anomalies(gold_df)
    price_outliers = detect_price_outliers(gold_df)
    logger.info(f"Quality Gate Scan: {len(vol_anomalies)} volume anomalies, {len(price_outliers)} price outliers detected.")

    # 9. Gold Analytical Schema Validation
    validated_gold = validate_analytics(gold_df)

    # 10. Gold Lakehouse Load
    upload_gold(validated_gold, bucket_name=s3_bucket, run_id=run_id)

    # 11. Telemetry Generation & Alerting
    telemetry = generate_run_telemetry(
        run_id=run_id,
        exchange=exchange,
        raw_count=len(raw_merged),
        clean_count=len(cleaned_df),
        gold_count=len(validated_gold),
        anomalies=vol_anomalies,
        outliers=price_outliers,
        sla_result=sla_result,
    )
    upload_telemetry(telemetry, bucket_name=s3_bucket, run_id=run_id)
    dispatch_alert(telemetry)

    logger.info(f"Completed AlphaFlow Pipeline Run [{run_id}] for {exchange} successfully.\n")
    return True


def main():
    parser = argparse.ArgumentParser(description="AlphaFlow Quantitative Market Data Platform CLI")
    parser.add_argument(
        "--exchange",
        type=str,
        default="all",
        choices=["all", "S&P 500", "Nifty 50"],
        help="Target exchange for data ingestion."
    )
    parser.add_argument(
        "--period",
        type=str,
        default="1mo",
        help="Historical bar period (e.g. 1mo, 3mo, 6mo, 1y)."
    )
    parser.add_argument(
        "--tickers",
        type=str,
        default="",
        help="Optional comma-separated list of symbols to ingest (e.g. AAPL,MSFT,RELIANCE.NS)."
    )
    parser.add_argument(
        "--bucket",
        type=str,
        default=S3_BUCKET_NAME,
        help="Target S3 bucket name."
    )
    parser.add_argument(
        "--use-aws",
        action="store_true",
        default=False,
        help="Enable live AWS S3 / DynamoDB / SNS streaming. Default is False (Credit Shield active, zero AWS billing)."
    )

    args = parser.parse_args()

    import os
    if args.use_aws:
        os.environ["ALPHAFLOW_ENABLE_AWS"] = "true"
        logger.info("============================================================")
        logger.info(" [AWS CLOUD MODE: ENABLED] Streaming to S3 & DynamoDB")
        logger.info("============================================================")
    else:
        logger.info("============================================================")
        logger.info(" [CREDIT SHIELD: ACTIVE] AWS is OFF (Zero AWS Cost)")
        logger.info(" Data persisted locally to Parquet lakehouse in data/")
        logger.info(" To stream to AWS, pass --use-aws")
        logger.info("============================================================")

    run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    target_tickers = [t.strip() for t in args.tickers.split(",") if t.strip()] if args.tickers else None

    target_exchanges = list(EXCHANGE_CONFIGS.keys()) if args.exchange == "all" else [args.exchange]

    all_success = True
    for exc in target_exchanges:
        success = run_single_exchange(
            exchange=exc,
            run_id=run_id,
            period=args.period,
            limit_tickers=target_tickers,
            s3_bucket=args.bucket
        )
        if not success:
            all_success = False

    if not all_success:
        logger.error("Pipeline run finished with errors.")
        sys.exit(1)

    logger.info("AlphaFlow pipeline completed all scheduled workloads with exit code 0.")
    sys.exit(0)


if __name__ == "__main__":
    main()
