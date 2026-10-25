import { LeadRecord, ScoutResult, IcpProfileSettings, PipelineLead, PipelineStage, PipelineMetrics } from "./types";

const LEADS_STORAGE_KEY = "leadscout_local_leads";
const SETTINGS_STORAGE_KEY = "leadscout_settings";
const PINNED_STORAGE_KEY = "leadscout_pinned_domains";

export interface UserSettings {
  geminiApiKey?: string;
  resendApiKey?: string;
  testRecipientEmail?: string;
  preferredDeliveryProvider?: "resend" | "simulation";
  senderName: string;
  senderCompany: string;
  senderRole: string;
  valueProp: string;
  tone: "direct" | "consultative" | "casual";
  defaultObjective: string;
  icpProfile?: IcpProfileSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: "",
  resendApiKey: "",
  testRecipientEmail: "",
  preferredDeliveryProvider: "simulation",
  senderName: "Alex Rivera",
  senderCompany: "Acquisition Engine",
  senderRole: "Head of Growth",
  valueProp:
    "We help B2B SaaS teams cut enterprise sales friction and accelerate pipeline velocity.",
  tone: "direct",
  defaultObjective: "client_acquisition",
  icpProfile: {
    targetHeadcounts: ["250 - 1,000", "1,000 - 5,000", "5,000+"],
    targetBusinessModels: [
      "B2B SaaS",
      "Enterprise Software",
      "Fintech",
      "Developer Tools",
      "Infrastructure",
    ],
    targetKeywords: [
      "API",
      "Enterprise",
      "Cloud",
      "Platform",
      "SaaS",
      "Automation",
      "Security",
      "Billing",
      "Payments",
    ],
    minQualificationScore: 70,
  },
};

export function getLocalLeads(): LeadRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local leads:", e);
    return [];
  }
}

export function saveLocalLead(
  domain: string,
  companyName: string,
  objective: string,
  result: ScoutResult,
): LeadRecord {
  const existing = getLocalLeads();
  // Filter out any previous record for the same domain to update with newest
  const cleanDomain = domain.toLowerCase().trim();
  const filtered = existing.filter(
    (l) => l.domain.toLowerCase() !== cleanDomain,
  );

  const newRecord: LeadRecord = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    domain: cleanDomain,
    company_name: companyName,
    objective,
    dossier_json: result,
    created_at: new Date().toISOString(),
  };

  const updated = [newRecord, ...filtered].slice(0, 50); // keep recent 50
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving local lead:", e);
  }
  return newRecord;
}

export function deleteLocalLead(id: string): LeadRecord[] {
  const existing = getLocalLeads();
  const updated = existing.filter((l) => l.id !== id);
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error deleting local lead:", e);
  }
  return updated;
}

export function clearAllLocalLeads(): void {
  try {
    localStorage.removeItem(LEADS_STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing local leads:", e);
  }
}

export function getPinnedDomains(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : ["stripe.com", "notion.so"];
  } catch {
    return ["stripe.com", "notion.so"];
  }
}

export function togglePinnedDomain(domain: string): string[] {
  const current = getPinnedDomains();
  const clean = domain.toLowerCase();
  const updated = current.includes(clean)
    ? current.filter((d) => d !== clean)
    : [...current, clean];
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      icpProfile: {
        ...DEFAULT_SETTINGS.icpProfile!,
        ...(parsed.icpProfile || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(
  settings: Partial<UserSettings>,
): UserSettings {
  const current = getUserSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving user settings:", e);
  }
  return updated;
}

// ─── Pipeline Storage ────────────────────────────────────────────────────────

const PIPELINE_STORAGE_KEY = "leadscout_pipeline";

export function getPipelineLeads(): PipelineLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading pipeline:", e);
    return [];
  }
}

function savePipelineLeadsRaw(leads: PipelineLead[]): void {
  try {
    localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Error saving pipeline:", e);
  }
}

export function savePipelineLead(lead: PipelineLead): PipelineLead {
  const existing = getPipelineLeads();
  const idx = existing.findIndex((l) => l.id === lead.id);
  if (idx >= 0) {
    existing[idx] = lead;
  } else {
    existing.unshift(lead);
  }
  savePipelineLeadsRaw(existing);
  return lead;
}

