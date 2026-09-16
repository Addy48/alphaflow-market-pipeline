"""Unit tests for AlphaFlow Credit Shield and AWS Toggle controls."""

import pandas as pd
from unittest.mock import MagicMock, patch
import pytest

from src.load import upload_bronze, upload_silver, upload_gold, upload_telemetry
from scripts.manage_aws import cmd_status


def test_credit_shield_skips_s3_when_disabled():
    df = pd.DataFrame({
        "Symbol": ["AAPL"],
        "Exchange": ["US"],
        "Date": [pd.Timestamp("2026-09-19")],
        "Close": [230.5],
        "Volume": [1000000]
    })

    with patch("src.load.ENABLE_AWS", False), patch("boto3.client") as mock_boto:
        # Should persist locally and skip S3 without calling boto3
        success = upload_bronze(df, run_id="test_shield")
        assert success is True
        mock_boto.assert_not_called()

        success_silver = upload_silver(df, run_id="test_shield")
        assert success_silver is True
        mock_boto.assert_not_called()


def test_credit_shield_calls_s3_when_mock_client_passed():
    df = pd.DataFrame({
        "Symbol": ["NVDA"],
        "Exchange": ["US"],
        "Date": [pd.Timestamp("2026-09-19")],
        "Close": [147.8],
        "Volume": [2000000]
    })
    mock_s3 = MagicMock()
    success = upload_bronze(df, run_id="test_shield_mock", s3_client=mock_s3)
    assert success is True
    assert mock_s3.upload_file.called


def test_manage_aws_status_execution(capsys):
    with patch("scripts.manage_aws._run_cmd", return_value=(0, "mock_output")):
        cmd_status()
    captured = capsys.readouterr()
    assert "ALPHAFLOW AWS CLOUD & CREDIT SHIELD STATUS" in captured.out
    assert "BILLING SAFETY" in captured.out
