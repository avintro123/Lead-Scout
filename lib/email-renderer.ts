/**
 * LeadScout Email Rendering & HTML Compilation Engine
 * Transforms raw text outreach sequences into clean, responsive HTML emails
 * compatible with Gmail, Apple Mail, Outlook, and mobile email clients.
 */

import { OutreachEmail } from "./types";

export interface RenderEmailOptions {
  subject: string;
  body: string;
  senderName?: string;
  senderRole?: string;
  senderCompany?: string;
  companyName?: string;
  recipientEmail?: string;
  touchLabel?: string;
  touchIndex?: number;
  totalTouches?: number;
  isTestPreview?: boolean;
}

/**
 * Validates standard email address syntax
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Generates email preheader / inbox snippet text (first 85-110 characters)
 * Truncates gracefully without breaking mid-word.
 */
export function getEmailPreheader(body: string, maxLength = 95): string {
  if (!body) return "";
  const clean = body
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= maxLength) return clean;
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Converts plain text email message into clean HTML paragraphs, preserving
 * line breaks, bullet points, and signatures.
 */
export function convertTextToHtmlParagraphs(text: string): string {
  if (!text) return "";

  // Split on double newlines for paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => {
      // Check if paragraph is a bullet list (lines starting with - or * or numbered 1.)
      const lines = p.split(/\n/).map((l) => l.trim());
      const isBulletList = lines.every(
        (l) => /^[•\-\*]\s/.test(l) || /^\d+\.\s/.test(l),
      );

      if (isBulletList && lines.length > 1) {
        const listItems = lines
          .map((l) => {
            const cleanItem = l.replace(/^[•\-\*]\s*|^\d+\.\s*/, "");
            return `<li style="margin-bottom: 6px; line-height: 1.5;">${escapeHtml(cleanItem)}</li>`;
          })
          .join("");
        return `<ul style="margin: 12px 0; padding-left: 20px; color: #1e293b;">${listItems}</ul>`;
      }

      // Standard paragraph: preserve single line breaks with <br/>
      const withLineBreaks = lines.map((l) => escapeHtml(l)).join("<br/>");
      return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #1e293b; font-size: 14.5px;">${withLineBreaks}</p>`;
    })
    .join("");
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Compiles a full standalone HTML email document with mobile responsiveness,
 * clean typography, sender footer, and optional test preview banner.
 */
export function compileHtmlEmail(options: RenderEmailOptions): string {
  const {
    subject,
    body,
    senderName = "Alex Rivera",
    senderRole = "Head of Growth",
    senderCompany = "Acquisition Engine",
    companyName = "Prospect Account",
    touchLabel = "Touch 1 · Cold Open",
    touchIndex = 1,
    totalTouches = 4,
    isTestPreview = true,
  } = options;

  const preheader = getEmailPreheader(body);
  const formattedBody = convertTextToHtmlParagraphs(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .header-badge { font-size: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text (hidden from view, visible in email client snippet) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #ffffff;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          
          ${
            isTestPreview
              ? `
          <!-- Test Send Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 10px 20px; border-bottom: 1px solid #1e293b;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em; text-transform: uppercase;">
                      ⚡ LeadScout Test Send
                    </span>
                    <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">
                      Target: <strong style="color: #f1f5f9;">${escapeHtml(companyName)}</strong>
                    </span>
                  </td>
                  <td align="right">
                    <span class="header-badge" style="font-size: 11px; font-weight: 600; background-color: #1e293b; color: #cbd5e1; padding: 2px 8px; border-radius: 4px; border: 1px solid #334155;">
                      Touch ${touchIndex} of ${totalTouches}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <div style="font-size: 14.5px; line-height: 1.6; color: #1e293b;">
                ${formattedBody}
              </div>

              <!-- Sender Signature Divider -->
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: top; padding-right: 12px;">
                      <div style="width: 38px; height: 38px; border-radius: 50%; background-color: #0f172a; color: #ffffff; text-align: center; line-height: 38px; font-weight: 700; font-size: 14px;">
                        ${escapeHtml(senderName.slice(0, 1).toUpperCase())}
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.2;">
                        ${escapeHtml(senderName)}
                      </div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        ${escapeHtml(senderRole)} · <strong style="color: #334155;">${escapeHtml(senderCompany)}</strong>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Subtle Footer Note -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                This test dispatch was sent via <strong>LeadScout</strong> Autonomous Outreach Engine.<br/>
                Sequence step: ${escapeHtml(touchLabel)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Compiles a comprehensive 4-touch sequence digest into a single multi-step
 * HTML email document, letting prospects or sales leaders review the entire
 * cadence progression in a single inbox test.
 */
export function compileSequenceDigestHtml(
  emails: OutreachEmail[],
  companyName: string,
  senderName: string,
  senderCompany: string,
): string {
  const days = ["Day 1", "Day 4", "Day 7", "Day 11"];

  const stepsHtml = emails
    .map((e, idx) => {
      const day = days[idx] || `Step ${idx + 1}`;
      const bodyHtml = convertTextToHtmlParagraphs(e.body);

      return `
      <!-- Step ${idx + 1} Card -->
      <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex;">
          <span style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
            Touch #${idx + 1} (${day}) · ${escapeHtml(e.label)}
          </span>
        </div>
        <div style="padding: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #cbd5e1;">
            Subject: <span style="color: #0f172a;">${escapeHtml(e.subject)}</span>
          </div>
          <div style="font-size: 13.5px; line-height: 1.55; color: #1e293b;">
            ${bodyHtml}
          </div>
        </div>
      </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Outreach Cadence for ${escapeHtml(companyName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="640" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color: #0f172a; padding: 16px 24px;">
              <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">
                LeadScout Sequence Digest
              </span>
              <h2 style="margin: 4px 0 0 0; font-size: 18px; color: #ffffff; font-weight: 600;">
                Full 4-Touch Outbound Cadence for ${escapeHtml(companyName)}
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                Prepared by ${escapeHtml(senderName)} (${escapeHtml(senderCompany)})
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              ${stepsHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
              End of 4-touch cadence. Total word count: ~${emails.reduce((acc, e) => acc + e.body.split(/\s+/).length, 0)} words.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
