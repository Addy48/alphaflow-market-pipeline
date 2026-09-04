import streamlit as st
import pandas as pd


def render_header_bar(exchange: str, total_tickers: int, last_updated: str):
    """Renders a sleek top status bar for the institutional terminal."""
    st.markdown(
        f"""
        <div style="background-color: #12161F; padding: 14px 20px; border-radius: 8px; border: 1px solid #1E293B; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="font-size: 1.3rem; font-weight: 700; color: #F8FAFC; letter-spacing: -0.5px;">ALPHAFLOW</span>
                <span style="background-color: #0369A1; color: #E0F2FE; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; margin-left: 10px;">INSTITUTIONAL QUANT</span>
            </div>
            <div style="color: #94A3B8; font-size: 0.85rem;">
                <span>Active Exchange: <strong style="color: #38BDF8;">{exchange}</strong></span> |
                <span>Tracked Assets: <strong style="color: #F8FAFC;">{total_tickers}</strong></span> |
                <span>Freshness: <strong style="color: #10B981;">{last_updated}</strong></span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_market_kpis(df: pd.DataFrame):
    """Renders high-level institutional market metrics."""
    if df.empty or "Daily_Return" not in df.columns:
        return

    latest_date = df["Date"].max()
    latest_df = df[df["Date"] == latest_date]

    avg_return = latest_df["Daily_Return"].mean() * 100
    advancers = (latest_df["Daily_Return"] > 0).sum()
    decliners = (latest_df["Daily_Return"] < 0).sum()
    avg_vol = latest_df["Volatility_30D"].mean() * 100 if "Volatility_30D" in latest_df.columns else 0.0

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Daily Index Drift", f"{avg_return:+.2f}%", delta=f"{avg_return:.2f}%")
    with col2:
        st.metric("Market Breadth (Adv / Dec)", f"{advancers} / {decliners}", delta=f"{advancers - decliners} net")
    with col3:
        st.metric("30D Annualized Vol", f"{avg_vol:.1f}%")
    with col4:
        oversold_count = (latest_df.get("RSI_14", 50) < 30).sum()
        st.metric("RSI Oversold Assets", f"{oversold_count}", delta="-Oversold Setup" if oversold_count > 0 else "Normal")
