import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/security";

// Supported Rewrite Transformation Angles
export type RewriteStyle =
  | "make_shorter" // Cut fluff, target <60 words
  | "casual_founder" // Peer-to-peer founder tone, conversational
  | "focus_roi" // Hard metrics, ROI, business outcome focus
  | "add_ps_hook" // Keep body, append an irresistible P.S. line
  | "de_spam"; // Remove promotional triggers and high-risk spam words

interface RewriteRequest {
  currentSubject: string;
  currentBody: string;
  style: RewriteStyle;
  companyName: string;
  domain: string;
  targetPainPoint?: string;
  customApiKey?: string;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 25 rewrites / min per IP to prevent API abuse
  const rateLimit = checkRateLimit(req, {
    limit: 25,
    windowSeconds: 60,
    endpointKey: "email-rewriter",
  });
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body: RewriteRequest = await req.json();
    const {
      currentSubject,
      currentBody,
      style,
      companyName,
      domain,
      targetPainPoint,
      customApiKey,
    } = body;

    // 2. Validate & Sanitize Inputs
    if (!currentBody || !style) {
      return NextResponse.json(
        { error: "Current email body and rewrite style are required" },
        { status: 400 },
      );
    }

    const safeBody = sanitizeString(currentBody, 2000);
    const safeSubject = sanitizeString(currentSubject || "", 200);
    const safeCompany = sanitizeString(
      companyName || "the target company",
      100,
    );
    const safeDomain = sanitizeString(domain || "", 100);

    // 3. Resolve API Key (User-provided custom key or server-side env)
    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 400 },
      );
    }

    // 4. Style-Specific Prompt Instructions (Prompt Engineering)
    const styleInstructions: Record<RewriteStyle, string> = {
      make_shorter: `
        GOAL: Extreme conciseness.
        - Cut the body length to 45-65 words total.
        - Strip all pleasantries and introductory throat-clearing.
        - Retain exactly ONE core problem observation and ONE direct call-to-action (soft ask).
        - Keep subject line under 5 words.
      `,
      casual_founder: `
        GOAL: Authentic, peer-to-peer founder voice.
        - Tone: Casual, direct, humble, high-conviction. Sound like a founder texting another founder.
        - Use lowercase or informal subject line (e.g. "quick observation on stripe", "thoughts on checkout latency").
        - Absolutely NO sales jargon, NO buzzwords, NO fake praise.
      `,
      focus_roi: `
        GOAL: Financial & operational business impact.
        - Frame the pitch around revenue leaks, latency costs, team headcount hours, or CAC efficiency.
        - Include concrete phrasing like "reclaiming 15-20% bandwidth" or "reducing bounce rates".
        - Target executive decision-makers who care about P&L.
      `,
      add_ps_hook: `
        GOAL: Retain the existing email message, but craft an irresistible P.S. line.
        - The P.S. should reference a recent industry development, specific company feature on ${safeDomain}, or a zero-risk resource/loom video.
        - Format the output with the new P.S. at the very end of the body.
      `,
      de_spam: `
        GOAL: Deliverability Optimization (Spam Filter Armor).
        - Remove ALL spam trigger words (e.g., 'free', 'guarantee', 'urgent', '100%', 'risk-free', 'buy now').
        - Remove excessive punctuation (no multiple exclamation points, no all-caps words).
        - Replace aggressive calls-to-action with low-friction interest questions (e.g. "Open to a 5-min async demo?").
      `,
    };

    // 5. Construct the Complete Gen AI Prompt
    const systemPrompt = `You are a world-class cold outreach copywriter who writes emails that get 45%+ reply rates from busy executives.

Target Company: ${safeCompany} (${safeDomain})
Identified Pain Point: ${targetPainPoint || "Scaling efficiency and developer friction"}

ORIGINAL SUBJECT:
${safeSubject}

ORIGINAL BODY:
${safeBody}

REWRITE TASK:
${styleInstructions[style]}

STRICT NEGATIVE CONSTRAINTS:
1. Never start with: "I hope this email finds you well", "My name is", or "I wanted to reach out".
2. Retain placeholder tokens like [Name] or [Company] so the user's CRM mail-merge variables remain functional.
3. Return ONLY a single valid JSON object with no Markdown backticks, matching this exact schema:
{
  "subject": "The rewritten subject line",
  "body": "The complete rewritten email body text",
  "summaryOfChanges": "One short sentence explaining what was improved"
}`;

    // 6. Invoke Google Gemini with Automatic Model Fallback
    const candidateModels = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
    ];

    let textPart = "";
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 1000,
              responseMimeType: "application/json",
            },
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const matched = parts.find(
            (p: { text?: string; thought?: boolean }) => p.text && !p.thought
          );
          textPart = matched?.text || parts[0]?.text || "";
          if (textPart) break;
        }
      } catch {
        // Fall back to next model
      }
    }

    if (!textPart) {
      return NextResponse.json(
        { error: "AI rewrite service unavailable across all fallback models" },
        { status: 502 },
      );
    }

    // 7. Safe JSON Parsing
    let parsed: { subject?: string; body?: string; summaryOfChanges?: string } = {};
    try {
      parsed = JSON.parse(textPart);
    } catch {
      const match = textPart.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      subject: parsed.subject || safeSubject,
      body: parsed.body || safeBody,
      summaryOfChanges: parsed.summaryOfChanges || "Rewritten with " + style,
      styleApplied: style,
    });
  } catch (err: unknown) {
    console.error("Rewrite exception:", err);
    return NextResponse.json(
      { error: "Failed to execute AI rewrite" },
      { status: 500 },
    );
  }
}
