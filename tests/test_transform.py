import pytest
import numpy as np
import pandas as pd

from src.transform import (
    flatten_and_merge,
    clean_data,
    compute_rsi,
    engineer_quant_features
)


@pytest.fixture
def sample_raw_df():
    dates = pd.date_range("2026-01-01", periods=60)
    data = []
    for d in dates:
        data.append({
            "Date": d,
            "Symbol": "TEST",
            "Open": 100.0,
            "High": 105.0,
            "Low": 95.0,
            "Close": 100.0 + np.sin(len(data)) * 5.0,
            "Volume": 10000.0,
            "GICS_Sector": "Technology",
            "Exchange": "S&P 500",
            "Security": "Test Corp"
        })
    return pd.DataFrame(data)


def test_clean_data_removes_negatives(sample_raw_df):
    corrupt_row = sample_raw_df.iloc[[0]].copy()
    corrupt_row["Close"] = -10.0
    df = pd.concat([sample_raw_df, corrupt_row], ignore_index=True)

    cleaned = clean_data(df)
    assert (cleaned["Close"] > 0).all()
    assert len(cleaned) == len(sample_raw_df)


def test_compute_rsi():
    prices = pd.Series([10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 14.0, 13.0, 12.0, 11.0])
    rsi = compute_rsi(prices, period=5)
    assert (rsi >= 0.0).all() and (rsi <= 100.0).all()


def test_engineer_quant_features(sample_raw_df):
    featured = engineer_quant_features(sample_raw_df)

    assert "Daily_Return" in featured.columns
    assert "MA_20" in featured.columns
    assert "MACD" in featured.columns
    assert "MACD_Signal" in featured.columns
    assert "MACD_Hist" in featured.columns
    assert "Bollinger_Upper" in featured.columns
    assert "Bollinger_Lower" in featured.columns
    assert "Bollinger_PctB" in featured.columns
    assert "RSI_14" in featured.columns
    assert "Sharpe_Proxy" in featured.columns

    # Verify Bollinger bounds
    valid_bb = featured.dropna(subset=["Bollinger_Upper", "Bollinger_Lower"])
    assert (valid_bb["Bollinger_Upper"] >= valid_bb["Bollinger_Lower"]).all()

    # Verify RSI is bounded between 0 and 100
    assert (featured["RSI_14"] >= 0).all() and (featured["RSI_14"] <= 100).all()
