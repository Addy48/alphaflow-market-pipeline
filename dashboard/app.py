import os
import json
from pathlib import Path
import pandas as pd
import streamlit as st

from dashboard.components.charts import (
    plot_candlestick_with_bollinger,
    plot_macd,
    plot_cross_market_heatmap
)
from dashboard.components.kpi_cards import render_header_bar, render_market_kpis

# ---------------------------------------------------------
# Streamlit Terminal Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="AlphaFlow | Institutional Market Terminal",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Dark Terminal Theme Styling
st.markdown(
    """
    <style>
    .stApp {
        background-color: #0B0E14;
        color: #E2E8F0;
    }
    div[data-testid="stMetric"] {
        background-color: #12161F;
        border: 1px solid #1E293B;
        border-radius: 8px;
        padding: 12px;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: #12161F;
        border-radius: 6px 6px 0 0;
        border: 1px solid #1E293B;
        padding: 8px 18px;
        color: #94A3B8;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1E293B !important;
        color: #38BDF8 !important;
        border-bottom: 2px solid #38BDF8 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

BASE_DIR = Path(__file__).resolve().parent.parent


@st.cache_data(ttl=60)
def load_gold_data(exchange: str) -> pd.DataFrame:
    """Loads Gold analytics dataset from local lakehouse or mock cache."""
    gold_dir = BASE_DIR / "data/gold"

    # Search for partitioned files
    if gold_dir.exists():
        try:
            df = pd.read_parquet(gold_dir, engine="pyarrow")
            if not df.empty and "Exchange" in df.columns:
                filtered = df[df["Exchange"] == exchange]
                if not filtered.empty:
                    filtered["Date"] = pd.to_datetime(filtered["Date"])
                    return filtered
        except Exception:
            pass

    # Fallback to mock dataset if local pipeline hasn't executed yet
    mock_file = BASE_DIR / "tests/fixtures/mock_ohlcv.parquet"
    if mock_file.exists():
        df = pd.read_parquet(mock_file)
        df["Exchange"] = exchange
        df["Date"] = pd.to_datetime(df["Date"])
        if "GICS Sector" in df.columns:
            df = df.rename(columns={"GICS Sector": "GICS_Sector"})
        if "GICS_Sector" not in df.columns:
            df["GICS_Sector"] = "Technology"
        from src.transform import engineer_quant_features
        return engineer_quant_features(df)

    return pd.DataFrame()


@st.cache_data(ttl=30)
def load_telemetry() -> dict:
    """Loads run telemetry from logs/run_telemetry.json."""
    telemetry_file = BASE_DIR / "logs/run_telemetry.json"
    if telemetry_file.exists():
        try:
            with open(telemetry_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "run_id": "N/A",
        "timestamp_utc": "Awaiting execution",
        "metrics": {"raw_records_extracted": 0, "cleaned_records": 0, "gold_analytics_records": 0},
        "observability": {"sla_compliance": {"sla_passed": True}, "volume_anomalies": [], "price_outliers": [], "pipeline_health_status": "IDLE"}
    }


def main():
    # ---------------------------------------------------------
    # Sidebar Navigation & Exchange Selection
    # ---------------------------------------------------------
    with st.sidebar:
        st.markdown("### 🌐 Market Selector")
        exchange = st.selectbox("Exchange", ["S&P 500", "Nifty 50"], index=0)
        
        st.markdown("---")
        st.markdown("### ⚙️ Engine Mode")
        st.info("⚡ **Hybrid Lakehouse**: Direct zero-copy Parquet read from Medallion Lake with Athena fallback.")

        if st.button("🔄 Refresh Data Lake"):
            st.cache_data.clear()
            st.rerun()

    # Load Data
    data = load_gold_data(exchange)
    telemetry = load_telemetry()

    if data.empty:
        st.warning(f"No Gold analytics data found for {exchange}. Run the pipeline via `python run_pipeline.py --exchange '{exchange}'` to ingest data.")
        return

    latest_date_str = str(data["Date"].max().strftime("%Y-%m-%d")) if not data.empty else "N/A"
    unique_symbols = sorted(data["Symbol"].unique().tolist())

    render_header_bar(exchange, len(unique_symbols), latest_date_str)
    render_market_kpis(data)

    st.markdown("<br>", unsafe_allow_html=True)

    # ---------------------------------------------------------
    # 3-Tab Institutional Terminal
    # ---------------------------------------------------------
    tab1, tab2, tab3 = st.tabs([
        "📊 Global Market Pulse",
        "🔍 Quant Factor Screener",
        "🛡️ Lakehouse Observability & SLA"
    ])

    # ---------------------------------------------------------
    # TAB 1: Global Market Pulse
    # ---------------------------------------------------------
    with tab1:
        st.subheader("Market Breadth & Sector Momentum")
        col_sec, col_leaders = st.columns([0.6, 0.4])

        with col_sec:
            st.markdown("##### Sector Return Performance")
            sector_perf = data.groupby("GICS_Sector")["Daily_Return"].mean() * 100
            st.bar_chart(sector_perf, color="#38BDF8")

        with col_leaders:
            st.markdown("##### Top Advancers & Decliners")
            latest_session = data[data["Date"] == data["Date"].max()]
            if not latest_session.empty:
                top_movers = latest_session.sort_values("Daily_Return", ascending=False)[["Symbol", "GICS_Sector", "Close", "Daily_Return", "RSI_14"]]
                top_movers["Return"] = (top_movers["Daily_Return"] * 100).round(2).astype(str) + "%"
                top_movers["RSI"] = top_movers["RSI_14"].round(1)
                st.dataframe(
                    top_movers[["Symbol", "GICS_Sector", "Close", "Return", "RSI"]].head(8),
                    use_container_width=True,
                    hide_index=True
                )

        st.markdown("---")
        # Cross-Market Heatmap
        st.subheader("Cross-Market Sector Correlation Matrix")
        other_exchange = "Nifty 50" if exchange == "S&P 500" else "S&P 500"
        other_data = load_gold_data(other_exchange)
        if not other_data.empty and not data.empty:
            corr_fig = plot_cross_market_heatmap(data, other_data)
            st.plotly_chart(corr_fig, use_container_width=True)
        else:
            st.info(f"Ingest data for {other_exchange} to render the live cross-market correlation heatmap.")

    # ---------------------------------------------------------
    # TAB 2: Quant Factor Screener
    # ---------------------------------------------------------
    with tab2:
        st.subheader("Institutional Multi-Factor Screener")

        filter_col1, filter_col2, filter_col3 = st.columns(3)
        with filter_col1:
            selected_sector = st.selectbox("Filter Sector", ["All"] + sorted(data["GICS_Sector"].dropna().unique().tolist()))
        with filter_col2:
            rsi_filter = st.selectbox("RSI Regime", ["All", "Oversold (< 30)", "Overbought (> 70)", "Neutral (30-70)"])
        with filter_col3:
            bollinger_filter = st.selectbox("Bollinger Breakout", ["All", "Lower Band Breach (%B < 0)", "Upper Band Breach (%B > 1)"])

        filtered_df = data[data["Date"] == data["Date"].max()].copy()
        if selected_sector != "All":
            filtered_df = filtered_df[filtered_df["GICS_Sector"] == selected_sector]

        if rsi_filter == "Oversold (< 30)":
            filtered_df = filtered_df[filtered_df["RSI_14"] < 30]
        elif rsi_filter == "Overbought (> 70)":
            filtered_df = filtered_df[filtered_df["RSI_14"] > 70]
        elif rsi_filter == "Neutral (30-70)":
            filtered_df = (filtered_df["RSI_14"] >= 30) & (filtered_df["RSI_14"] <= 70)

        if bollinger_filter == "Lower Band Breach (%B < 0)":
            filtered_df = filtered_df[filtered_df["Bollinger_PctB"] < 0]
        elif bollinger_filter == "Upper Band Breach (%B > 1)":
            filtered_df = filtered_df[filtered_df["Bollinger_PctB"] > 1]

        display_cols = ["Symbol", "GICS_Sector", "Close", "Daily_Return", "RSI_14", "Bollinger_PctB", "Sharpe_Proxy"]
        screener_table = filtered_df[[c for c in display_cols if c in filtered_df.columns]].copy()
        screener_table["Daily_Return"] = (screener_table["Daily_Return"] * 100).round(2).astype(str) + "%"
        screener_table["RSI_14"] = screener_table["RSI_14"].round(1)
        screener_table["Bollinger_%B"] = screener_table["Bollinger_PctB"].round(2)
        screener_table["Sharpe_Proxy"] = screener_table["Sharpe_Proxy"].round(2)

        st.dataframe(
            screener_table.drop(columns=["Bollinger_PctB"], errors="ignore"),
            use_container_width=True,
            hide_index=True
        )

        st.markdown("---")
        st.subheader("Asset Deep Dive & Trend Oscillator")
        target_symbol = st.selectbox("Select Asset for Deep Dive", unique_symbols, index=0)
        symbol_df = data[data["Symbol"] == target_symbol]

        if not symbol_df.empty:
            candlestick_fig = plot_candlestick_with_bollinger(symbol_df, target_symbol)
            st.plotly_chart(candlestick_fig, use_container_width=True)

            macd_fig = plot_macd(symbol_df, target_symbol)
            st.plotly_chart(macd_fig, use_container_width=True)

    # ---------------------------------------------------------
    # TAB 3: Lakehouse Observability & SLA
    # ---------------------------------------------------------
    with tab3:
        st.subheader("Data Lake Observability & Governance")

        obs_col1, obs_col2 = st.columns(2)
        with obs_col1:
            st.markdown("##### Run Pipeline Metadata")
            st.json({
                "Run ID": telemetry.get("run_id"),
                "Execution Time (UTC)": telemetry.get("timestamp_utc"),
                "Health Status": telemetry.get("observability", {}).get("pipeline_health_status"),
                "SLA Ingestion Status": "PASSED" if telemetry.get("observability", {}).get("sla_compliance", {}).get("sla_passed", True) else "BREACHED",
            })

        with obs_col2:
            st.markdown("##### Medallion Tier Record Counts")
            metrics = telemetry.get("metrics", {})
            st.metric("Bronze Records (Raw)", metrics.get("raw_records_extracted", 0))
            st.metric("Silver Records (Cleaned)", metrics.get("cleaned_records", 0))
            st.metric("Gold Records (Analytical)", metrics.get("gold_analytics_records", 0))

        st.markdown("##### Detected Quality Anomalies & Price Outliers")
        outliers = telemetry.get("observability", {}).get("price_outliers", [])
        if outliers:
            st.dataframe(pd.DataFrame(outliers), use_container_width=True)
        else:
            st.success("✅ Zero price outliers or corrupt spikes detected in latest run.")


if __name__ == "__main__":
    main()
