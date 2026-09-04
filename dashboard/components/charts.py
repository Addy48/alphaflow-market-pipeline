import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots


def get_terminal_theme():
    """Consistent institutional dark-theme layout settings."""
    return dict(
        plot_bgcolor="#12161F",
        paper_bgcolor="#0E1117",
        font=dict(family="Inter, -apple-system, sans-serif", color="#E2E8F0"),
        xaxis=dict(gridcolor="#1E293B", linecolor="#334155"),
        yaxis=dict(gridcolor="#1E293B", linecolor="#334155"),
        margin=dict(l=40, r=40, t=40, b=40),
    )


def plot_candlestick_with_bollinger(ticker_df: pd.DataFrame, symbol: str) -> go.Figure:
    """Generates an institutional candlestick chart with Bollinger Bands and Volume."""
    df = ticker_df.sort_values("Date").copy()

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,
        row_heights=[0.75, 0.25],
        subplot_titles=(f"{symbol} Price Action & Volatility Envelopes", "Trading Volume")
    )

    # Candlestick
    fig.add_trace(
        go.Candlestick(
            x=df["Date"],
            open=df["Open"],
            high=df["High"],
            low=df["Low"],
            close=df["Close"],
            name="OHLC",
            increasing_line_color="#10B981",
            decreasing_line_color="#EF4444",
        ),
        row=1, col=1
    )

    # Bollinger Bands
    if "Bollinger_Upper" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=df["Date"], y=df["Bollinger_Upper"],
                name="Bollinger Upper (+2σ)",
                line=dict(color="rgba(148, 163, 184, 0.4)", dash="dash", width=1.2),
            ),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(
                x=df["Date"], y=df["Bollinger_Lower"],
                name="Bollinger Lower (-2σ)",
                line=dict(color="rgba(148, 163, 184, 0.4)", dash="dash", width=1.2),
                fill="tonexty",
                fillcolor="rgba(148, 163, 184, 0.05)",
            ),
            row=1, col=1
        )

    # MA 20
    if "MA_20" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=df["Date"], y=df["MA_20"],
                name="SMA 20",
                line=dict(color="#38BDF8", width=1.5),
            ),
            row=1, col=1
        )

    # Volume Subplot
    colors = ["#10B981" if c >= o else "#EF4444" for c, o in zip(df["Close"], df["Open"])]
    fig.add_trace(
        go.Bar(
            x=df["Date"], y=df["Volume"],
            name="Volume",
            marker_color=colors,
            opacity=0.75,
        ),
        row=2, col=1
    )

    theme = get_terminal_theme()
    fig.update_layout(
        **theme,
        height=520,
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return fig


def plot_macd(ticker_df: pd.DataFrame, symbol: str) -> go.Figure:
    """Generates MACD oscillator chart with signal line and colored histogram."""
    df = ticker_df.sort_values("Date").copy()

    fig = go.Figure()

    if "MACD_Hist" in df.columns:
        hist_colors = ["#10B981" if v >= 0 else "#EF4444" for v in df["MACD_Hist"]]
        fig.add_trace(
            go.Bar(
                x=df["Date"], y=df["MACD_Hist"],
                name="MACD Histogram",
                marker_color=hist_colors,
                opacity=0.8,
            )
        )

    if "MACD" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=df["Date"], y=df["MACD"],
                name="MACD (12, 26)",
                line=dict(color="#38BDF8", width=1.8),
            )
        )

    if "MACD_Signal" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=df["Date"], y=df["MACD_Signal"],
                name="Signal (9)",
                line=dict(color="#F59E0B", width=1.5, dash="dot"),
            )
        )

    theme = get_terminal_theme()
    fig.update_layout(
        **theme,
        title=f"{symbol} Trend Momentum (MACD)",
        height=280,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return fig


def plot_cross_market_heatmap(sp500_df: pd.DataFrame, nifty_df: pd.DataFrame) -> go.Figure:
    """Generates a cross-market sector performance correlation matrix between US and India."""
    # Pivot returns by sector
    sp_sector = sp500_df.groupby(["Date", "GICS_Sector"])["Daily_Return"].mean().unstack()
    ni_sector = nifty_df.groupby(["Date", "GICS_Sector"])["Daily_Return"].mean().unstack()

    # Prefix columns
    sp_sector.columns = [f"US: {c}" for c in sp_sector.columns]
    ni_sector.columns = [f"IN: {c}" for c in ni_sector.columns]

    merged = pd.concat([sp_sector, ni_sector], axis=1).dropna()
    corr_matrix = merged.corr().round(2)

    fig = go.Figure(
        data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.index,
            colorscale="Blues",
            zmin=-1, zmax=1,
            text=corr_matrix.values,
            texttemplate="%{text}",
            colorbar=dict(title="Correlation"),
        )
    )

    theme = get_terminal_theme()
    fig.update_layout(
        **theme,
        title="Cross-Market Sector Spillover Matrix (S&P 500 vs. Nifty 50)",
        height=480,
    )
    return fig
