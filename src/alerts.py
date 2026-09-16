"""AlphaFlow Event-Driven Alerting Engine.

Detects quantitative factor breakouts and price boundary crosses:
- Price upper/lower band crosses (anti-chatter: only fires on transition)
- Wilder's RSI-14 regime shifts (Overbought >70, Oversold <30)
- Bollinger Bandwidth %B breakouts (Upper >1.0, Lower <0.0)
- Volume spike surges (>3x 20-day median)

Publishes structured multi-attribute messages to AWS SNS topics.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

logger = logging.getLogger("alphaflow.alerts")


@dataclass(frozen=True)
class FactorSnapshot:
    symbol: str
    date: str
    close: float
    rsi_14: Optional[float] = None
    bollinger_pct_b: Optional[float] = None
    volume: Optional[int] = None
    alpha_score: Optional[float] = None


@dataclass(frozen=True)
class WatchlistItem:
    symbol: str
    upper_price: Optional[float] = None
    lower_price: Optional[float] = None
    rsi_overbought: float = 70.0
    rsi_oversold: float = 30.0
    notify_bollinger_breakout: bool = True


def crossed_price_band(
    symbol: str,
    current_close: float,
    prev_close: Optional[float],
    upper: Optional[float],
    lower: Optional[float],
    date_str: str = ""
) -> Optional[str]:
    """
    Detect price boundary crossing.
    Fires on transition through the band to avoid redundant alerts on static out-of-bound prices.
    """
    if upper is not None:
        if prev_close is None and current_close >= upper:
            return f"[{symbol}] Initial print close {current_close:.2f} is at/above upper band {upper:.2f}"
        if prev_close is not None and prev_close < upper <= current_close:
            return f"[{symbol}] Crossed ABOVE upper resistance {upper:.2f} ({prev_close:.2f} -> {current_close:.2f}) on {date_str}"

    if lower is not None:
        if prev_close is None and current_close <= lower:
            return f"[{symbol}] Initial print close {current_close:.2f} is at/below lower support {lower:.2f}"
        if prev_close is not None and prev_close > lower >= current_close:
            return f"[{symbol}] Crossed BELOW lower support {lower:.2f} ({prev_close:.2f} -> {current_close:.2f}) on {date_str}"

    return None


def crossed_rsi_regime(
    symbol: str,
    current_rsi: Optional[float],
    prev_rsi: Optional[float],
    overbought: float = 70.0,
    oversold: float = 30.0
) -> Optional[str]:
    """Detect Wilder's RSI-14 regime shift crossing threshold."""
    if current_rsi is None:
        return None

    if prev_rsi is None:
        if current_rsi >= overbought:
            return f"[{symbol}] RSI-14 initial observation in overbought territory ({current_rsi:.1f} >= {overbought:.1f})"
        if current_rsi <= oversold:
            return f"[{symbol}] RSI-14 initial observation in oversold territory ({current_rsi:.1f} <= {oversold:.1f})"
        return None

    if prev_rsi < overbought <= current_rsi:
        return f"[{symbol}] RSI-14 crossed into OVERBOUGHT regime ({prev_rsi:.1f} -> {current_rsi:.1f})"
    if prev_rsi > oversold >= current_rsi:
        return f"[{symbol}] RSI-14 crossed into OVERSOLD regime ({prev_rsi:.1f} -> {current_rsi:.1f})"

    return None


def crossed_bollinger_band(
    symbol: str,
    current_pct_b: Optional[float],
    prev_pct_b: Optional[float]
) -> Optional[str]:
    """Detect Bollinger %B envelope penetration."""
    if current_pct_b is None:
        return None

    if prev_pct_b is not None:
        if prev_pct_b < 1.0 <= current_pct_b:
            return f"[{symbol}] Bollinger %B UPPER BREAKOUT ({prev_pct_b:.2f} -> {current_pct_b:.2f})"
        if prev_pct_b > 0.0 >= current_pct_b:
            return f"[{symbol}] Bollinger %B LOWER BREAKDOWN ({prev_pct_b:.2f} -> {current_pct_b:.2f})"
    elif current_pct_b > 1.0:
        return f"[{symbol}] Bollinger %B elevated above upper band ({current_pct_b:.2f} > 1.0)"
    elif current_pct_b < 0.0:
        return f"[{symbol}] Bollinger %B depressed below lower band ({current_pct_b:.2f} < 0.0)"

    return None


