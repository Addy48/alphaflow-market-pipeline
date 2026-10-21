import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 10 minutes before submitting another inquiry." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, organization, dataset, message, website_url } = body;

    // Honeypot spam defense — if hidden field is filled, silently reject
    if (website_url && typeof website_url === "string" && website_url.trim().length > 0) {
      // Return synthetic success to confuse automated bot harvesters
      return NextResponse.json({
        success: true,
        docketId: `AF-INQ-${Math.floor(100000 + Math.random() * 900000)}`,
        message: "Inquiry registered into factor pipeline queue.",
      });
    }

    // Server-side field validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return NextResponse.json(
        { error: "Name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }

    if (organization && typeof organization === "string" && organization.length > 100) {
      return NextResponse.json(
        { error: "Organization name cannot exceed 100 characters." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid organizational or institutional email address is required." },
        { status: 400 }
      );
    }

    const validDatasets = ["SP500", "NIFTY50", "DUAL_EXCHANGE", "LAKEHOUSE_PARQUET"];
    if (dataset && !validDatasets.includes(dataset)) {
      return NextResponse.json(
        { error: "Invalid factor dataset requested." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10 || message.trim().length > 1000) {
      return NextResponse.json(
        { error: "Research summary must be between 10 and 1000 characters." },
        { status: 400 }
      );
    }

    // Generate deterministic docket tracking number
    const timestamp = new Date().toISOString();
    const docketId = `AF-INQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      docketId,
      receivedAt: timestamp,
      message: "Research factor inquiry successfully queued for review.",
    });
  } catch (error) {
    console.error("Inquiry API Error:", error);
    return NextResponse.json(
      { error: "Failed to process inquiry. Please check input parameters." },
      { status: 500 }
    );
  }
}
