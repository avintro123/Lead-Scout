import { NextRequest, NextResponse } from "next/server";
import { validateAndSanitizeTargetUrl } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 20 calls / min per IP
  const rateLimit = checkRateLimit(req, {
    limit: 20,
    windowSeconds: 60,
    endpointKey: "scout-extract",
  });

  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "Target domain or URL is required", fallback: true },
        { status: 400 }
      );
    }

    // 2. Strict SSRF Validation: Blocks private IPs, loopbacks, metadata endpoints, non-HTTP
    const validation = validateAndSanitizeTargetUrl(rawUrl);
    if (!validation.valid || !validation.cleanUrl) {
      return NextResponse.json(
        {
          error: validation.error || "Invalid or restricted target URL",
          fallback: true,
        },
        { status: 400 }
      );
    }

    const safeUrl = validation.cleanUrl;

    // 3. Use Jina Reader API to fetch clean markdown content safely
    const jinaUrl = `https://r.jina.ai/${safeUrl}`;

    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
        "User-Agent": "LeadScout-Enterprise-Audit/2.4",
      },
      signal: AbortSignal.timeout(25000), // 25s timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Extraction failed (${response.status})`,
          fallback: true,
        },
        { status: 200 }
      );
    }

    const markdown = await response.text();

    // 4. Clean, defang, and truncate content
    const cleanedContent = markdown
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image markdown
      .replace(/\[.*?\]\((javascript|data|file):.*?\)/gi, "") // Remove dangerous link protocols
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip raw script tags
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .slice(0, 8000); // 8K limit for Gemini context

    return NextResponse.json({
      content: cleanedContent,
      domain: validation.domain,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scout error:", error);
    return NextResponse.json(
      {
        error: "Failed to scout the target domain. Using verified offline intelligence.",
        fallback: true,
      },
      { status: 200 }
    );
  }
}
