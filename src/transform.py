import logging
from typing import Tuple, List, Optional
import numpy as np
import pandas as pd
import pandera as pa
from pandera.typing import Series

from src.config import (
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    BOLLINGER_WINDOW, BOLLINGER_STD,
    RSI_WINDOW, VOLATILITY_WINDOW
)

logger = logging.getLogger("alphaflow.transform")


# ---------------------------------------------------------
# Bronze Gate: Lazy Validation Schema
# ---------------------------------------------------------
class RawDataSchema(pa.DataFrameModel):
    Symbol: Series[str] = pa.Field(nullable=False)
    Exchange: Series[str] = pa.Field(nullable=False)
    Date: Series[pd.Timestamp] = pa.Field(nullable=False)
    Open: Series[float] = pa.Field(nullable=True)
    High: Series[float] = pa.Field(nullable=True)
    Low: Series[float] = pa.Field(nullable=True)
    Close: Series[float] = pa.Field(nullable=True)
    Volume: Series[float] = pa.Field(nullable=True)
    GICS_Sector: Series[str] = pa.Field(nullable=True)
    Security: Series[str] = pa.Field(nullable=True)

    class Config:
        coerce = True
        strict = False


# ---------------------------------------------------------
# Gold Gate: Institutional Analytics Schema
# ---------------------------------------------------------
class AnalyticsDataSchema(pa.DataFrameModel):
    Symbol: Series[str] = pa.Field(nullable=False)
    Exchange: Series[str] = pa.Field(nullable=False)
    Date: Series[pd.Timestamp] = pa.Field(nullable=False)
    Close: Series[float] = pa.Field(gt=0, nullable=False)
    Volume: Series[float] = pa.Field(ge=0, nullable=False)
    GICS_Sector: Series[str] = pa.Field(nullable=False)
    Daily_Return: Series[float] = pa.Field(nullable=True)
    MA_20: Series[float] = pa.Field(nullable=True)
    MA_50: Series[float] = pa.Field(nullable=True)
    EMA_12: Series[float] = pa.Field(nullable=True)
    EMA_26: Series[float] = pa.Field(nullable=True)
    MACD: Series[float] = pa.Field(nullable=True)
    MACD_Signal: Series[float] = pa.Field(nullable=True)
    MACD_Hist: Series[float] = pa.Field(nullable=True)
    Bollinger_Upper: Series[float] = pa.Field(nullable=True)
    Bollinger_Lower: Series[float] = pa.Field(nullable=True)
    Bollinger_PctB: Series[float] = pa.Field(nullable=True)
    RSI_14: Series[float] = pa.Field(nullable=True)
    Volatility_30D: Series[float] = pa.Field(nullable=True)
    Max_Drawdown: Series[float] = pa.Field(nullable=True)
    Sharpe_Proxy: Series[float] = pa.Field(nullable=True)

    class Config:
        coerce = True
        strict = False


def flatten_and_merge(ohlcv_df: pd.DataFrame, constituents_df: pd.DataFrame) -> pd.DataFrame:
    """Merges OHLCV market bars with constituent sector metadata."""
    if ohlcv_df.empty or constituents_df.empty:
        logger.warning("Empty dataframe supplied to flatten_and_merge.")
        return pd.DataFrame()

    merged_df = ohlcv_df.merge(constituents_df, on="Symbol", how="left")
    if "GICS Sector" in merged_df.columns:
        merged_df = merged_df.rename(columns={"GICS Sector": "GICS_Sector"})
    if "GICS_Sector" not in merged_df.columns or merged_df["GICS_Sector"].isnull().all():
        merged_df["GICS_Sector"] = "General"
    else:
        merged_df["GICS_Sector"] = merged_df["GICS_Sector"].fillna("General")

    if "Exchange_x" in merged_df.columns and "Exchange_y" in merged_df.columns:
        merged_df["Exchange"] = merged_df["Exchange_x"].fillna(merged_df["Exchange_y"])
        merged_df = merged_df.drop(columns=["Exchange_x", "Exchange_y"])
    elif "Exchange" not in merged_df.columns:
        merged_df["Exchange"] = "Unknown"

    logger.info(f"Merged OHLCV with metadata. Dimensions: {merged_df.shape}")
    return merged_df


