import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shouldRefresh = searchParams.get("refresh") === "true";

    const projectRoot = path.resolve(process.cwd(), "..");
    const primaryDataPath = path.join(process.cwd(), "src", "data", "market_data.json");
    const fallbackDataPath = path.join(projectRoot, "data", "market_terminal_data.json");

    if (shouldRefresh) {
      try {
        const pythonBin = path.join(projectRoot, "venv", "bin", "python");
        const exportScript = path.join(projectRoot, "scripts", "export_terminal_data.py");
        await execFileAsync(pythonBin, [exportScript], { timeout: 10000 });
      } catch (execErr) {
        console.warn("[MarketDataAPI] Background Python re-export notice:", execErr);
      }
    }

    let rawJson: string;
    try {
      rawJson = await fs.readFile(primaryDataPath, "utf-8");
    } catch {
      rawJson = await fs.readFile(fallbackDataPath, "utf-8");
    }

    const payload = JSON.parse(rawJson);

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-BellCurve-Sync-Time": new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[MarketDataAPI] Failed to fetch market data:", error);
    return NextResponse.json(
      { error: "Failed to load real-time market data payload" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..");
    const pythonBin = path.join(projectRoot, "venv", "bin", "python");
    const exportScript = path.join(projectRoot, "scripts", "export_terminal_data.py");
    
    await execFileAsync(pythonBin, [exportScript], { timeout: 10000 });

    const primaryDataPath = path.join(process.cwd(), "src", "data", "market_data.json");
    const rawJson = await fs.readFile(primaryDataPath, "utf-8");
    const payload = JSON.parse(rawJson);

    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString(), data: payload },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[MarketDataAPI] POST sync error:", errorMessage);
    return NextResponse.json(
      { error: "Pipeline execution error", details: errorMessage },
      { status: 500 }
    );
  }
}
