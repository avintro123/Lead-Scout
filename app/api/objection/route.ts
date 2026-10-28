import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/security";

interface CustomObjectionRequest {
  objection: string;
  companyName: string;
  domain: string;
  primaryPainPoint?: string;
  industry?: string;
  competitor?: string;
  customApiKey?: string;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 25 requests / min per IP
  const rateLimit = checkRateLimit(req, {
    limit: 25,
    windowSeconds: 60,
    endpointKey: "objection-solver",
  });
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body: CustomObjectionRequest = await req.json();
    const {
      objection,
      companyName,
      domain,
      primaryPainPoint,
      industry,
      competitor,
      customApiKey,
    } = body;

    if (!objection || objection.trim().length < 4) {
      return NextResponse.json(
        { error: "A valid objection string is required" },
        { status: 400 }
      );
    }

    const safeObjection = sanitizeString(objection, 500);
    const safeCompany = sanitizeString(companyName || "the prospect", 100);
    const safeDomain = sanitizeString(domain || "", 100);
    const safePain = sanitizeString(
      primaryPainPoint || "operational bottleneck & workflow latency",
      200
    );
    const safeIndustry = sanitizeString(industry || "B2B SaaS", 100);
    const safeCompetitor = sanitizeString(competitor || "incumbent software", 100);

    // 2. Resolve Gemini API Key
    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;

    // Fallback response if API key is absent
    if (!apiKey) {
      return NextResponse.json({
        rebuttal: {
          psychologicalRoot: `The prospect is testing your conviction and attempting to de-prioritize the conversation due to perceived friction or lack of immediate urgency.`,
          steps: {
            acknowledge: `"I completely understand where you're coming from—many ${safeIndustry} leaders raise this exact point initially."`,
            reframe: `"The reason teams like ${safeCompany} still explore this is that unresolved ${safePain} compounds into significant engineering and operational overhead over time."`,
            pivot: `"I'm not asking for a commitment today. Would you be open to an 8-minute peer benchmark on how similar teams solve this without disruption?"`,
          },
          voiceScript: `I completely understand where you're coming from—many ${safeIndustry} leaders raise this exact point initially. But the reason teams like ${safeCompany} still explore this is that unresolved ${safePain} compounds into significant engineering and operational overhead over time. I'm not asking for a commitment today. Would you be open to an 8-minute peer benchmark on how similar teams solve this without disruption?`,
          trapQuestion: `If there was a way to solve ${safePain} without adding risk or requiring roadmap overhaul, would you still be opposed to taking a look?`,
        },
        source: "fallback",
      });
    }

    // 3. Prompt Gemini for real-time 3-step rebuttal
    const prompt = `You are a world-class enterprise sales trainer and objection-handling master for top B2B SaaS Account Executives.
A sales rep is on a live discovery call with a high-value prospect and just heard a tough objection.

PROSPECT CONTEXT:
- Target Company: ${safeCompany} (${safeDomain})
- Industry: ${safeIndustry}
- Identified Pain Point: ${safePain}
- Primary Alternative / Competitor: ${safeCompetitor}

PROSPECT'S EXACT OBJECTION:
"${safeObjection}"

YOUR TASK:
Craft a lethal, high-eq 3-step counter-framing response:
1. Step 1: ACKNOWLEDGE & DISARM (Zero defensiveness, validate their perspective completely so their guard drops).
2. Step 2: REFRAME (Highlight the acute blindspot or cost of inaction specific to ${safeCompany} dealing with ${safePain}).
3. Step 3: LOW-FRICTION PIVOT (A soft ask for an 8-minute benchmark or diagnostic, NOT a sales pitch).
4. Full Voice Script (Natural conversational speech a rep can read aloud smoothly).
5. Trap Question (A provocative question that turns the burden of proof back to the prospect without being rude).
6. Psychological Root (1 sentence explaining why prospects really say this).

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:
{
  "psychologicalRoot": "string",
  "steps": {
    "acknowledge": "string",
    "reframe": "string",
    "pivot": "string"
  },
  "voiceScript": "string",
  "trapQuestion": "string"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Gemini objection generation failed, using fallback:", errText);
      return NextResponse.json({
        rebuttal: {
          psychologicalRoot: `The prospect is protecting their time and testing whether you have deep context on ${safeCompany}.`,
          steps: {
            acknowledge: `"Totally hear you on that—${safeIndustry} teams have zero appetite for unnecessary tool sprawl right now."`,
            reframe: `"The reason we reached out is that teams dealing with ${safePain} usually find that living with the status quo quietly bleeds 15-20 hours a week."`,
            pivot: `"What if we did a quick 5-minute async teardown for ${safeCompany} so you have hard data when this bubbles up?"`,
          },
          voiceScript: `Totally hear you on that—${safeIndustry} teams have zero appetite for unnecessary tool sprawl right now. The reason we reached out is that teams dealing with ${safePain} usually find that living with the status quo quietly bleeds 15-20 hours a week. What if we did a quick 5-minute async teardown for ${safeCompany} so you have hard data when this bubbles up?`,
          trapQuestion: `What would need to happen for ${safePain} to become a top 3 priority this quarter?`,
        },
        source: "fallback",
      });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json({
      rebuttal: parsed,
      source: "gemini",
    });
  } catch (err: any) {
    console.error("Objection solver error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate objection rebuttal" },
      { status: 500 }
    );
  }
}
