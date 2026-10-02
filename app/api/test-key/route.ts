import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const keyToTest = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToTest) {
      return NextResponse.json({ valid: false, error: "No API key provided" }, { status: 400 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyToTest}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { valid: false, error: err?.error?.message || "Invalid API key response" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true, message: "Gemini API key is active and working" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}
