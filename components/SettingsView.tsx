"use client";

import { useState, useEffect } from "react";
import {
  Key,
  User,
  ShieldCheck,
  Check,
  AlertCircle,
  Database,
  Globe,
  Trash2,
  Download,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  getUserSettings,
  saveUserSettings,
  clearAllLocalLeads,
  getLocalLeads,
  UserSettings,
} from "@/lib/storage";

interface SettingsViewProps {
  onRefreshHistory: () => void;
}

export default function SettingsView({ onRefreshHistory }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>(getUserSettings());
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    const s = getUserSettings();
    setSettings(s);
    if (s.geminiApiKey) {
      setApiKeyInput(s.geminiApiKey);
    }
    setLeadCount(getLocalLeads().length);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserSettings({
      ...settings,
      geminiApiKey: apiKeyInput.trim(),
    });
    setSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleTestApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setTestStatus("error");
      setTestMessage("Please enter an API key first.");
      return;
    }

    setTestStatus("testing");
    setTestMessage("");

    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (data.valid) {
        setTestStatus("success");
        setTestMessage("Key verified successfully! Gemini 2.0 Flash is ready.");
        // Auto save if valid
        saveUserSettings({ geminiApiKey: key });
      } else {
        setTestStatus("error");
        setTestMessage(data.error || "Failed to validate key.");
      }
    } catch {
      setTestStatus("error");
      setTestMessage("Network error while validating key.");
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your local research history? This cannot be undone.")) {
      clearAllLocalLeads();
      setLeadCount(0);
      onRefreshHistory();
    }
  };

  const handleExportAllJSON = () => {
    const leads = getLocalLeads();
    const blob = new Blob([JSON.stringify(leads, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadscout-leads-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-fg tracking-tight">Settings</h1>
        <p className="text-[13px] text-fg-muted mt-1">
          Configure API credentials, personalize your outreach persona, and manage workspace data.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: API Integrations */}
        <section className="bg-surface border border-border rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <Key className="w-4 h-4 text-fg" />
            <h2 className="text-[14px] font-semibold text-fg">Intelligence &amp; APIs</h2>
          </div>

          <div className="space-y-5">
            {/* Gemini Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-fg">Google Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
                >
                  Get a free key at Google AI Studio
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 text-[13px] font-mono bg-subtle/40 border border-border rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-fg-muted hover:text-fg font-medium transition-colors"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={testStatus === "testing"}
                  className="px-3 py-2 text-[12px] font-medium border border-border rounded-md bg-subtle hover:bg-subtle/80 text-fg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testStatus === "testing" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />
                      Testing...
                    </>
                  ) : (
                    "Test Key"
                  )}
                </button>
              </div>

              {testMessage && (
                <div
                  className={`mt-2 p-2.5 rounded-md text-[12px] flex items-center gap-2 ${
                    testStatus === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {testStatus === "success" ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testMessage}</span>
                </div>
              )}

              <p className="text-[11px] text-fg-muted mt-1.5">
                Saved securely in your browser&apos;s local storage. When provided, LeadScout uses Gemini 2.0 Flash for live, unbounded B2B intelligence.
              </p>
            </div>

            {/* Service Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-md border border-border bg-subtle/30 flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-fg-secondary mt-0.5" />
                  <div>
                    <span className="text-[12px] font-medium text-fg block">Jina Reader API</span>
                    <span className="text-[11px] text-fg-muted">Zero-config markdown extraction</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>

              <div className="p-3 rounded-md border border-border bg-subtle/30 flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-fg-secondary mt-0.5" />
                  <div>
                    <span className="text-[12px] font-medium text-fg block">Supabase Storage</span>
                    <span className="text-[11px] text-fg-muted">Cloud DB + Local fallback</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-subtle px-2 py-0.5 rounded border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Local + Sync
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Sender Persona */}
        <section className="bg-surface border border-border rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <User className="w-4 h-4 text-fg" />
            <h2 className="text-[14px] font-semibold text-fg">Outreach Sender Persona</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-fg mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg mb-1">Your Company / Product</label>
                <input
                  type="text"
                  value={settings.senderCompany}
                  onChange={(e) => setSettings({ ...settings, senderCompany: e.target.value })}
                  placeholder="e.g. Acquisition Engine"
                  className="w-full px-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-fg mb-1">Your Title / Role</label>
                <input
                  type="text"
                  value={settings.senderRole}
                  onChange={(e) => setSettings({ ...settings, senderRole: e.target.value })}
                  placeholder="e.g. Head of Growth"
                  className="w-full px-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg mb-1">Default Copy Tone</label>
                <select
                  value={settings.tone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tone: e.target.value as "direct" | "consultative" | "casual",
                    })
                  }
                  className="w-full px-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                >
                  <option value="direct">Direct &amp; Concise (Founder/VP level)</option>
                  <option value="consultative">Consultative &amp; Analytical (Enterprise)</option>
                  <option value="casual">Warm &amp; Casual (Early stage / Network)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-fg mb-1">
                Your Core Value Proposition / Hook
              </label>
              <textarea
                rows={2}
                value={settings.valueProp}
                onChange={(e) => setSettings({ ...settings, valueProp: e.target.value })}
                placeholder="We help B2B SaaS teams cut onboarding friction by 40%..."
                className="w-full px-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors leading-relaxed"
              />
              <p className="text-[11px] text-fg-muted mt-1">
                Injected into outreach messages to replace generic placeholders with your actual offering.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="px-4 py-2 text-[13px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs"
              >
                Save Preferences
              </button>

              {savedFeedback && (
                <span className="text-[12px] text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved successfully
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Section 3: Workspace Data */}
        <section className="bg-surface border border-border rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <Database className="w-4 h-4 text-fg" />
            <h2 className="text-[14px] font-semibold text-fg">Workspace Storage &amp; Exports</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[13px] font-medium text-fg block">
                {leadCount} Researched {leadCount === 1 ? "Company" : "Companies"} in Local Storage
              </span>
              <p className="text-[12px] text-fg-muted mt-0.5">
                Export your research archive or reset local workspace history.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAllJSON}
                disabled={leadCount === 0}
                className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md bg-subtle hover:bg-subtle/80 text-fg transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Export Archive (.json)
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={leadCount === 0}
                className="px-3 py-1.5 text-[12px] font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Local Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
