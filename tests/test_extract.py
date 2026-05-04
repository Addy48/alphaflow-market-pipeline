import pytest
import pandas as pd
from unittest.mock import patch, MagicMock

from src.extract import get_resilient_session, get_constituents, fetch_ohlcv


def test_get_resilient_session():
    session = get_resilient_session()
    assert "AlphaFlow" in session.headers.get("User-Agent", "")


def test_get_sp500_constituents_fallback():
    # Force live scrape failure to test fallback fixture
    with patch("src.extract.requests.Session.get", side_effect=Exception("Network error")):
        df = get_constituents("S&P 500")
        assert not df.empty
        assert "Symbol" in df.columns
        assert "GICS_Sector" in df.columns
        assert df["Exchange"].iloc[0] == "S&P 500"


def test_get_nifty50_constituents_fallback():
    with patch("src.extract.requests.Session.get", side_effect=Exception("Network error")):
        df = get_constituents("Nifty 50")
        assert not df.empty
        assert "Symbol" in df.columns
        assert df["Symbol"].str.endswith(".NS").all()
        assert df["Exchange"].iloc[0] == "Nifty 50"


def test_fetch_ohlcv_empty():
    df = fetch_ohlcv([])
    assert df.empty


def test_fetch_ohlcv_mock_single():
    mock_df = pd.DataFrame({
        "Open": [100.0, 102.0],
        "High": [105.0, 106.0],
        "Low": [99.0, 101.0],
        "Close": [104.0, 105.0],
        "Volume": [1000.0, 1200.0]
    }, index=pd.date_range("2026-01-01", periods=2))

    with patch("yfinance.download", return_value=mock_df):
        df = fetch_ohlcv(["AAPL"], period="1mo")
        assert not df.empty
        assert len(df) == 2
        assert "Symbol" in df.columns
        assert df["Symbol"].iloc[0] == "AAPL"
