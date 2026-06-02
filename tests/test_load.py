from unittest.mock import MagicMock
import pandas as pd
import pytest

from src.load import upload_bronze, upload_silver, upload_gold, upload_telemetry
from src.config import BASE_DIR


@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "Date": [pd.Timestamp("2026-05-15"), pd.Timestamp("2026-05-16")],
        "Symbol": ["AAPL", "AAPL"],
        "Exchange": ["S&P 500", "S&P 500"],
        "Close": [150.0, 155.0],
        "Volume": [1000.0, 1200.0],
        "GICS_Sector": ["Technology", "Technology"]
    })


def test_upload_bronze_local(sample_df):
    mock_s3 = MagicMock()
    success = upload_bronze(sample_df, bucket_name="mock-bucket", run_id="unit_test_bronze", s3_client=mock_s3)
    assert success is True

    bronze_file = BASE_DIR / "data/bronze/run_id=unit_test_bronze/bronze.parquet"
    assert bronze_file.exists()


def test_upload_silver_local(sample_df):
    mock_s3 = MagicMock()
    success = upload_silver(sample_df, bucket_name="mock-bucket", run_id="unit_test_silver", s3_client=mock_s3)
    assert success is True

    silver_file = BASE_DIR / "data/silver/run_id=unit_test_silver/silver.parquet"
    assert silver_file.exists()


def test_upload_gold_partitioned(sample_df):
    mock_s3 = MagicMock()
    success = upload_gold(sample_df, bucket_name="mock-bucket", run_id="unit_test_gold", s3_client=mock_s3)
    assert success is True

    gold_base = BASE_DIR / "data/gold"
    assert gold_base.exists()


def test_upload_telemetry(sample_df):
    mock_s3 = MagicMock()
    telemetry = {"run_id": "unit_test_tel", "metrics": {"records": 10}}
    # Ensure local file exists
    log_file = BASE_DIR / "logs/run_telemetry.json"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, "w") as f:
        f.write('{"test": 1}')

    success = upload_telemetry(telemetry, bucket_name="mock-bucket", run_id="unit_test_tel", s3_client=mock_s3)
    assert success is True