export function movePipelineLead(leadId: string, newStage: PipelineStage): PipelineLead | null {
  const existing = getPipelineLeads();
  const idx = existing.findIndex((l) => l.id === leadId);
  if (idx < 0) return null;
  existing[idx] = {
    ...existing[idx],
    stage: newStage,
    movedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  savePipelineLeadsRaw(existing);
  return existing[idx];
}

export function updatePipelineLead(leadId: string, updates: Partial<PipelineLead>): PipelineLead | null {
  const existing = getPipelineLeads();
  const idx = existing.findIndex((l) => l.id === leadId);
  if (idx < 0) return null;
  existing[idx] = {
    ...existing[idx],
    ...updates,
    lastActivityAt: new Date().toISOString(),
  };
  savePipelineLeadsRaw(existing);
  return existing[idx];
}

export function deletePipelineLead(leadId: string): PipelineLead[] {
  const existing = getPipelineLeads();
  const updated = existing.filter((l) => l.id !== leadId);
  savePipelineLeadsRaw(updated);
  return updated;
}

/** Auto-import researched leads into pipeline as "cold" if not already present */
export function syncLeadsToPipeline(): PipelineLead[] {
  const leads = getLocalLeads();
  const pipeline = getPipelineLeads();
  const existingDomains = new Set(pipeline.map((p) => p.domain.toLowerCase()));

  let changed = false;
  for (const lead of leads) {
    const cleanDomain = lead.domain.toLowerCase();
    if (!existingDomains.has(cleanDomain)) {
      const dossier = lead.dossier_json?.dossier;
      const newPipelineLead: PipelineLead = {
        id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        domain: cleanDomain,
        companyName: lead.company_name || dossier?.companyName || cleanDomain,
        stage: "cold",
        objective: lead.objective || "client_acquisition",
        icpScore: undefined,
        icpTier: undefined,
        estimatedValue: 0,
        contactName: undefined,
        contactEmail: undefined,
        contactTitle: undefined,
        notes: "",
        followUpDate: undefined,
        followUpNote: undefined,
        touchesSent: 0,
        lastActivityAt: lead.created_at || new Date().toISOString(),
        createdAt: lead.created_at || new Date().toISOString(),
        movedAt: lead.created_at || new Date().toISOString(),
        dossierRef: lead.dossier_json,
        tags: dossier?.industryTags?.slice(0, 3) || [],
      };
      pipeline.unshift(newPipelineLead);
      existingDomains.add(cleanDomain);
      changed = true;
    }
  }

  if (changed) {
    savePipelineLeadsRaw(pipeline);
  }
  return pipeline;
}

export function computePipelineMetrics(leads: PipelineLead[]): PipelineMetrics {
  const byStage: Record<PipelineStage, number> = {
    cold: 0, contacted: 0, replied: 0, won: 0, lost: 0,
  };
  let totalValue = 0;
  let totalDays = 0;
  let overdueFollowUps = 0;
  let upcomingFollowUps = 0;
  const now = new Date();

  for (const lead of leads) {
    byStage[lead.stage]++;
    totalValue += lead.estimatedValue || 0;
    const created = new Date(lead.createdAt);
    totalDays += (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (lead.followUpDate) {
      const fdate = new Date(lead.followUpDate);
      if (fdate < now && lead.stage !== "won" && lead.stage !== "lost") {
        overdueFollowUps++;
      } else if (fdate >= now && lead.stage !== "won" && lead.stage !== "lost") {
        upcomingFollowUps++;
      }
    }
  }

  const total = leads.length || 1;

  // Count all leads that ever progressed past cold
  const everContacted = leads.filter((l) => l.stage !== "cold").length;
  const everReplied = leads.filter((l) => l.stage === "replied" || l.stage === "won").length;
  const wonCount = byStage.won;

  return {
    totalLeads: leads.length,
    byStage,
    conversionRates: {
      coldToContacted: total > 0 ? Math.round((everContacted / total) * 100) : 0,
      contactedToReplied: everContacted > 0 ? Math.round((everReplied / everContacted) * 100) : 0,
      repliedToWon: everReplied > 0 ? Math.round((wonCount / everReplied) * 100) : 0,
      overallWinRate: total > 0 ? Math.round((wonCount / total) * 100) : 0,
    },
    estimatedPipelineValue: totalValue,
    avgDaysInPipeline: Math.round(totalDays / total),
    upcomingFollowUps,
    overdueFollowUps,
  };
}