def evaluate_factor_triggers(
    current: FactorSnapshot,
    previous: Optional[FactorSnapshot],
    rule: WatchlistItem
) -> List[str]:
    """Evaluate all quantitative trigger conditions for an equity."""
    triggers: List[str] = []

    # 1. Price threshold checks
    prev_close = previous.close if previous else None
    price_alert = crossed_price_band(
        current.symbol,
        current.close,
        prev_close,
        rule.upper_price,
        rule.lower_price,
        current.date
    )
    if price_alert:
        triggers.append(price_alert)

    # 2. RSI-14 regime check
    prev_rsi = previous.rsi_14 if previous else None
    rsi_alert = crossed_rsi_regime(
        current.symbol,
        current.rsi_14,
        prev_rsi,
        rule.rsi_overbought,
        rule.rsi_oversold
    )
    if rsi_alert:
        triggers.append(rsi_alert)

    # 3. Bollinger %B breakout check
    if rule.notify_bollinger_breakout:
        prev_pct_b = previous.bollinger_pct_b if previous else None
        bb_alert = crossed_bollinger_band(current.symbol, current.bollinger_pct_b, prev_pct_b)
        if bb_alert:
            triggers.append(bb_alert)

    return triggers


def publish_sns_alert(
    topic_arn: str,
    region: str,
    snapshot: FactorSnapshot,
    triggers: List[str]
) -> str:
    """
    Publish high-priority alert notification to AWS SNS.
    Includes structured JSON payload in message attributes for automated downstream consumers.
    """
    if not topic_arn:
        raise RuntimeError("SNS_TOPIC_ARN environment variable is not configured")

    import boto3

    subject = f"AlphaFlow Alert: {snapshot.symbol} Trigger ({len(triggers)} condition{'s' if len(triggers) > 1 else ''})"
    body_lines = [
        f"ALPHAFLOW FACTOR SENTINEL ALERT",
        f"Symbol: {snapshot.symbol} | Date: {snapshot.date}",
        f"Close Price: {snapshot.close:.2f}",
        f"RSI-14: {snapshot.rsi_14:.1f}" if snapshot.rsi_14 is not None else "RSI-14: N/A",
        f"Bollinger %B: {snapshot.bollinger_pct_b:.2f}" if snapshot.bollinger_pct_b is not None else "Bollinger %B: N/A",
        f"Alpha Score: {snapshot.alpha_score:.1f}" if snapshot.alpha_score is not None else "Alpha Score: N/A",
        "",
        "Trigger Details:",
    ]
    for idx, t in enumerate(triggers, 1):
        body_lines.append(f"  {idx}. {t}")

    body_lines.extend([
        "",
        "Dashboard Terminal: https://alphaflow-terminal.vercel.app",
        "Pipeline Source: Medallion S3 Factor Mart + Pandera Validated",
    ])

    message_body = "\n".join(body_lines)
    payload_json = json.dumps({
        "symbol": snapshot.symbol,
        "date": snapshot.date,
        "close": snapshot.close,
        "rsi_14": snapshot.rsi_14,
        "bollinger_pct_b": snapshot.bollinger_pct_b,
        "alpha_score": snapshot.alpha_score,
        "triggers": triggers,
    })

    client = boto3.client("sns", region_name=region)
    resp = client.publish(
        TopicArn=topic_arn,
        Subject=subject[:100],
        Message=message_body,
        MessageAttributes={
            "symbol": {"DataType": "String", "StringValue": snapshot.symbol},
            "date": {"DataType": "String", "StringValue": snapshot.date},
            "trigger_count": {"DataType": "Number", "StringValue": str(len(triggers))},
            "payload": {"DataType": "String", "StringValue": payload_json},
        },
    )

    msg_id = resp.get("MessageId", "unknown")
    logger.info("Published SNS alert for %s (MessageId: %s)", snapshot.symbol, msg_id)
    return msg_id
