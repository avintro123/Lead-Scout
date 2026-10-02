import { NextRequest, NextResponse } from "next/server";

// Gemini API models in priority order
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

async function callGemini(apiKey: string, prompt: string, temperature = 0.3, maxTokens = 2048) {
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Model ${model} failed:`, errText);
        continue; // Try next model
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      // Filter out any thinking/thought parts to get actual JSON output
      const textPart = parts.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought);
      const text = textPart?.text || parts[0]?.text || "";
      if (text) return text;
    } catch (e) {
      console.warn(`Call to ${model} threw error:`, e);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { content, domain, objective, customApiKey } = await req.json();
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured", fallback: true },
        { status: 200 }
      );
    }

    // Phase 1: Analyze the company
    const analysisPrompt = `You are an expert B2B market analyst. Analyze the following website content and return a strictly typed JSON object.

Website Domain: ${domain}
Outreach Objective: ${objective}

Website Content:
${content}

Return ONLY a valid JSON object (no markdown, no code fences) with exactly these fields:
{
  "companyName": "string - the company name",
  "domain": "${domain}",
  "oneSentenceSummary": "string - one sentence describing what the company does",
  "tagline": "string - the company's tagline or main value proposition headline",
  "targetAudience": "string - who the company serves",
  "estimatedBusinessModel": "string - how the company makes money",
  "estimatedHeadcount": "string - estimated employee count with range",
  "industryTags": ["array of 3-5 industry tags"],
  "valuePropositions": ["array of 3-4 key value propositions"],
  "techTags": ["array of 4-7 technology tags inferred from the site"],
  "top3PainPoints": ["array of exactly 3 specific operational gaps or pitch angles based on market positioning"],
  "keyFeatures": ["array of 4-6 key products or features"]
}`;

    const analysisText = await callGemini(apiKey, analysisPrompt, 0.3, 2048);
    if (!analysisText) {
      return NextResponse.json(
        { error: "Gemini API analysis failed", fallback: true },
        { status: 200 }
      );
    }

    let dossier;
    try {
      dossier = JSON.parse(analysisText);
    } catch {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dossier = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse analysis response", fallback: true },
          { status: 200 }
        );
      }
    }

    // Phase 2: Generate outreach emails
    const objectiveLabel =
      objective === "client_acquisition"
        ? "Client Acquisition Pitch"
        : objective === "partnership_inquiry"
          ? "Partnership Inquiry"
          : "Tech Stack Audit";

    const outreachPrompt = `You are an expert B2B outreach copywriter. Based on the following company intelligence, generate 4 hyper-personalized outreach messages using the Pain-Agitate-Solution framework.

Company Intelligence:
${JSON.stringify(dossier, null, 2)}

Outreach Objective: ${objectiveLabel}

Generate ONLY a valid JSON array (no markdown, no code fences) with exactly 4 objects:
[
  {
    "type": "cold_open",
    "label": "Initial outreach",
    "subject": "compelling subject line",
    "body": "full email body with [Name] as placeholder"
  },
  {
    "type": "value_add",
    "label": "Strategic Angle",
    "subject": "compelling subject line",
    "body": "full email body providing specific value and industry insights"
  },
  {
    "type": "linkedin_inmail",
    "label": "LinkedIn InMail",
    "subject": "short punchy subject",
    "body": "conversational LinkedIn message, shorter format"
  },
  {
    "type": "follow_up",
    "label": "Closing Touch",
    "subject": "Re: previous subject line",
    "body": "brief, friendly closing follow-up"
  }
]`;

    const outreachText = await callGemini(apiKey, outreachPrompt, 0.7, 3000);
    if (!outreachText) {
      return NextResponse.json(
        { error: "Gemini API outreach generation failed", fallback: true },
        { status: 200 }
      );
    }

    let emails;
    try {
      emails = JSON.parse(outreachText);
    } catch {
      const jsonMatch = outreachText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        emails = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse outreach response", fallback: true },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({
      dossier,
      emails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis pipeline failed", fallback: true },
      { status: 200 }
    );
  }
}
