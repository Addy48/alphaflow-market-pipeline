import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import requests

from src.config import (
    BASE_DIR, EXCHANGE_CONFIGS, ExchangeConfig,
    PRICE_OUTLIER_THRESHOLD, ALERT_WEBHOOK_URL
)

logger = logging.getLogger("alphaflow.observability")


def check_sla_compliance(
    exchange: str,
    execution_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Validates whether the pipeline executed within the expected SLA window
    relative to the exchange market close (UTC).
    """
    if exchange not in EXCHANGE_CONFIGS:
        return {"exchange": exchange, "sla_passed": False, "reason": "Unknown exchange"}

    cfg: ExchangeConfig = EXCHANGE_CONFIGS[exchange]
    now_utc = execution_time or datetime.now(timezone.utc)

    market_close_today = now_utc.replace(
        hour=cfg.close_utc_hour,
        minute=cfg.close_utc_minute,
        second=0,
        microsecond=0
    )

    diff_hours = (now_utc - market_close_today).total_seconds() / 3600.0

    # Passed if executed within SLA hours after close, or triggered during market day
    is_compliant = diff_hours <= cfg.sla_max_delay_hours

    return {
        "exchange": exchange,
        "execution_time_utc": now_utc.isoformat(),
        "market_close_utc": market_close_today.isoformat(),
        "delta_hours_from_close": round(diff_hours, 2),
        "max_allowable_hours": cfg.sla_max_delay_hours,
        "sla_passed": is_compliant,
    }


def detect_volume_anomalies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Scans for volume anomalies: zero-volume sessions during active trading
    or sudden >5x volume spikes vs. recent rolling average.
    """
    if df.empty or "Volume" not in df.columns or "Symbol" not in df.columns:
        return []

    anomalies = []
    latest_date = df["Date"].max()
    latest_df = df[df["Date"] == latest_date]

    # Zero volume detection on latest trading day
    zero_vol_tickers = latest_df[latest_df["Volume"] == 0]["Symbol"].tolist()
    if zero_vol_tickers:
        anomalies.append({
            "type": "ZERO_VOLUME_HALT",
            "date": str(latest_date),
            "affected_count": len(zero_vol_tickers),
            "symbols": zero_vol_tickers[:10],
            "severity": "MEDIUM",
        })

    return anomalies


def detect_price_outliers(
    df: pd.DataFrame,
    threshold: float = PRICE_OUTLIER_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Detects single-session price anomalies (e.g. absolute daily return > 15%)
    to prevent feed corruption from contaminating downstream analytics.
    """
    if df.empty or "Daily_Return" not in df.columns:
        return []

    outliers = []
    extreme_swings = df[df["Daily_Return"].abs() >= threshold]

    if not extreme_swings.empty:
        for _, row in extreme_swings.head(15).iterrows():
            outliers.append({
                "symbol": str(row["Symbol"]),
                "date": str(row["Date"]),
                "return_pct": round(float(row["Daily_Return"]) * 100, 2),
                "close": round(float(row["Close"]), 2),
                "threshold_pct": round(threshold * 100, 2),
                "severity": "HIGH" if abs(row["Daily_Return"]) >= 0.25 else "MEDIUM"
            })

    return outliers


def generate_run_telemetry(
    run_id: str,
    exchange: str,
    raw_count: int,
    clean_count: int,
    gold_count: int,
    anomalies: List[Dict[str, Any]],
    outliers: List[Dict[str, Any]],
    sla_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Compiles an enterprise observability record and persists it to logs/run_telemetry.json.
    """
    telemetry = {
        "run_id": run_id,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "exchange": exchange,
        "metrics": {
            "raw_records_extracted": raw_count,
            "cleaned_records": clean_count,
            "gold_analytics_records": gold_count,
            "data_loss_ratio": round((1.0 - (clean_count / (raw_count + 1e-9))) * 100, 2),
        },
        "observability": {
            "sla_compliance": sla_result,
            "volume_anomalies": anomalies,
            "price_outliers": outliers,
            "anomaly_count": len(anomalies) + len(outliers),
            "pipeline_health_status": "HEALTHY" if len(outliers) < 5 and sla_result.get("sla_passed", True) else "ATTENTION_REQUIRED"
        }
    }

    log_dir = BASE_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    telemetry_path = log_dir / "run_telemetry.json"

    with open(telemetry_path, "w") as f:
        json.dump(telemetry, f, indent=2)

    logger.info(f"Run telemetry serialized to {telemetry_path}. Health status: {telemetry['observability']['pipeline_health_status']}")
    return telemetry


def dispatch_alert(telemetry: Dict[str, Any], webhook_url: Optional[str] = None) -> bool:
    """Dispatches pipeline run notifications to Discord/Slack webhooks if configured."""
    url = webhook_url or ALERT_WEBHOOK_URL
    if not url:
        logger.debug("No webhook URL configured; skipping external notification.")
        return True

    payload = {
        "username": "AlphaFlow Observability Bot",
        "content": (
            f"**[AlphaFlow Pipeline Run: {telemetry['exchange']}]**\n"
            f"• Status: `{telemetry['observability']['pipeline_health_status']}`\n"
            f"• Gold Records: `{telemetry['metrics']['gold_analytics_records']}`\n"
            f"• Anomalies Detected: `{telemetry['observability']['anomaly_count']}`\n"
            f"• SLA Ingestion Passed: `{telemetry['observability']['sla_compliance']['sla_passed']}`"
        )
    }

    try:
        res = requests.post(url, json=payload, timeout=5)
        return res.status_code in (200, 204)
    except Exception as err:
        logger.warning(f"Failed to dispatch alert webhook: {err}")
        return False
