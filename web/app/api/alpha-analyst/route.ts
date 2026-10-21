import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface MarketSnapshot {
  symbols: Record<string, unknown>[];
  macro: {
    market_breadth: Record<string, unknown>;
    benchmarks: { ticker: string; name: string; value: string; change: string; status: string }[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query, snapshot } = (await req.json()) as {
      query: string;
      snapshot: MarketSnapshot;
    };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY not configured. Please add it to web/.env.local",
        },
        { status: 503 }
      );
    }

    // Lean context — only send factor-relevant fields to stay within token limits
    const compactSymbols = snapshot.symbols.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      price: s.price,
      change_1d: s.change_1d,
      rsi_14: s.rsi_14,
      bollinger_pct_b: s.bollinger_pct_b,
      volatility_30d: s.volatility_30d,
      sharpe_proxy: s.sharpe_proxy,
      macd: s.macd,
      macd_signal: s.macd_signal,
      regime: s.regime,
    }));

    const systemPrompt = `You are BellCurve Data's institutional quantitative analyst with access to real-time factor data for ${compactSymbols.length} equities (US S&P 500 + NSE Nifty 50).

You analyze: RSI-14, Bollinger %B, 30D Annualized Volatility, Sharpe Proxy (vs 4.5% risk-free), MACD, and market regime.

Guidelines:
- Be concise, quantitative, and institutional in tone
- Cite specific values from the data (e.g., "NVDA has RSI 78.2, indicating overbought conditions")  
- Use **symbol** markdown for stock tickers
- Never give personalized financial advice; always add disclaimer if giving opinions
- Keep responses under 250 words unless complex analysis is needed
- Format numbers to 2 decimal places`;

    const dataContext = JSON.stringify(
      {
        symbols: compactSymbols,
        market_breadth: snapshot.macro.market_breadth,
        benchmarks: snapshot.macro.benchmarks,
      },
      null,
      0
    );

    const userMessage = `Current Market Snapshot:\n${dataContext}\n\nQuestion: ${query}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.15,
            topP: 0.9,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}` },
        { status: 502 }
      );
    }

    const result = await geminiRes.json();
    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from model.";

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("Alpha Analyst route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
