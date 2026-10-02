import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Clean the URL - ensure proper format
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Use Jina Reader API to fetch clean markdown content
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;

    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch website content (${response.status})`,
          fallback: true,
        },
        { status: 200 }
      );
    }

    const markdown = await response.text();

    // Clean and truncate the content to stay within API limits
    const cleanedContent = markdown
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image markdown
      .replace(/\[.*?\]\(javascript:.*?\)/g, "") // Remove JS links
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .slice(0, 8000); // Limit to 8K chars for Gemini context

    return NextResponse.json({
      content: cleanedContent,
      domain: targetUrl,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scout error:", error);
    return NextResponse.json(
      {
        error: "Failed to scout the target domain. Using fallback data.",
        fallback: true,
      },
      { status: 200 }
    );
  }
}
