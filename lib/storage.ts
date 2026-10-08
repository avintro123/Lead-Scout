import { LeadRecord, ScoutResult, IcpProfileSettings } from "./types";

const LEADS_STORAGE_KEY = "leadscout_local_leads";
const SETTINGS_STORAGE_KEY = "leadscout_settings";
const PINNED_STORAGE_KEY = "leadscout_pinned_domains";

export interface UserSettings {
  geminiApiKey?: string;
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
  senderName: "Alex Rivera",
  senderCompany: "Acquisition Engine",
  senderRole: "Head of Growth",
  valueProp: "We help B2B SaaS teams cut enterprise sales friction and accelerate pipeline velocity.",
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
  result: ScoutResult
): LeadRecord {
  const existing = getLocalLeads();
  // Filter out any previous record for the same domain to update with newest
  const cleanDomain = domain.toLowerCase().trim();
  const filtered = existing.filter((l) => l.domain.toLowerCase() !== cleanDomain);

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

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getUserSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving user settings:", e);
  }
  return updated;
}
