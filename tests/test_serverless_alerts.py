"""Unit tests for AlphaFlow Event-Driven Alerting Engine."""

from unittest.mock import MagicMock, patch
import pytest

from src.alerts import (
    FactorSnapshot,
    WatchlistItem,
    crossed_bollinger_band,
    crossed_price_band,
    crossed_rsi_regime,
    evaluate_factor_triggers,
    publish_sns_alert,
)


def test_crossed_price_band_upper_transition():
    # Initial print at/above band
    res = crossed_price_band("NVDA", 150.0, None, upper=145.0, lower=110.0, date_str="2026-09-19")
    assert res is not None
    assert "at/above upper band" in res

    # Clean crossing from below to above
    res = crossed_price_band("NVDA", 146.0, 144.0, upper=145.0, lower=110.0, date_str="2026-09-19")
    assert res is not None
    assert "Crossed ABOVE upper resistance" in res

    # Anti-chatter: price already above band on previous bar -> NO alert
    res = crossed_price_band("NVDA", 152.0, 148.0, upper=145.0, lower=110.0, date_str="2026-09-19")
    assert res is None

    # Inside band fluctuation -> NO alert
    res = crossed_price_band("NVDA", 130.0, 128.0, upper=145.0, lower=110.0, date_str="2026-09-19")
    assert res is None


def test_crossed_price_band_lower_transition():
    # Clean crossing from above to below lower support
    res = crossed_price_band("AAPL", 198.0, 202.0, upper=240.0, lower=200.0, date_str="2026-09-19")
    assert res is not None
    assert "Crossed BELOW lower support" in res

    # Anti-chatter: price already below lower band -> NO alert
    res = crossed_price_band("AAPL", 195.0, 197.0, upper=240.0, lower=200.0, date_str="2026-09-19")
    assert res is None


def test_crossed_rsi_regime():
    # Crossing from neutral (65) to overbought (72)
    res = crossed_rsi_regime("NVDA", 72.5, 65.0, overbought=70.0, oversold=30.0)
    assert res is not None
    assert "OVERBOUGHT regime" in res

    # Anti-chatter: already overbought (72 -> 76) -> NO alert
    res = crossed_rsi_regime("NVDA", 76.0, 72.0, overbought=70.0, oversold=30.0)
    assert res is None

    # Crossing from neutral (35) to oversold (28)
    res = crossed_rsi_regime("TCS.NS", 28.0, 35.0, overbought=70.0, oversold=30.0)
    assert res is not None
    assert "OVERSOLD regime" in res


def test_crossed_bollinger_band():
    # Upper breakout (%B moves from 0.90 to 1.05)
    res = crossed_bollinger_band("NVDA", 1.05, 0.90)
    assert res is not None
    assert "UPPER BREAKOUT" in res

    # Lower breakdown (%B moves from 0.10 to -0.05)
    res = crossed_bollinger_band("NVDA", -0.05, 0.10)
    assert res is not None
    assert "LOWER BREAKDOWN" in res

    # Normal inside band (%B moves from 0.40 to 0.60)
    res = crossed_bollinger_band("NVDA", 0.60, 0.40)
    assert res is None


def test_evaluate_factor_triggers_combined():
    rule = WatchlistItem(
        symbol="NVDA",
        upper_price=145.0,
        lower_price=110.0,
        rsi_overbought=70.0,
        rsi_oversold=30.0,
        notify_bollinger_breakout=True,
    )
    prev = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-18",
        close=142.0,
        rsi_14=68.0,
        bollinger_pct_b=0.95,
    )
    curr = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-19",
        close=148.0,
        rsi_14=74.0,
        bollinger_pct_b=1.10,
    )
    triggers = evaluate_factor_triggers(curr, prev, rule)
    assert len(triggers) == 3
    assert any("upper resistance" in t for t in triggers)
    assert any("OVERBOUGHT" in t for t in triggers)
    assert any("UPPER BREAKOUT" in t for t in triggers)


def test_publish_sns_alert():
    mock_boto_client = MagicMock()
    mock_boto_client.publish.return_value = {"MessageId": "mock-sns-msg-12345"}

    snapshot = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-19",
        close=148.0,
        rsi_14=74.0,
        bollinger_pct_b=1.10,
        alpha_score=88.5,
    )
    triggers = ["[NVDA] Crossed ABOVE upper resistance 145.00"]

    with patch("boto3.client", return_value=mock_boto_client):
        msg_id = publish_sns_alert(
            topic_arn="arn:aws:sns:us-east-1:123456789012:alphaflow-alerts",
            region="us-east-1",
            snapshot=snapshot,
            triggers=triggers,
        )

    assert msg_id == "mock-sns-msg-12345"
    assert mock_boto_client.publish.called
    call_kwargs = mock_boto_client.publish.call_args[1]
    assert call_kwargs["TopicArn"] == "arn:aws:sns:us-east-1:123456789012:alphaflow-alerts"
    assert "NVDA" in call_kwargs["Subject"]
    assert "MessageAttributes" in call_kwargs
