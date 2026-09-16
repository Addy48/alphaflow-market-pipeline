#!/usr/bin/env python3
"""AlphaFlow Serverless Sentinel Local Smoke Runner.

Simulates an AWS EventBridge trigger and tests factor breakout evaluation
without requiring live AWS cloud credentials. Outputs sample alerts to
logs/serverless_sample_alert.json.
"""

import json
import logging
import os
import sys
from pathlib import Path

# Ensure project root is in python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.alerts import (
    FactorSnapshot,
    WatchlistItem,
    evaluate_factor_triggers,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("alphaflow.smoke")


def run_smoke_simulation():
    print("=" * 70)
    print("  ALPHAFLOW EVENT-DRIVEN SERVERLESS SENTINEL: LOCAL SMOKE RUNNER")
    print("=" * 70)

    # 1. Define sample watchlist rules
    watchlist = [
        WatchlistItem(
            symbol="NVDA",
            upper_price=145.0,
            lower_price=115.0,
            rsi_overbought=70.0,
            rsi_oversold=30.0,
            notify_bollinger_breakout=True
        ),
        WatchlistItem(
            symbol="TCS.NS",
            upper_price=4500.0,
            lower_price=4100.0,
            rsi_overbought=70.0,
            rsi_oversold=30.0,
            notify_bollinger_breakout=True
        ),
        WatchlistItem(
            symbol="AAPL",
            upper_price=235.0,
            lower_price=210.0,
            rsi_overbought=70.0,
            rsi_oversold=30.0,
            notify_bollinger_breakout=True
        ),
    ]

    # 2. Simulate prior day snapshots (from DynamoDB state table)
    prior_states = {
        "NVDA": FactorSnapshot(
            symbol="NVDA",
            date="2026-09-18",
            close=142.30,
            rsi_14=68.4,
            bollinger_pct_b=0.92,
            volume=42000000,
            alpha_score=78.5
        ),
        "TCS.NS": FactorSnapshot(
            symbol="TCS.NS",
            date="2026-09-18",
            close=4280.0,
            rsi_14=52.1,
            bollinger_pct_b=0.48,
            volume=2100000,
            alpha_score=58.2
        ),
        "AAPL": FactorSnapshot(
            symbol="AAPL",
            date="2026-09-18",
            close=228.50,
            rsi_14=56.0,
            bollinger_pct_b=0.65,
            volume=35000000,
            alpha_score=64.0
        ),
    }

    # 3. Simulate current day prints with a breakout event for NVDA
    current_states = {
        "NVDA": FactorSnapshot(
            symbol="NVDA",
            date="2026-09-19",
            close=147.80,         # Crosses above upper resistance (145.00)
            rsi_14=73.8,          # Crosses above overbought threshold (70.0)
            bollinger_pct_b=1.08, # Upper Bollinger breakout (>1.0)
            volume=78000000,
            alpha_score=89.2
        ),
        "TCS.NS": FactorSnapshot(
            symbol="TCS.NS",
            date="2026-09-19",
            close=4295.0,         # Normal inside-band fluctuation
            rsi_14=53.4,
            bollinger_pct_b=0.51,
            volume=1950000,
            alpha_score=59.0
        ),
        "AAPL": FactorSnapshot(
            symbol="AAPL",
            date="2026-09-19",
            close=231.0,          # Inside band
            rsi_14=58.2,
            bollinger_pct_b=0.71,
            volume=33000000,
            alpha_score=66.1
        ),
    }

    alerts_generated = []

    for rule in watchlist:
        sym = rule.symbol
        prev = prior_states.get(sym)
        curr = current_states[sym]

        print(f"\n[EVALUATING] {sym}:")
        print(f"  Prior State:   Close=${prev.close:.2f}, RSI={prev.rsi_14:.1f}, %B={prev.bollinger_pct_b:.2f}")
        print(f"  Current Print: Close=${curr.close:.2f}, RSI={curr.rsi_14:.1f}, %B={curr.bollinger_pct_b:.2f}")

        triggers = evaluate_factor_triggers(curr, prev, rule)
        if triggers:
            print(f"  🚨 TRIGGER DETECTED ({len(triggers)} condition{'s' if len(triggers) > 1 else ''}):")
            for t in triggers:
                print(f"     -> {t}")
            
            sample_alert = {
                "event_type": "ALPHAFLOW_FACTOR_ALERT",
                "symbol": curr.symbol,
                "date": curr.date,
                "close": curr.close,
                "metrics": {
                    "rsi_14": curr.rsi_14,
                    "bollinger_pct_b": curr.bollinger_pct_b,
                    "alpha_score": curr.alpha_score,
                    "volume": curr.volume,
                },
                "triggers": triggers,
                "target_sns_topic": "arn:aws:sns:us-east-1:123456789012:alphaflow-factor-alerts",
                "simulated_message_id": "msg-8f92a10b-4d3e-4b2a-89f1-a1b2c3d4e5f6",
            }
            alerts_generated.append(sample_alert)
        else:
            print(f"  ✓ No triggers fired (Equilibrium state maintained)")

    # 4. Save sample alert artifact to logs/
    out_dir = ROOT / "logs"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "serverless_sample_alert.json"
    with open(out_file, "w") as f:
        json.dump(alerts_generated, f, indent=2)

    print("\n" + "=" * 70)
    print(f"  SMOKE RUN COMPLETE: {len(alerts_generated)} alert payload(s) written to:")
    print(f"  {out_file}")
    print("=" * 70)


if __name__ == "__main__":
    run_smoke_simulation()
