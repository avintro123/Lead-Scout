import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/security";
import {
  isValidEmail,
  compileHtmlEmail,
  compileSequenceDigestHtml,
} from "@/lib/email-renderer";
import { OutreachEmail } from "@/lib/types";

interface SendTestRequest {
  recipientEmail: string;
  subject: string;
  body: string;
  provider?: "resend" | "simulation";
  customResendKey?: string;
  senderName?: string;
  senderCompany?: string;
  senderRole?: string;
  companyName?: string;
  touchLabel?: string;
  touchIndex?: number;
  totalTouches?: number;
  mode?: "single" | "all";
  allEmails?: OutreachEmail[];
}

export async function POST(req: NextRequest) {
  // 1. Sliding-window IP Rate Limiting (15 test sends / min per IP)
  const rateLimit = checkRateLimit(req, {
    limit: 15,
    windowSeconds: 60,
    endpointKey: "send-test",
  });
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const data: SendTestRequest = await req.json();
    const {
      recipientEmail,
      subject,
      body,
      provider = "resend",
      customResendKey,
      senderName = "Alex Rivera",
      senderCompany = "Acquisition Engine",
      senderRole = "Head of Growth",
      companyName = "Prospect Account",
      touchLabel = "Touch 1 · Cold Open",
      touchIndex = 1,
      totalTouches = 4,
      mode = "single",
      allEmails,
    } = data;

    // 2. Validate Recipient Email
    const cleanRecipient = (recipientEmail || "").trim().toLowerCase();
    if (!cleanRecipient || !isValidEmail(cleanRecipient)) {
      return NextResponse.json(
        { error: "A valid recipient email address is required (e.g. name@company.com)." },
        { status: 400 }
      );
    }

    // 3. Validate Content
    if (mode === "single" && (!body || !subject)) {
      return NextResponse.json(
        { error: "Subject and email body cannot be empty." },
        { status: 400 }
      );
    }

    if (mode === "all" && (!allEmails || allEmails.length === 0)) {
      return NextResponse.json(
        { error: "Sequence touches are required to send complete digest." },
        { status: 400 }
      );
    }

    const safeSubject = sanitizeString(
      mode === "all"
        ? `[Cadence Digest] Complete 4-Touch Sequence for ${companyName}`
        : `[TEST] ${subject}`,
      200
    );

    // 4. Generate Compiled HTML
    let emailHtml = "";
    let emailText = "";

    if (mode === "all" && allEmails && allEmails.length > 0) {
      emailHtml = compileSequenceDigestHtml(
        allEmails,
        companyName,
        senderName,
        senderCompany
      );
      emailText = allEmails
        .map(
          (e, idx) =>
            `=== Touch ${idx + 1}: ${e.label} ===\nSubject: ${e.subject}\n\n${e.body}\n`
        )
        .join("\n\n");
    } else {
      emailHtml = compileHtmlEmail({
        subject: safeSubject,
        body,
        senderName,
        senderRole,
        senderCompany,
        companyName,
        recipientEmail: cleanRecipient,
        touchLabel,
        touchIndex,
        totalTouches,
        isTestPreview: true,
      });
      emailText = body;
    }

    // 5. Handle Simulation / Sandbox Mode
    if (provider === "simulation") {
      // Simulate slight network roundtrip (300ms)
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({
        success: true,
        provider: "simulation",
        isSimulated: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        recipient: cleanRecipient,
        subject: safeSubject,
        spfDkim: "PASS",
        deliveredAt: new Date().toISOString(),
        renderedHtml: emailHtml,
        notice:
          "Simulated delivery successful. Headers, layout, and HTML formatting verified.",
      });
    }

    // 6. Handle Live Delivery via Resend API
    const resendApiKey =
      (customResendKey || "").trim() || (process.env.RESEND_API_KEY || "").trim();

    if (!resendApiKey) {
      return NextResponse.json(
        {
          error:
            "No Resend API Key configured. Please enter your Resend API Key in Settings or switch to Simulated Sandbox mode.",
          requiresKey: true,
        },
        { status: 400 }
      );
    }

    const resendPayload = {
      from: "LeadScout Test <onboarding@resend.dev>",
      to: [cleanRecipient],
      subject: safeSubject,
      html: emailHtml,
      text: emailText,
      headers: {
        "X-Entity-Ref-ID": `leadscout-${Date.now()}`,
      },
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      // Handle known Resend restriction regarding the onboarding domain
      let userFriendlyError =
        resendData?.message || "Failed to dispatch test email via Resend.";
      if (
        userFriendlyError.includes("testing domain") ||
        userFriendlyError.includes("onboarding@resend.dev")
      ) {
        userFriendlyError =
          "Resend's default test domain (onboarding@resend.dev) can only send to the email address registered on your Resend account. To send to other addresses, verify your domain in Resend.";
      }

      return NextResponse.json(
        {
          error: userFriendlyError,
          provider: "resend",
          details: resendData,
        },
        { status: resendRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "resend",
      isSimulated: false,
      messageId: resendData.id,
      recipient: cleanRecipient,
      subject: safeSubject,
      deliveredAt: new Date().toISOString(),
      notice: "Live email dispatched successfully via Resend API.",
    });
  } catch (error: unknown) {
    console.error("Test send error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Dispatch failed: ${msg}` },
      { status: 500 }
    );
  }
}
