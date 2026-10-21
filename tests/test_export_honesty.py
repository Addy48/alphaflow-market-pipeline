import importlib.util
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("export_terminal_data", os.path.join(ROOT, "scripts", "export_terminal_data.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def test_empty_lake_is_labelled_simulated(tmp_path):
    p = mod.build_payload(str(tmp_path))
    assert p["metadata"]["data_source"] == "simulated"
    assert p["metadata"]["environment"] == "demo-simulated"
    assert len(p["metadata"]["simulated_symbols"]) == len(p["symbols"])
    assert all(s["data_source"] == "simulated" for s in p["symbols"])


def test_no_hardcoded_telemetry(tmp_path):
    t = mod.build_payload(str(tmp_path))["telemetry"]
    assert t["total_records_processed"] == sum(
        s["rows_used"] for s in mod.build_payload(str(tmp_path))["symbols"]
    )
    assert t["ingestion_sla_seconds"] != 41.8
    assert t["total_records_processed"] != 142850
    assert t["bronze_records"] == 0  # nothing in the empty lake


def test_benchmarks_come_from_data_not_constants(tmp_path):
    p = mod.build_payload(str(tmp_path))
    by_sym = {s["symbol"]: s for s in p["symbols"]}
    spy = next(b for b in p["macro"]["benchmarks"] if b["ticker"] == "SPY")
    assert spy["value"] == f"{by_sym['SPY']['price']:,.2f}"
    assert spy["value"] != "5,601.20"
    assert {b["ticker"] for b in p["macro"]["benchmarks"]} <= {"SPY", "QQQ", "NIFTY50"}


def test_payload_is_deterministic_for_prices(tmp_path):
    a = mod.build_payload(str(tmp_path))["symbols"]
    b = mod.build_payload(str(tmp_path))["symbols"]
    assert [x["rsi_14"] for x in a] == [x["rsi_14"] for x in b]


def test_simulated_mode_ignores_existing_lake(tmp_path):
    import pandas as pd

    d = tmp_path / "data" / "gold" / "Exchange=US" / "year=2026" / "month=09"
    d.mkdir(parents=True)
    rows = pd.DataFrame({"Date": pd.date_range("2026-08-01", periods=20, freq="B"), "Symbol": "NVDA", "Close": 999.0})
    rows.to_parquet(d / "x.parquet")
    p = mod.build_payload(str(tmp_path))  # default mode
    assert all(s["data_source"] == "simulated" for s in p["symbols"])
