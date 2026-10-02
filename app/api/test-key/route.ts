import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const keyToTest = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToTest) {
      return NextResponse.json(
        { valid: false, error: "No API key provided" },
        { status: 400 },
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
            generationConfig: { maxOutputTokens: 100 },
          }),
        },
      );

      if (res.ok) {
        return NextResponse.json({
          valid: true,
          message: `Gemini API key is active and working (${model})`,
        });
      }

      const err = await res.json().catch(() => ({}));
      lastError = err?.error?.message || "Invalid API key response";
    }

    return NextResponse.json(
      { valid: false, error: lastError },
      { status: 200 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}
