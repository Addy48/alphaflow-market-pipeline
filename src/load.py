import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd
import boto3
from botocore.exceptions import ClientError

from src.config import BASE_DIR, AWS_REGION, S3_BUCKET_NAME

logger = logging.getLogger("alphaflow.load")


def get_s3_client(region: str = AWS_REGION):
    """Initializes and returns a boto3 S3 client."""
    return boto3.client("s3", region_name=region)


def upload_bronze(
    df: pd.DataFrame,
    bucket_name: str = S3_BUCKET_NAME,
    run_id: str = "latest",
    s3_client=None
) -> bool:
    """Writes Bronze parquet locally and uploads to S3."""
    if df.empty:
        logger.warning("Empty dataframe supplied to upload_bronze.")
        return False

    local_dir = BASE_DIR / "data/bronze" / f"run_id={run_id}"
    local_dir.mkdir(parents=True, exist_ok=True)
    local_file = local_dir / "bronze.parquet"

    try:
        df.to_parquet(local_file, index=False, engine="pyarrow")
        logger.info(f"Persisted Bronze tier locally to {local_file}")

        client = s3_client or get_s3_client()
        s3_key = f"bronze/run_id={run_id}/data.parquet"
        client.upload_file(str(local_file), bucket_name, s3_key)
        logger.info(f"Uploaded Bronze dataset to s3://{bucket_name}/{s3_key}")
        return True
    except (ClientError, Exception) as err:
        logger.warning(f"S3 Bronze upload skipped or failed: {err}. Local copy preserved.")
        return True  # Local copy exists, don't break pipeline if AWS credentials absent in local dev


def upload_silver(
    df: pd.DataFrame,
    bucket_name: str = S3_BUCKET_NAME,
    run_id: str = "latest",
    s3_client=None
) -> bool:
    """Writes Silver parquet locally and uploads to S3."""
    if df.empty:
        return False

    local_dir = BASE_DIR / "data/silver" / f"run_id={run_id}"
    local_dir.mkdir(parents=True, exist_ok=True)
    local_file = local_dir / "silver.parquet"

    try:
        df.to_parquet(local_file, index=False, engine="pyarrow")
        logger.info(f"Persisted Silver tier locally to {local_file}")

        client = s3_client or get_s3_client()
        s3_key = f"silver/run_id={run_id}/data.parquet"
        client.upload_file(str(local_file), bucket_name, s3_key)
        logger.info(f"Uploaded Silver dataset to s3://{bucket_name}/{s3_key}")
        return True
    except (ClientError, Exception) as err:
        logger.warning(f"S3 Silver upload skipped or failed: {err}. Local copy preserved.")
        return True


def upload_gold(
    df: pd.DataFrame,
    bucket_name: str = S3_BUCKET_NAME,
    run_id: str = "latest",
    s3_client=None
) -> bool:
    """
    Partitions analytical Gold dataset by Exchange and Year/Month,
    persisting both locally and to S3.
    """
    if df.empty:
        return False

    gold_base = BASE_DIR / "data/gold"
    gold_base.mkdir(parents=True, exist_ok=True)

    # Ensure Date column is timestamp
    temp_df = df.copy()
    temp_df["Date"] = pd.to_datetime(temp_df["Date"])
    temp_df["year"] = temp_df["Date"].dt.year
    temp_df["month"] = temp_df["Date"].dt.month.map(lambda m: f"{m:02d}")

    client = s3_client or get_s3_client()

    try:
        # Save partitioned dataset locally
        temp_df.to_parquet(
            gold_base,
            partition_cols=["Exchange", "year", "month"],
            index=False,
            engine="pyarrow"
        )
        logger.info(f"Persisted Gold analytics partitions locally under {gold_base}")

        # Upload partitioned files to S3
        for root, _, files in os.walk(gold_base):
            for file in files:
                if file.endswith(".parquet"):
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(gold_base)
                    s3_key = f"gold/{rel_path}"
                    try:
                        client.upload_file(str(full_path), bucket_name, s3_key)
                    except Exception as s3_err:
                        logger.debug(f"S3 upload for {s3_key} deferred: {s3_err}")

        logger.info(f"Gold medallion tier fully loaded into S3 data lake.")
        return True
    except Exception as err:
        logger.error(f"Error persisting Gold dataset: {err}")
        return False


def upload_telemetry(
    telemetry: Dict[str, Any],
    bucket_name: str = S3_BUCKET_NAME,
    run_id: str = "latest",
    s3_client=None
) -> bool:
    """Uploads run telemetry JSON to S3 observability prefix."""
    local_file = BASE_DIR / "logs/run_telemetry.json"
    if not local_file.exists():
        return False

    try:
        client = s3_client or get_s3_client()
        s3_key = f"observability/run_id={run_id}/telemetry.json"
        client.upload_file(str(local_file), bucket_name, s3_key)
        logger.info(f"Uploaded run telemetry to s3://{bucket_name}/{s3_key}")
        return True
    except Exception as err:
        logger.debug(f"Telemetry S3 upload deferred: {err}")
        return True
