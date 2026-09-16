"""Unit tests for AlphaFlow AWS Lambda Sentinel Handler."""

import json
from unittest.mock import MagicMock, patch
import pytest

from src.alerts import FactorSnapshot
from src.serverless_handler import (
    lambda_handler,
    load_watchlist_config,
)


def test_load_watchlist_config_defaults():
    items = load_watchlist_config(None)
    assert len(items) >= 3
    assert any(i.symbol == "NVDA" for i in items)
    assert any(i.symbol == "TCS.NS" for i in items)


def test_load_watchlist_config_custom():
    custom_json = json.dumps([
        {"symbol": "MSFT", "upper_price": 450.0, "lower_price": 400.0, "rsi_overbought": 72.0}
    ])
    items = load_watchlist_config(custom_json)
    assert len(items) == 1
    assert items[0].symbol == "MSFT"
    assert items[0].upper_price == 450.0
    assert items[0].rsi_overbought == 72.0


def test_lambda_handler_execution():
    mock_snapshot = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-19",
        close=148.0,
        rsi_14=74.0,
        bollinger_pct_b=1.05,
        volume=50000000,
        alpha_score=85.0,
    )
    mock_prior = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-18",
        close=142.0,
        rsi_14=68.0,
        bollinger_pct_b=0.95,
        volume=40000000,
        alpha_score=75.0,
    )

    with patch("src.serverless_handler.fetch_latest_symbol_snapshot", return_value=mock_snapshot), \
         patch("src.serverless_handler.get_previous_factor_state", return_value=mock_prior), \
         patch("src.serverless_handler.put_factor_state"), \
         patch("src.serverless_handler.publish_sns_alert", return_value="sns-msg-999"):

        resp = lambda_handler({"sns_topic_arn": "arn:aws:sns:us-east-1:123456789012:test-topic"}, None)

    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["status"] == "success"
    assert body["processed_count"] > 0
    assert len(body["alerts"]) > 0
    assert body["alerts"][0]["symbol"] == "NVDA"
    assert body["alerts"][0]["sns_message_id"] == "sns-msg-999"
