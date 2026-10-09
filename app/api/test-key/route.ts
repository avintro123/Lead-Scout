import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 6 key validation requests / minute
  const rateLimit = checkRateLimit(req, {
    limit: 6,
    windowSeconds: 60,
    endpointKey: "test-key",
  });

  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const rawKey = body?.apiKey;
    const keyToTest = (
      typeof rawKey === "string" && rawKey.trim()
        ? rawKey.trim()
        : process.env.GEMINI_API_KEY || ""
    ).trim();

    if (!keyToTest) {
      return NextResponse.json(
        { valid: false, error: "No API key provided" },
        { status: 400 }
      );
    }

    // Validate key structure before dispatching
    if (!/^[a-zA-Z0-9_.-]{20,120}$/.test(keyToTest)) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key structure" },
        { status: 400 }
      );
    }

    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ];
    let lastError = "";

    for (const model of modelsToTry) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToTest}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (res.ok) {
        return NextResponse.json({
          valid: true,
          message: `Gemini API key is active and verified (${model})`,
        });
      }

      const err = await res.json().catch(() => ({}));
      lastError = err?.error?.message || "Invalid API key response";
    }

    return NextResponse.json(
      { valid: false, error: lastError },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "Validation connection timed out" },
      { status: 500 }
    );
  }
}
