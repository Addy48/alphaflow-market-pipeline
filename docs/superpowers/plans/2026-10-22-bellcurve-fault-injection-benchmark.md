# BellCurve Data: Fault Injection and Detection Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plant known faults in simulated market-close data, run data-quality checks over it, and report measured precision/recall.

**Architecture:** `src/faults.py` injects labelled faults into a simulator frame and returns ground-truth row labels. `src/dq_checks.py` holds independent check functions returning a boolean flag per row. `scripts/benchmark_checks.py` compares flags to labels and writes `results/benchmark.json`. Everything is seeded, so results are reproducible.

**Tech Stack:** Python 3.12, pandas, numpy, pytest.

Phase 1 (honesty fix) is DONE: commit `acdb4f6` (`src/simulator.py`, `scripts/export_terminal_data.py`, tests). This plan is Phase 2.

---

### Task 1: Fault injector with ground truth

**Files:**
- Create: `src/faults.py`
- Test: `tests/test_faults.py`

- [ ] **Step 1: Write the failing test**

```python
import pandas as pd
from src.faults import FAULT_TYPES, inject_faults
from src.simulator import simulate_ohlcv

END = pd.Timestamp("2026-10-20")


def _base():
    return simulate_ohlcv("NVDA", 118.5, "US", n_days=120, end=END)


def test_injection_is_deterministic_and_labelled():
    a, la = inject_faults(_base(), seed=7, rate=0.05)
    b, lb = inject_faults(_base(), seed=7, rate=0.05)
    pd.testing.assert_frame_equal(a, b)
    assert la.equals(lb)
    assert len(la) == len(a)
    assert set(la.dropna().unique()) <= set(FAULT_TYPES)
    assert la.notna().sum() > 0


def test_clean_rows_are_unchanged():
    base = _base()
    out, labels = inject_faults(base, seed=7, rate=0.05)
    clean = labels.isna()
    cols = ["Open", "High", "Low", "Close", "Volume"]
    pd.testing.assert_frame_equal(
        base.loc[clean.values, cols].reset_index(drop=True),
        out.loc[clean.values, cols].reset_index(drop=True),
    )
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `pytest tests/test_faults.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.faults'`

- [ ] **Step 3: Implement**

```python
"""Seeded fault injection with row-level ground truth labels."""
from __future__ import annotations

import numpy as np
import pandas as pd

FAULT_TYPES = ("bad_tick", "zero_volume", "duplicate_row")


def inject_faults(df: pd.DataFrame, seed: int, rate: float = 0.05):
    """Return (faulty_df, labels). labels[i] is a fault name or NaN for a clean row.
    Rows are only modified in place (bad_tick, zero_volume) or appended (duplicate_row);
    labels always align with the returned frame."""
    rng = np.random.default_rng(seed)
    out = df.copy().reset_index(drop=True)
    labels = pd.Series([np.nan] * len(out), dtype="object")
    picks = rng.choice(len(out), size=max(1, int(len(out) * rate)), replace=False)
    dups = []
    for i, idx in enumerate(sorted(picks)):
        kind = FAULT_TYPES[i % len(FAULT_TYPES)]
        if kind == "bad_tick":
            for c in ("Open", "High", "Low", "Close"):
                out.loc[idx, c] = out.loc[idx, c] * 10
        elif kind == "zero_volume":
            out.loc[idx, "Volume"] = 0
        else:
            dups.append(idx)
        labels[idx] = kind
    if dups:
        extra = out.loc[dups].copy()
        out = pd.concat([out, extra], ignore_index=True)
        labels = pd.concat([labels, pd.Series(["duplicate_row"] * len(extra), dtype="object")], ignore_index=True)
    return out, labels
```

- [ ] **Step 4: Run test, expect PASS**

Run: `pytest tests/test_faults.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/faults.py tests/test_faults.py
git commit -m "feat: seeded fault injector with ground-truth labels"
```

### Task 2: Data-quality checks

