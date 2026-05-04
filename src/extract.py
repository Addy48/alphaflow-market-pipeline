import logging
import io
from typing import List, Optional
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import yfinance as yf

from src.config import EXCHANGE_CONFIGS, ExchangeConfig

logger = logging.getLogger("alphaflow.extract")


def get_resilient_session(
    retries: int = 3,
    backoff_factor: float = 0.5,
    status_forcelist: tuple = (429, 500, 502, 503, 504)
) -> requests.Session:
    """Creates a resilient HTTP session with exponential backoff and connection pooling."""
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({
        "User-Agent": "AlphaFlow-Platform/1.0 (Quant Data Pipeline; Python-Requests)"
    })
    return session


def get_constituents(
    exchange: str,
    fallback_path: Optional[str] = None
) -> pd.DataFrame:
    """
    Extracts index constituents from Wikipedia or local fallback fixtures.
    Supports 'S&P 500' and 'Nifty 50'.
    """
    if exchange not in EXCHANGE_CONFIGS:
        raise ValueError(f"Unsupported exchange '{exchange}'. Must be one of {list(EXCHANGE_CONFIGS.keys())}")

    cfg: ExchangeConfig = EXCHANGE_CONFIGS[exchange]
    fallback_file = fallback_path or cfg.fallback_file
    session = get_resilient_session()

    try:
        response = session.get(cfg.wiki_url, timeout=12)
        response.raise_for_status()

        tables = pd.read_html(io.StringIO(response.text))
        df = None

        if exchange == "S&P 500":
            df = tables[0]
            if "Symbol" not in df.columns and "Ticker" in df.columns:
                df = df.rename(columns={"Ticker": "Symbol"})
            if "Security" not in df.columns:
                df["Security"] = df["Symbol"]
            # Convert BRK.B -> BRK-B for yfinance compatibility
            df["Symbol"] = df["Symbol"].astype(str).str.replace(".", "-", regex=False)
            if "GICS Sector" in df.columns:
                df = df.rename(columns={"GICS Sector": "GICS_Sector"})
            elif "GICS_Sector" not in df.columns:
                df["GICS_Sector"] = "General"

        elif exchange == "Nifty 50":
            for table in tables:
                if "Symbol" in table.columns:
                    df = table
                    break
            if df is None:
                raise ValueError("Could not find table containing 'Symbol' in Nifty 50 Wikipedia article.")

            # Append .NS suffix for Indian National Stock Exchange tickers
            df["Symbol"] = df["Symbol"].astype(str).apply(
                lambda s: s if s.endswith(".NS") else f"{s}.NS"
            )
            if "Company Name" in df.columns:
                df = df.rename(columns={"Company Name": "Security"})
            elif "Security" not in df.columns:
                df["Security"] = df["Symbol"]

            if "Sector" in df.columns:
                df = df.rename(columns={"Sector": "GICS_Sector"})
            elif "GICS Sector" in df.columns:
                df = df.rename(columns={"GICS Sector": "GICS_Sector"})
            elif "GICS_Sector" not in df.columns:
                df["GICS_Sector"] = "General"

        df["Exchange"] = exchange
        result_df = df[["Symbol", "GICS_Sector", "Security", "Exchange"]].dropna(subset=["Symbol"]).drop_duplicates(subset=["Symbol"]).reset_index(drop=True)
        logger.info(f"Extracted {len(result_df)} active constituents for {exchange} from Wikipedia.")
        return result_df

    except Exception as exc:
        logger.warning(f"Wikipedia extraction for {exchange} failed: {exc}. Engaging fallback fixture at {fallback_file}")
        try:
            fallback_df = pd.read_csv(fallback_file)
            if "GICS Sector" in fallback_df.columns:
                fallback_df = fallback_df.rename(columns={"GICS Sector": "GICS_Sector"})
            if "GICS_Sector" not in fallback_df.columns:
                fallback_df["GICS_Sector"] = "General"
            fallback_df["Exchange"] = exchange
            result_df = fallback_df[["Symbol", "GICS_Sector", "Security", "Exchange"]].reset_index(drop=True)
            logger.info(f"Successfully loaded {len(result_df)} fallback tickers from {fallback_file}.")
            return result_df
        except Exception as fallback_err:
            logger.critical(f"Both live extraction and fallback failed for {exchange}: {fallback_err}")
            raise


def fetch_ohlcv(tickers: List[str], period: str = "1mo") -> pd.DataFrame:
    """
    Downloads OHLCV market bars for a list of tickers via yfinance.
    Flattens multi-level indexes into standardized tabular schema.
    """
    if not tickers:
        logger.warning("Empty ticker list passed to fetch_ohlcv.")
        return pd.DataFrame()

    logger.info(f"Downloading {period} OHLCV data for {len(tickers)} tickers via yfinance...")

    try:
        data = yf.download(
            tickers=tickers,
            period=period,
            group_by="ticker",
            auto_adjust=False,
            threads=True,
            progress=False,
        )

        if data.empty:
            logger.error("yfinance returned an empty DataFrame.")
            return pd.DataFrame()

        rows = []
        if len(tickers) == 1:
            ticker = tickers[0]
            for date, row in data.iterrows():
                rows.append({
                    "Date": date,
                    "Symbol": ticker,
                    "Open": float(row.get("Open", 0.0)),
                    "High": float(row.get("High", 0.0)),
                    "Low": float(row.get("Low", 0.0)),
                    "Close": float(row.get("Close", 0.0)),
                    "Volume": float(row.get("Volume", 0.0)),
                })
        else:
            for ticker in tickers:
                if ticker in data.columns.levels[0]:
                    ticker_df = data[ticker].dropna(how="all")
                    for date, row in ticker_df.iterrows():
                        rows.append({
                            "Date": date,
                            "Symbol": ticker,
                            "Open": float(row.get("Open", 0.0)),
                            "High": float(row.get("High", 0.0)),
                            "Low": float(row.get("Low", 0.0)),
                            "Close": float(row.get("Close", 0.0)),
                            "Volume": float(row.get("Volume", 0.0)),
                        })

        flattened_df = pd.DataFrame(rows)
        if not flattened_df.empty:
            flattened_df["Date"] = pd.to_datetime(flattened_df["Date"])
            # Remove tz info for uniform timestamp comparison
            if hasattr(flattened_df["Date"].dt, "tz") and flattened_df["Date"].dt.tz is not None:
                flattened_df["Date"] = flattened_df["Date"].dt.tz_localize(None)

        logger.info(f"Extracted {len(flattened_df)} total OHLCV rows across {len(tickers)} tickers.")
        return flattened_df

    except Exception as exc:
        logger.error(f"Error downloading OHLCV data: {exc}")
        return pd.DataFrame()
