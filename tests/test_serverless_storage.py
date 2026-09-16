"""Unit tests for AlphaFlow DynamoDB state persistence."""

from unittest.mock import MagicMock, patch
import pytest

from src.alerts import FactorSnapshot
from src.serverless_storage import (
    _calculate_ttl,
    get_previous_factor_state,
    put_factor_state,
)


def test_calculate_ttl():
    ttl = _calculate_ttl(retention_days=90)
    assert isinstance(ttl, int)
    assert ttl > 0


def test_put_factor_state():
    mock_table = MagicMock()
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_table

    snapshot = FactorSnapshot(
        symbol="NVDA",
        date="2026-09-19",
        close=147.85,
        rsi_14=72.4,
        bollinger_pct_b=1.04,
        volume=65000000,
        alpha_score=85.2,
    )

    with patch("boto3.resource", return_value=mock_resource):
        put_factor_state("alphaflow_factor_state", "us-east-1", snapshot, retention_days=90)

    assert mock_table.put_item.called
    item = mock_table.put_item.call_args[1]["Item"]
    assert item["symbol"] == "NVDA"
    assert item["date"] == "2026-09-19"
    assert item["close"] == "147.85"
    assert item["rsi_14"] == "72.4"
    assert "ttl" in item


def test_get_previous_factor_state_found():
    mock_table = MagicMock()
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_table

    mock_table.query.return_value = {
        "Items": [
            {
                "symbol": "NVDA",
                "date": "2026-09-18",
                "close": "142.30",
                "rsi_14": "68.4",
                "bollinger_pct_b": "0.92",
                "volume": 42000000,
                "alpha_score": "78.5",
            }
        ]
    }

    with patch("boto3.resource", return_value=mock_resource):
        prev = get_previous_factor_state("alphaflow_factor_state", "us-east-1", "NVDA", "2026-09-19")

    assert prev is not None
    assert prev.symbol == "NVDA"
    assert prev.date == "2026-09-18"
    assert prev.close == 142.30
    assert prev.rsi_14 == 68.4


def test_get_previous_factor_state_empty():
    mock_table = MagicMock()
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_table
    mock_table.query.return_value = {"Items": []}

    with patch("boto3.resource", return_value=mock_resource):
        prev = get_previous_factor_state("alphaflow_factor_state", "us-east-1", "NVDA", "2026-09-19")

    assert prev is None
