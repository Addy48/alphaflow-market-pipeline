import pytest
import pandas as pd
import pandera as pa

from src.transform import RawDataSchema, AnalyticsDataSchema, validate_raw, validate_analytics


def test_raw_data_schema_valid():
    df = pd.DataFrame({
        "Symbol": ["AAPL"],
        "Exchange": ["S&P 500"],
        "Date": [pd.Timestamp("2026-01-01")],
        "Open": [150.0],
        "High": [155.0],
        "Low": [149.0],
        "Close": [153.0],
        "Volume": [100000.0],
        "GICS_Sector": ["Technology"],
        "Security": ["Apple Inc."]
    })
    validated_df, dropped = validate_raw(df)
    assert len(dropped) == 0
    assert len(validated_df) == 1


def test_raw_data_schema_drops_invalid():
    df = pd.DataFrame({
        "Symbol": [None, "MSFT"],
        "Exchange": ["S&P 500", "S&P 500"],
        "Date": [pd.Timestamp("2026-01-01"), pd.Timestamp("2026-01-01")],
        "Close": [100.0, 200.0],
        "Volume": [1000.0, 2000.0]
    })
    validated_df, dropped = validate_raw(df)
    assert len(validated_df) == 1
    assert validated_df["Symbol"].iloc[0] == "MSFT"


def test_analytics_data_schema_enforces_positive_close():
    df = pd.DataFrame({
        "Symbol": ["AAPL"],
        "Exchange": ["S&P 500"],
        "Date": [pd.Timestamp("2026-01-01")],
        "Close": [-1.0],  # Violates gt=0
        "Volume": [1000.0],
        "GICS_Sector": ["Technology"],
        "Daily_Return": [0.01],
        "MA_20": [150.0],
        "MA_50": [148.0],
        "EMA_12": [151.0],
        "EMA_26": [149.0],
        "MACD": [2.0],
        "MACD_Signal": [1.8],
        "MACD_Hist": [0.2],
        "Bollinger_Upper": [160.0],
        "Bollinger_Lower": [140.0],
        "Bollinger_PctB": [0.65],
        "RSI_14": [55.0],
        "Volatility_30D": [0.20],
        "Max_Drawdown": [-0.05],
        "Sharpe_Proxy": [1.5],
    })
    with pytest.raises(pa.errors.SchemaError):
        validate_analytics(df)