**Files:**
- Create: `src/dq_checks.py`
- Test: `tests/test_dq_checks.py`

- [ ] **Step 1: Write the failing test**

```python
import pandas as pd
from src.dq_checks import check_bad_tick, check_duplicate, check_zero_volume
from src.faults import inject_faults
from src.simulator import simulate_ohlcv


def _faulty():
    base = simulate_ohlcv("AAPL", 224.0, "US", n_days=200, end=pd.Timestamp("2026-10-20"))
    return inject_faults(base, seed=3, rate=0.06)


def test_zero_volume_check_flags_only_zero_volume_rows():
    df, labels = _faulty()
    flags = check_zero_volume(df)
    assert flags[labels == "zero_volume"].all()
    assert not flags[labels.isna()].any()


def test_duplicate_check_flags_second_occurrence():
    df, labels = _faulty()
    flags = check_duplicate(df)
    assert flags[labels == "duplicate_row"].all()


def test_bad_tick_check_catches_tenfold_jumps():
    df, labels = _faulty()
    flags = check_bad_tick(df)
    assert flags[labels == "bad_tick"].mean() >= 0.9
```

- [ ] **Step 2: Run test, expect FAIL** (`ModuleNotFoundError: No module named 'src.dq_checks'`)

Run: `pytest tests/test_dq_checks.py -v`

- [ ] **Step 3: Implement**

```python
"""Independent row-level data-quality checks. Each returns a boolean Series aligned with df."""
from __future__ import annotations

import pandas as pd


def check_zero_volume(df: pd.DataFrame) -> pd.Series:
    return df["Volume"] <= 0


def check_duplicate(df: pd.DataFrame) -> pd.Series:
    return df.duplicated(subset=["Symbol", "Date"], keep="first")


def check_bad_tick(df: pd.DataFrame, window: int = 20, k: float = 6.0) -> pd.Series:
    """Robust z-score of close vs rolling median of the previous window (MAD based)."""
    close = df["Close"].reset_index(drop=True)
    med = close.rolling(window, min_periods=5).median().shift(1)
    mad = (close - med).abs().rolling(window, min_periods=5).median().shift(1)
    z = (close - med).abs() / (1.4826 * mad.replace(0, pd.NA))
    return (z > k).fillna(False).astype(bool).set_axis(df.index)
```

- [ ] **Step 4: Run test, expect PASS** (3 passed). If bad-tick recall is below 0.9, adjust `k` or `window` and re-run; record the final values in the commit message.

- [ ] **Step 5: Commit**

```bash
git add src/dq_checks.py tests/test_dq_checks.py
git commit -m "feat: row-level data-quality checks (zero volume, duplicates, bad ticks)"
```

### Task 3: Benchmark script and evidence row

**Files:**
- Create: `scripts/benchmark_checks.py`, `results/.gitkeep`
- Test: `tests/test_benchmark.py`
- Modify: `EVIDENCE.md`

- [ ] **Step 1: Write the failing test**

```python
import importlib.util
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("benchmark_checks", os.path.join(ROOT, "scripts", "benchmark_checks.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def test_benchmark_reports_precision_and_recall_per_fault():
    res = mod.run_benchmark(seed=11, symbols=("NVDA", "AAPL"), n_days=250, rate=0.05)
    for fault in ("bad_tick", "zero_volume", "duplicate_row"):
        m = res["per_fault"][fault]
        assert 0.0 <= m["precision"] <= 1.0 and 0.0 <= m["recall"] <= 1.0
    assert res["per_fault"]["zero_volume"]["recall"] == 1.0
    assert res["seed"] == 11


def test_benchmark_is_reproducible():
    a = mod.run_benchmark(seed=11, symbols=("NVDA",), n_days=250, rate=0.05)
    b = mod.run_benchmark(seed=11, symbols=("NVDA",), n_days=250, rate=0.05)
    assert a == b
```

- [ ] **Step 2: Run test, expect FAIL** (script missing)

