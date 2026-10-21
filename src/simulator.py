"""Deterministic, seeded market simulator.

Everything produced here is labelled data_source="simulated". It exists so the
pipeline can be demonstrated, load-tested and fault-injected without
redistributing licensed exchange data. Never mix it silently with real data.
"""
from __future__ import annotations

import zlib

import numpy as np
import pandas as pd

DATA_SOURCE = "simulated"


def stable_seed(symbol: str, base_seed: int = 0) -> int:
    """crc32-based seed. Unlike hash(), identical across processes and runs."""
    return (zlib.crc32(symbol.encode("utf-8")) + base_seed) % (2**32)


def simulate_ohlcv(
    symbol: str,
    base_price: float,
    exchange: str,
    n_days: int = 60,
    end: pd.Timestamp | None = None,
    base_seed: int = 0,
) -> pd.DataFrame:
    rng = np.random.default_rng(stable_seed(symbol, base_seed))
    end = pd.Timestamp.now(tz="UTC").tz_localize(None).normalize() if end is None else end
    dates = pd.date_range(end=end, periods=n_days, freq="B")

    vol = 0.015 if exchange == "NSE" else 0.018
    if symbol in ("NVDA", "TSLA"):
        vol = 0.028
    returns = rng.normal(0.0008, vol, n_days)
    close = base_price * np.cumprod(1 + returns)
    open_ = close * (1 + rng.normal(0, 0.004, n_days))
    high = np.maximum(close, open_) * (1 + np.abs(rng.normal(0, 0.006, n_days)))
    low = np.minimum(close, open_) * (1 - np.abs(rng.normal(0, 0.006, n_days)))
    volume = rng.integers(2_000_000, 45_000_000, n_days)

    return pd.DataFrame(
        {
            "Date": dates,
            "Symbol": symbol,
            "Open": open_,
            "High": high,
            "Low": low,
            "Close": close,
            "Volume": volume,
            "data_source": DATA_SOURCE,
        }
    )
