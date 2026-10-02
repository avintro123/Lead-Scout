import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

    const analysisResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!analysisResponse.ok) {
      const errText = await analysisResponse.text();
      console.error("Gemini analysis error:", errText);
      return NextResponse.json(
        { error: "Gemini API analysis failed", fallback: true },
        { status: 200 }
      );
    }

    const analysisData = await analysisResponse.json();
    const analysisText =
      analysisData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let dossier;
    try {
      dossier = JSON.parse(analysisText);
    } catch {
      // Try to extract JSON from the response
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
    "label": "Email 1 — Cold Open (Hook)",
    "subject": "compelling subject line",
    "body": "full email body with [Name] as placeholder. Use markdown bold for emphasis."
  },
  {
    "type": "value_add",
    "label": "Email 2 — Value Add",
    "subject": "compelling subject line",
    "body": "full email body providing specific value and industry insights"
  },
  {
    "type": "follow_up",
    "label": "Email 3 — Follow-Up",
    "subject": "Re: previous subject line",
    "body": "brief, friendly follow-up with clear CTA"
  },
  {
    "type": "linkedin_inmail",
    "label": "LinkedIn InMail",
    "subject": "short punchy subject",
    "body": "conversational LinkedIn message, shorter format, include emoji"
  }
]`;

    const outreachResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: outreachPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!outreachResponse.ok) {
      return NextResponse.json(
        { error: "Gemini API outreach generation failed", fallback: true },
        { status: 200 }
      );
    }

    const outreachData = await outreachResponse.json();
    const outreachText =
      outreachData.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
