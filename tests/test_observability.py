import json
from datetime import datetime, timezone
import pandas as pd
import pytest

from src.observability import (
    check_sla_compliance,
    detect_volume_anomalies,
    detect_price_outliers,
    generate_run_telemetry
)
from src.config import BASE_DIR


def test_check_sla_compliance_success():
    # Simulate execution 1 hour after US market close (close=21:00 UTC, run=22:00 UTC)
    simulated_time = datetime(2026, 9, 20, 22, 0, 0, tzinfo=timezone.utc)
    res = check_sla_compliance("S&P 500", execution_time=simulated_time)
    assert res["sla_passed"] is True
    assert res["delta_hours_from_close"] == 1.0


def test_detect_volume_anomalies_finds_zero():
    df = pd.DataFrame({
        "Date": [pd.Timestamp("2026-09-20"), pd.Timestamp("2026-09-20")],
        "Symbol": ["AAPL", "HALTED"],
        "Volume": [10000.0, 0.0]
    })
    anomalies = detect_volume_anomalies(df)
    assert len(anomalies) == 1
    assert "HALTED" in anomalies[0]["symbols"]


def test_detect_price_outliers():
    df = pd.DataFrame({
        "Date": [pd.Timestamp("2026-09-20"), pd.Timestamp("2026-09-20")],
        "Symbol": ["NORMAL", "SPIKE"],
        "Close": [100.0, 130.0],
        "Daily_Return": [0.01, 0.30]  # 30% jump
    })
    outliers = detect_price_outliers(df, threshold=0.15)
    assert len(outliers) == 1
    assert outliers[0]["symbol"] == "SPIKE"


def test_generate_run_telemetry():
    telemetry = generate_run_telemetry(
        run_id="test_run_123",
        exchange="S&P 500",
        raw_count=100,
        clean_count=98,
        gold_count=98,
        anomalies=[],
        outliers=[],
        sla_result={"sla_passed": True}
    )
    assert telemetry["run_id"] == "test_run_123"
    assert telemetry["metrics"]["gold_analytics_records"] == 98
    assert telemetry["observability"]["pipeline_health_status"] == "HEALTHY"

    # Verify file was written
    telemetry_file = BASE_DIR / "logs/run_telemetry.json"
    assert telemetry_file.exists()
    with open(telemetry_file, "r") as f:
        loaded = json.load(f)
    assert loaded["run_id"] == "test_run_123"
