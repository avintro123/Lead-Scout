import {
  OutreachObjective,
  CompanyDossier,
  OutreachEmail,
  ScoutResult,
  LeadRecord,
} from "./types";
import { getFallbackDossier } from "./mock-data";
import { saveLocalLead, getUserSettings } from "./storage";

export interface PipelineProgressCallback {
  (step: "fetch" | "analyze" | "done", message: string): void;
}

/**
 * Executes the complete intelligence pipeline for a single domain:
 * 1. Jina Reader website content extraction
 * 2. Gemini market positioning & battlecards synthesis (with fallback cascade)
 * 3. 4-touch PAS outreach sequence generation
 * 4. Dual persistence: LocalStorage mirror + Supabase PostgreSQL
 */
export async function executeScoutPipeline(
  rawQuery: string,
  objective: OutreachObjective = "client_acquisition",
  onProgress?: PipelineProgressCallback
): Promise<LeadRecord> {
  const cleanDomain = rawQuery
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();

  const userSettings = getUserSettings();
  let useFallback = false;
  let scrapedContent = "";

  // 1. Scraping Step
  onProgress?.("fetch", `Extracting DOM content from ${cleanDomain}`);
  try {
    if (cleanDomain.includes(".")) {
      const scoutRes = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanDomain }),
      });
      const scoutData = await scoutRes.json();
      if (scoutData.fallback || scoutData.error) {
        useFallback = true;
      } else {
        scrapedContent = scoutData.content || "";
      }
    } else {
      scrapedContent = `Industry niche query: ${cleanDomain}. Generate a realistic company profile for a leading company in this space.`;
    }
  } catch {
    useFallback = true;
  }

  // 2. Synthesis Step
  onProgress?.("analyze", `Synthesizing ICP, pain points & battlecards for ${cleanDomain}`);
  let analysisDossier: CompanyDossier | null = null;
  let analysisEmails: OutreachEmail[] = [];

  if (!useFallback) {
    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: scrapedContent,
          domain: cleanDomain,
          objective,
          customApiKey: userSettings.geminiApiKey || undefined,
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.fallback && !analyzeData.error && analyzeData.dossier) {
        analysisDossier = analyzeData.dossier;
        analysisEmails = analyzeData.emails || [];
      }
    } catch {
      analysisDossier = null;
    }
  }

  // Fallback if live analysis failed or unavailable
  if (!analysisDossier) {
    const fallbackResult = getFallbackDossier(cleanDomain, objective, scrapedContent);
    analysisDossier = fallbackResult.dossier;
    analysisEmails = fallbackResult.emails;
  }

  analysisDossier = { ...analysisDossier, domain: cleanDomain };

  const result: ScoutResult = {
    dossier: analysisDossier,
    emails: analysisEmails,
    rawContent: scrapedContent,
    timestamp: new Date().toISOString(),
  };

  // 3. Dual Persistence
  onProgress?.("done", `Saving intelligence for ${analysisDossier.companyName}`);
  const record = saveLocalLead(
    cleanDomain,
    analysisDossier.companyName,
    objective,
    result
  );

  try {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: cleanDomain,
        company_name: analysisDossier.companyName,
        objective,
        dossier_json: result,
      }),
    });
  } catch {
    // Local storage persistence already succeeded
  }

  return record;
}
