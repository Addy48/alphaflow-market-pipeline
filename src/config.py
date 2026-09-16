import os
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, Any

# Root Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------
# Logging Setup
# ---------------------------------------------------------
def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configures structured logging for the AlphaFlow pipeline."""
    log_dir = BASE_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "pipeline.log"

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    logger = logging.getLogger("alphaflow")
    logger.setLevel(level)

    if not logger.handlers:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger

logger = setup_logging()

# ---------------------------------------------------------
# Environment and Cloud Configuration (Credit Shield)
# ---------------------------------------------------------
# Default is False to guarantee zero unexpected cloud billing.
# Turn ON via CLI flag (--use-aws) or env: ALPHAFLOW_ENABLE_AWS=true
ENABLE_AWS = os.getenv("ALPHAFLOW_ENABLE_AWS", "false").strip().lower() in ("true", "1", "yes", "on")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "alphaflow-market-data-lake")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "alphaflow_factor_state")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
ATHENA_DATABASE = os.getenv("ATHENA_DATABASE", "alphaflow_analytics")
ATHENA_WORKGROUP = os.getenv("ATHENA_WORKGROUP", "primary")

# Webhook Alerting (Optional: Discord/Slack/Telegram)
ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")

# ---------------------------------------------------------
# Exchange Specifications & Observability SLA
# ---------------------------------------------------------
@dataclass(frozen=True)
class ExchangeConfig:
    name: str
    wiki_url: str
    fallback_file: str
    ticker_suffix: str
    close_utc_hour: int
    close_utc_minute: int
    sla_max_delay_hours: float = 3.0

EXCHANGE_CONFIGS: Dict[str, ExchangeConfig] = {
    "S&P 500": ExchangeConfig(
        name="S&P 500",
        wiki_url="https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
        fallback_file=str(BASE_DIR / "tests/fixtures/mock_sp500.csv"),
        ticker_suffix="",
        close_utc_hour=21,
        close_utc_minute=0,
        sla_max_delay_hours=3.0,
    ),
    "Nifty 50": ExchangeConfig(
        name="Nifty 50",
        wiki_url="https://en.wikipedia.org/wiki/NIFTY_50",
        fallback_file=str(BASE_DIR / "tests/fixtures/mock_nifty50.csv"),
        ticker_suffix=".NS",
        close_utc_hour=10,
        close_utc_minute=0,
        sla_max_delay_hours=3.0,
    ),
}

# ---------------------------------------------------------
# Quantitative & Data Quality Thresholds
# ---------------------------------------------------------
PRICE_OUTLIER_THRESHOLD = 0.15      # > 15% single-day swing triggers quality review
MIN_CONSTITUENT_COUNT = 30         # Alert if fewer than 30 tickers are returned
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
BOLLINGER_WINDOW = 20
BOLLINGER_STD = 2
RSI_WINDOW = 14
VOLATILITY_WINDOW = 30
