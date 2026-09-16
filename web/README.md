# AlphaFlow Quantitative Web Terminal

High-density financial terminal interface for the AlphaFlow market data lakehouse. Built with Next.js, React 19, and Tailwind CSS.

## Features

- **Live Session Status**: Real-time dual market clocks (NYSE/NASDAQ and NSE Mumbai) with UTC run counter.
- **Quantitative Factor Screener**: Multi-factor filtering across S&P 500 and Nifty 50 constituents (RSI-14, Bollinger Bands %B, MACD, 30D Volatility, 90D Sharpe proxy).
- **Technical Charting Workspace**: Interactive SVG candlestick charts with 20D SMA, Bollinger Bands, Volume, and MACD sub-panel with hover crosshairs.
- **Cross-Market Correlation Heatmap**: Interactive Pearson correlation matrix evaluating cross-border beta transmission and macro divergence.
- **Lakehouse Observability**: Medallion pipeline data lineage visualizer and SLA monitoring.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```
