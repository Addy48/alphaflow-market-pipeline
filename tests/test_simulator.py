import zlib

import pandas as pd
from src.simulator import DATA_SOURCE, simulate_ohlcv, stable_seed

END = pd.Timestamp("2026-10-20")


def test_same_inputs_give_identical_frames():
    a = simulate_ohlcv("NVDA", 118.5, "US", n_days=60, end=END)
    b = simulate_ohlcv("NVDA", 118.5, "US", n_days=60, end=END)
    pd.testing.assert_frame_equal(a, b)


def test_different_symbols_differ():
    a = simulate_ohlcv("NVDA", 100.0, "US", n_days=30, end=END)
    b = simulate_ohlcv("AAPL", 100.0, "US", n_days=30, end=END)
    assert not a["Close"].equals(b["Close"])


def test_ohlc_invariants_hold():
    df = simulate_ohlcv("TCS.NS", 4290.0, "NSE", n_days=120, end=END)
    assert (df["High"] >= df[["Open", "Close"]].max(axis=1)).all()
    assert (df["Low"] <= df[["Open", "Close"]].min(axis=1)).all()
    assert (df["Volume"] > 0).all()


def test_every_row_is_labelled_simulated():
    df = simulate_ohlcv("SPY", 560.0, "US", n_days=10, end=END)
    assert set(df["data_source"]) == {DATA_SOURCE} == {"simulated"}


def test_seed_is_stable_across_processes():
    assert stable_seed("NVDA") == zlib.crc32(b"NVDA") % (2**32)
