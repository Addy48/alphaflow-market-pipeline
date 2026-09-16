"""DynamoDB Persistence for AlphaFlow Serverless State Tracking.

Stores one item per symbol per trading day with automatic 90-day TTL expiration.
Enables serverless execution to compare current state with prior trading day
without maintaining persistent server memory.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from src.alerts import FactorSnapshot

logger = logging.getLogger("alphaflow.serverless_storage")


def _get_table(table_name: str, region: str):
    import boto3
    dynamodb = boto3.resource("dynamodb", region_name=region)
    return dynamodb.Table(table_name)


def _calculate_ttl(retention_days: int) -> int:
    expires = datetime.now(timezone.utc) + timedelta(days=retention_days)
    return int(expires.timestamp())


def put_factor_state(
    table_name: str,
    region: str,
    snapshot: FactorSnapshot,
    retention_days: int = 90
) -> None:
    """Store daily factor snapshot into DynamoDB with TTL expiration."""
    item = {
        "symbol": snapshot.symbol,
        "date": snapshot.date,
        "close": str(round(snapshot.close, 4)),
        "volume": snapshot.volume or 0,
        "ttl": _calculate_ttl(retention_days),
    }
    if snapshot.rsi_14 is not None:
        item["rsi_14"] = str(round(snapshot.rsi_14, 2))
    if snapshot.bollinger_pct_b is not None:
        item["bollinger_pct_b"] = str(round(snapshot.bollinger_pct_b, 4))
    if snapshot.alpha_score is not None:
        item["alpha_score"] = str(round(snapshot.alpha_score, 2))

    table = _get_table(table_name, region)
    table.put_item(Item=item)
    logger.debug("Put DynamoDB factor state for %s on %s", snapshot.symbol, snapshot.date)


def get_previous_factor_state(
    table_name: str,
    region: str,
    symbol: str,
    before_date: str
) -> Optional[FactorSnapshot]:
    """
    Retrieve the most recent factor state strictly preceding `before_date`.
    Uses DynamoDB reverse range-key query with Limit=1 for maximum efficiency.
    """
    from boto3.dynamodb.conditions import Key
    from botocore.exceptions import ClientError

    table = _get_table(table_name, region)
    try:
        resp = table.query(
            KeyConditionExpression=Key("symbol").eq(symbol) & Key("date").lt(before_date),
            ScanIndexForward=False,
            Limit=1,
        )
    except ClientError as exc:
        logger.error("DynamoDB query failed for %s before %s: %s", symbol, before_date, exc)
        raise RuntimeError(f"DynamoDB query error: {exc}") from exc

    items = resp.get("Items", [])
    if not items:
        return None

    row = items[0]
    return FactorSnapshot(
        symbol=str(row["symbol"]),
        date=str(row["date"]),
        close=float(row["close"]),
        rsi_14=float(row["rsi_14"]) if "rsi_14" in row else None,
        bollinger_pct_b=float(row["bollinger_pct_b"]) if "bollinger_pct_b" in row else None,
        volume=int(row["volume"]) if "volume" in row else None,
        alpha_score=float(row["alpha_score"]) if "alpha_score" in row else None,
    )