def validate_raw(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Lazy validation gate for Bronze tier. Drops corrupt records without failing pipeline."""
    if df.empty:
        return df, []

    try:
        validated_df = RawDataSchema.validate(df, lazy=True)
        return validated_df, []
    except pa.errors.SchemaErrors as err:
        failed_indices = err.failure_cases["index"].dropna().unique()
        valid_df = df.drop(index=failed_indices).reset_index(drop=True)
        failed_symbols = []
        if "Symbol" in df.columns:
            failed_symbols = df.loc[failed_indices, "Symbol"].dropna().unique().tolist()

        logger.warning(f"Bronze validation dropped {len(failed_indices)} corrupt rows. Failed symbols: {failed_symbols}")
        return valid_df, failed_symbols


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Sanitizes raw records, removes physical anomalies (Close <= 0), fills gaps."""
    if df.empty:
        return df

    cleaned = df.copy()
    # Filter physical reality
    cleaned = cleaned.dropna(subset=["Close", "Symbol", "Date"])
    cleaned = cleaned[cleaned["Close"] > 0]
    
    if "Volume" in cleaned.columns:
        cleaned["Volume"] = cleaned["Volume"].fillna(0.0)
        cleaned = cleaned[cleaned["Volume"] >= 0]
    else:
        cleaned["Volume"] = 0.0

    # Impute missing Open/High/Low with Close if unavailable
    for col in ["Open", "High", "Low"]:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].fillna(cleaned["Close"])
        else:
            cleaned[col] = cleaned["Close"]

    cleaned["GICS_Sector"] = cleaned.get("GICS_Sector", "General").fillna("General")
    cleaned["Exchange"] = cleaned.get("Exchange", "Unknown").fillna("Unknown")

    logger.info(f"Sanitization complete. Cleaned shape: {cleaned.shape}")
    return cleaned


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculates Wilder's Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=period, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=period, min_periods=1).mean()
    rs = gain / loss.replace(0.0, 1e-9)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi.fillna(50.0)


def engineer_quant_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Vectorized quantitative feature engineering:
    - Moving Averages (MA20, MA50)
    - Trend: MACD (12, 26, 9)
    - Volatility & Extremes: Bollinger Bands (20, 2) & %B
    - Momentum: RSI-14
    - Risk Metrics: 30D Annualized Volatility, Max Drawdown, Sharpe Proxy
    """
    if df.empty:
        return df

    featured = df.copy()
    featured = featured.sort_values(["Symbol", "Date"]).reset_index(drop=True)
    grouped = featured.groupby("Symbol")

    # 1. Returns
    featured["Daily_Return"] = grouped["Close"].pct_change()
    featured["Cumulative_Return"] = grouped["Daily_Return"].transform(
        lambda s: (1.0 + s.fillna(0.0)).cumprod() - 1.0
    )

    # 2. Moving Averages
    featured["MA_20"] = grouped["Close"].transform(lambda s: s.rolling(20, min_periods=1).mean())
    featured["MA_50"] = grouped["Close"].transform(lambda s: s.rolling(50, min_periods=1).mean())

    # 3. MACD Engine (Fast 12, Slow 26, Signal 9)
    featured["EMA_12"] = grouped["Close"].transform(lambda s: s.ewm(span=MACD_FAST, adjust=False).mean())
    featured["EMA_26"] = grouped["Close"].transform(lambda s: s.ewm(span=MACD_SLOW, adjust=False).mean())
    featured["MACD"] = featured["EMA_12"] - featured["EMA_26"]
    featured["MACD_Signal"] = featured.groupby("Symbol")["MACD"].transform(
        lambda s: s.ewm(span=MACD_SIGNAL, adjust=False).mean()
    )
    featured["MACD_Hist"] = featured["MACD"] - featured["MACD_Signal"]

    # 4. Bollinger Bands (20-day, 2 std)
    std_20 = grouped["Close"].transform(lambda s: s.rolling(BOLLINGER_WINDOW, min_periods=1).std()).fillna(0.0)
    featured["Bollinger_Upper"] = featured["MA_20"] + (BOLLINGER_STD * std_20)
    featured["Bollinger_Lower"] = featured["MA_20"] - (BOLLINGER_STD * std_20)
    band_width = featured["Bollinger_Upper"] - featured["Bollinger_Lower"]
    featured["Bollinger_PctB"] = (featured["Close"] - featured["Bollinger_Lower"]) / band_width.replace(0.0, 1e-9)

    # 5. RSI-14
    featured["RSI_14"] = grouped["Close"].transform(lambda s: compute_rsi(s, RSI_WINDOW))

    # 6. Risk & Volatility (Annualized sqrt(252))
    featured["Volatility_30D"] = grouped["Daily_Return"].transform(
        lambda s: s.rolling(VOLATILITY_WINDOW, min_periods=1).std() * np.sqrt(252)
    ).fillna(0.0)

    # 7. Max Drawdown (Rolling 252 sessions)
    featured["Max_Drawdown"] = grouped["Close"].transform(
        lambda s: ((s - s.cummax()) / s.cummax()).rolling(252, min_periods=1).min()
    ).fillna(0.0)

    # 8. Sharpe Ratio Proxy (Annualized return / Annualized Vol)
    ann_return = grouped["Daily_Return"].transform(lambda s: s.rolling(30, min_periods=1).mean() * 252)
    featured["Sharpe_Proxy"] = ann_return / (featured["Volatility_30D"] + 1e-6)

    # 9. Regime Classification
    featured["Momentum_Regime"] = np.where(
        featured["RSI_14"] > 70.0, "Overbought",
        np.where(featured["RSI_14"] < 30.0, "Oversold", "Neutral")
    )

    logger.info("Successfully engineered quantitative features (MACD, Bollinger, RSI, Sharpe).")
    return featured


def validate_analytics(df: pd.DataFrame) -> pd.DataFrame:
    """Eager validation gate for Gold analytical tier."""
    if df.empty:
        return df

    try:
        validated_df = AnalyticsDataSchema.validate(df)
        logger.info("Gold analytical validation passed.")
        return validated_df
    except pa.errors.SchemaError as err:
        logger.critical(f"Gold schema validation error: {err}")
        raise