Run: `pytest tests/test_benchmark.py -v`

- [ ] **Step 3: Implement**

```python
#!/usr/bin/env python3
"""Measure precision/recall of data-quality checks against injected faults."""
import json
import os
import sys

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.dq_checks import check_bad_tick, check_duplicate, check_zero_volume  # noqa: E402
from src.faults import inject_faults  # noqa: E402
from src.simulator import simulate_ohlcv  # noqa: E402

CHECKS = {
    "bad_tick": check_bad_tick,
    "zero_volume": check_zero_volume,
    "duplicate_row": check_duplicate,
}


def run_benchmark(seed=11, symbols=("NVDA", "AAPL", "MSFT", "TCS.NS"), n_days=250, rate=0.05):
    counts = {f: {"tp": 0, "fp": 0, "fn": 0} for f in CHECKS}
    for i, sym in enumerate(symbols):
        exch = "NSE" if sym.endswith(".NS") else "US"
        base = simulate_ohlcv(sym, 100.0, exch, n_days=n_days, end=pd.Timestamp("2026-10-20"))
        df, labels = inject_faults(base, seed=seed + i, rate=rate)
        for fault, fn in CHECKS.items():
            flags = fn(df).reset_index(drop=True)
            truth = (labels == fault).reset_index(drop=True)
            counts[fault]["tp"] += int((flags & truth).sum())
            counts[fault]["fp"] += int((flags & ~truth).sum())
            counts[fault]["fn"] += int((~flags & truth).sum())
    per_fault = {}
    for f, c in counts.items():
        p = c["tp"] / (c["tp"] + c["fp"]) if (c["tp"] + c["fp"]) else 1.0
        r = c["tp"] / (c["tp"] + c["fn"]) if (c["tp"] + c["fn"]) else 1.0
        per_fault[f] = {"precision": round(p, 4), "recall": round(r, 4), **c}
    return {"seed": seed, "symbols": list(symbols), "n_days": n_days, "rate": rate, "per_fault": per_fault}


if __name__ == "__main__":
    res = run_benchmark()
    out = os.path.join(ROOT, "results")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "benchmark.json"), "w") as fh:
        json.dump(res, fh, indent=2)
    for f, m in res["per_fault"].items():
        print(f"{f:14s} precision={m['precision']:.3f} recall={m['recall']:.3f}")
```

- [ ] **Step 4: Run tests and the benchmark**

Run: `pytest tests/test_benchmark.py -v` then `python scripts/benchmark_checks.py`
Expected: 2 passed; three lines printed. Copy the printed numbers into `EVIDENCE.md` as a new row ("Checks catch injected faults: <numbers>", reproduce: `python scripts/benchmark_checks.py`).

- [ ] **Step 5: Commit**

```bash
git add scripts/benchmark_checks.py tests/test_benchmark.py results/benchmark.json EVIDENCE.md
git commit -m "feat: detection benchmark over injected faults with reproducible results"
```

### Later tasks (each gets its own detailed plan once Task 1-3 are merged)
- Task 4: more fault types (missing day, stale close, schema drift, unadjusted split) with matching checks and benchmark rows. Test: `tests/test_faults_extended.py`.
- Task 5: quarantine routing and idempotent replay in `src/load.py`. Test: running twice yields identical output.
- Task 6: control-room UI (`web/app/control-room/page.tsx`): SLO per close, run history, quarantine view, in-browser fault demo.
- Task 7: Terraform + GitHub Actions OIDC deploy, budget kill-switch, destroy script.
- Task 8: Vercel deploy of simulated-only console; README demo GIF.

## Self-review
- Spec coverage: honesty (done), fault injection (T1), checks (T2), measured results (T3), UI/cloud/deploy (T4-8 listed).
- Placeholders: none in Tasks 1-3. Later tasks are intentionally deferred, not omitted.
- Names consistent: `inject_faults`, `FAULT_TYPES`, `check_bad_tick/zero_volume/duplicate`, `run_benchmark`.
