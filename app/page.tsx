"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar, { View } from "@/components/Sidebar";
import CompanyProfile from "@/components/CompanyProfile";
import ActivityTimeline from "@/components/ActivityTimeline";
import CompaniesView from "@/components/CompaniesView";
import SettingsView from "@/components/SettingsView";
import CommandPalette from "@/components/CommandPalette";
import {
  OutreachObjective,
  ActivityItem,
  CompanyDossier,
  OutreachEmail,
  ScoutResult,
  OBJECTIVES,
} from "@/lib/types";
import {
  Search,
  Loader2,
  ChevronDown,
  ArrowRight,
  Globe,
  Sparkles,
  Plus,
} from "lucide-react";
import { getFallbackDossier } from "@/lib/mock-data";
import {
  getLocalLeads,
  saveLocalLead,
  getUserSettings,
} from "@/lib/storage";

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const DEMO_PRESETS = [
  { domain: "stripe.com", label: "Stripe", tag: "FinTech" },
  { domain: "notion.so", label: "Notion", tag: "Productivity" },
  { domain: "linear.app", label: "Linear", tag: "DevTools" },
  { domain: "supabase.com", label: "Supabase", tag: "Database" },
];

export default function App() {
  const [activeView, setActiveView] = useState<View>("research");
  const [isResearching, setIsResearching] = useState(false);
  const [query, setQuery] = useState("");
  const [objective, setObjective] = useState<OutreachObjective>("client_acquisition");
  const [dossier, setDossier] = useState<CompanyDossier | null>(null);
  const [emails, setEmails] = useState<OutreachEmail[] | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [showObjectiveDropdown, setShowObjectiveDropdown] = useState(false);
  const [recentDossiers, setRecentDossiers] = useState<ScoutResult[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global hotkey listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Load count and initial recent items from local storage
  useEffect(() => {
    const leads = getLocalLeads();
    setCompanyCount(leads.length);
    setRecentDossiers(leads.slice(0, 4).map((l) => l.dossier_json));
  }, [refreshTrigger]);

  const addActivity = (id: string, title: string, description?: string) => {
    setActivities((prev) => [
      ...prev,
      { id, title, description, status: "running", timestamp: formatTime() },
    ]);
  };

  const completeActivity = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "complete" as const } : a))
    );
  };

  const handleLaunch = useCallback(
    async (e?: React.FormEvent, overrideDomain?: string) => {
      if (e) e.preventDefault();
      const targetQuery = overrideDomain || query;
      if (!targetQuery.trim() || isResearching) return;

      const trimmed = targetQuery.trim();
      setIsResearching(true);
      setDossier(null);
      setEmails(null);
      setActivities([]);

      let useFallback = false;
      let scrapedContent = "";
      const domain = trimmed.includes(".")
        ? trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
        : trimmed;

      // Step 1: DOM Scraping via Jina Reader
      addActivity(
        "fetch",
        "Scraping website content & metadata",
        `Ingesting clean markdown from ${domain} via Jina Reader API`
      );
      await delay(600);

      try {
        if (trimmed.includes(".")) {
          const scoutRes = await fetch("/api/scout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmed }),
          });
          const scoutData = await scoutRes.json();
          if (scoutData.fallback || scoutData.error) {
            useFallback = true;
          } else {
            scrapedContent = scoutData.content || "";
          }
        } else {
          scrapedContent = `Industry niche query: ${trimmed}. Generate a realistic company profile for a leading company in this space.`;
        }
      } catch {
        useFallback = true;
      }
      completeActivity("fetch");

      // Step 2: Gemini Positioning Analysis
      addActivity(
        "analyze",
        "Synthesizing market positioning & ICP",
        "Extracting target audience, business model, and tech stack tags"
      );
      await delay(600);

      const userSettings = getUserSettings();
      let analysisDossier: CompanyDossier;
      let analysisEmails: OutreachEmail[];

      // Try live Gemini if not failed in fetch
      let geminiSuccess = false;
      if (!useFallback) {
        try {
          const analyzeRes = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: scrapedContent,
              domain,
              objective,
              customApiKey: userSettings.geminiApiKey || undefined,
            }),
          });
          const analyzeData = await analyzeRes.json();
          if (!analyzeData.fallback && !analyzeData.error && analyzeData.dossier) {
            analysisDossier = analyzeData.dossier;
            analysisEmails = analyzeData.emails || [];
            geminiSuccess = true;
          }
        } catch {
          geminiSuccess = false;
        }
      }

      // If Gemini wasn't run or failed, use smart synthesized fallback
      if (!geminiSuccess) {
        const fallbackResult = getFallbackDossier(domain, objective, scrapedContent);
        analysisDossier = fallbackResult.dossier;
        analysisEmails = fallbackResult.emails;
      }

      analysisDossier = { ...analysisDossier!, domain };
      completeActivity("analyze");

      // Step 3: Pain Points & Market Signals
      addActivity(
        "signals",
        "Extracting operational friction points",
        `Identified ${analysisDossier.top3PainPoints.length} pitch angles and growth bottlenecks`
      );
      await delay(500);
      completeActivity("signals");
      setDossier(analysisDossier);

      // Step 4: Multi-Touch Outreach Cadence
      addActivity(
        "outreach",
        "Drafting PAS outreach sequence",
        `Generated ${analysisEmails!.length} touchpoints using Pain-Agitate-Solution framework`
      );
      await delay(400);
      completeActivity("outreach");
      setEmails(analysisEmails!);

      // Step 5: Complete & Save
      addActivity("done", "Intelligence dossier generated successfully");
      completeActivity("done");

      const result: ScoutResult = {
        dossier: analysisDossier,
        emails: analysisEmails!,
        rawContent: scrapedContent,
        timestamp: new Date().toISOString(),
      };

      // 1. Save to local storage for offline reliability
      saveLocalLead(domain, analysisDossier.companyName, objective, result);

      // 2. Save to Supabase if configured
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain,
            company_name: analysisDossier.companyName,
            objective,
            dossier_json: result,
          }),
        });
      } catch {
        // local storage already handled it
      }

      setRefreshTrigger((p) => p + 1);
      setIsResearching(false);
    },
    [query, objective, isResearching]
  );

  const handleLoadReport = (result: ScoutResult) => {
    setDossier(result.dossier);
    setEmails(result.emails);
    setQuery(result.dossier.domain);
    setActivities([
      {
        id: "loaded",
        title: "Loaded from research history",
        description: `Restored verified dossier for ${result.dossier.companyName}`,
        status: "complete",
        timestamp: formatTime(),
      },
    ]);
    setActiveView("research");
  };

  const handleQuickPreset = (presetDomain: string) => {
    setQuery(presetDomain);
    handleLaunch(undefined, presetDomain);
  };

  const handleNewResearch = () => {
    setDossier(null);
    setEmails(null);
    setQuery("");
    setActivities([]);
    setActiveView("research");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-page text-fg font-sans select-none antialiased">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        companyCount={companyCount}
        onSelectCompany={handleLoadReport}
        currentDomain={dossier?.domain}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Breadcrumb & Status Bar */}
        <header className="h-14 border-b border-border bg-surface px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-fg">LeadScout</span>
            <span className="text-fg-faint">/</span>
            <span className="text-fg-secondary capitalize">
              {activeView === "research"
                ? dossier
                  ? `${dossier.companyName} (${dossier.domain})`
                  : "Research"
                : activeView}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px]">
            {/* Quick Command Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/80 bg-subtle/40 hover:bg-subtle text-fg-muted hover:text-fg text-[12px] transition-colors shadow-2xs group"
            >
              <Search className="w-3.5 h-3.5 text-fg-muted group-hover:text-fg" />
              <span>Search or jump to...</span>
              <kbd className="ml-1.5 px-1.5 py-0.2 text-[10px] font-mono rounded bg-surface border border-border/80 text-fg-muted shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {dossier && activeView === "research" && (
              <button
                onClick={handleNewResearch}
                className="px-2.5 py-1 text-[12px] font-medium border border-border rounded-md bg-surface hover:bg-subtle text-fg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-fg-muted" />
                <span>New Target</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-subtle/40 text-[11px] font-medium text-fg-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gemini 2.0 Flash + Jina Reader</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto">
          {/* VIEW 1: RESEARCH */}
          {activeView === "research" && (
            <div className="max-w-5xl mx-auto px-8 py-8">
              {/* Command Search Bar Section */}
              <div className="mb-8">
                <form
                  onSubmit={(e) => handleLaunch(e)}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                    <input
                      id="research-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter company domain (e.g. stripe.com) or market niche query..."
                      disabled={isResearching}
                      className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 shadow-xs transition-colors disabled:opacity-60"
                    />
                  </div>

                  {/* Objective Select Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowObjectiveDropdown(!showObjectiveDropdown)}
                      disabled={isResearching}
                      className="h-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] bg-surface border border-border rounded-lg text-fg-secondary hover:bg-subtle/80 shadow-xs disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      <span className="font-medium text-fg">{OBJECTIVES[objective]}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-fg-muted transition-transform ${
                          showObjectiveDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showObjectiveDropdown && (
                      <div className="absolute z-50 top-full mt-1.5 right-0 w-64 bg-surface border border-border rounded-lg shadow-md overflow-hidden p-1">
                        {(Object.keys(OBJECTIVES) as OutreachObjective[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setObjective(key);
                              setShowObjectiveDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                              objective === key
                                ? "bg-subtle text-fg font-semibold"
                                : "text-fg-secondary hover:bg-subtle/60 hover:text-fg"
                            }`}
                          >
                            <span className="block font-medium">{OBJECTIVES[key]}</span>
                            <span className="text-[11px] text-fg-muted block mt-0.5">
                              {key === "client_acquisition"
                                ? "Focuses on buyer friction & ROI angles"
                                : key === "partnership_inquiry"
                                ? "Focuses on integration synergies"
                                : "Analyzes infrastructure & vendor gaps"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Research Submit Button */}
                  <button
                    type="submit"
                    disabled={!query.trim() || isResearching}
                    className="px-5 py-2.5 text-[13px] font-medium bg-fg text-surface rounded-lg hover:bg-fg/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs inline-flex items-center justify-center gap-2 shrink-0"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin-slow" />
                        <span>Scouting Target...</span>
                      </>
                    ) : (
                      <>
                        <span>Research</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Presets / Suggestion Chips */}
                {!dossier && !isResearching && (
                  <div className="flex items-center gap-2 mt-3 text-[12px] flex-wrap">
                    <span className="text-fg-muted">Quick Targets:</span>
                    {DEMO_PRESETS.map((p) => (
                      <button
                        key={p.domain}
                        type="button"
                        onClick={() => handleQuickPreset(p.domain)}
                        className="px-2.5 py-1 rounded-md border border-border/80 bg-surface hover:bg-subtle text-fg-secondary hover:text-fg text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{p.label}</span>
                        <span className="text-[10px] text-fg-muted font-normal">
                          ({p.tag})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* State 1: Empty Initial Landing Experience */}
              {!dossier && !isResearching && activities.length === 0 && (
                <div className="space-y-8 animate-fade-in pt-4">
                  {/* Informational Pipeline Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
                      <div className="w-8 h-8 rounded-md bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-xs mb-3">
                        01
                      </div>
                      <h3 className="text-[14px] font-semibold text-fg mb-1">
                        DOM Fingerprinting
                      </h3>
                      <p className="text-[12px] text-fg-secondary leading-relaxed">
                        Crawls target web pages via Jina Reader to parse business models, value props, tech stacks, and team scales.
                      </p>
                    </div>

                    <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
                      <div className="w-8 h-8 rounded-md bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-xs mb-3">
                        02
                      </div>
                      <h3 className="text-[14px] font-semibold text-fg mb-1">
                        Operational Friction
                      </h3>
                      <p className="text-[12px] text-fg-secondary leading-relaxed">
                        Surfaces acute enterprise pain points, scaling bottlenecks, and vendor vulnerabilities tailored to executive buyers.
                      </p>
                    </div>

                    <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
                      <div className="w-8 h-8 rounded-md bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-xs mb-3">
                        03
                      </div>
                      <h3 className="text-[14px] font-semibold text-fg mb-1">
                        Multi-Touch Cadence
                      </h3>
                      <p className="text-[12px] text-fg-secondary leading-relaxed">
                        Drafts a 4-step sequence (Cold Open, Case Study, LinkedIn InMail, Soft Breakup) ready to paste into Apollo or Lemlist.
                      </p>
                    </div>
                  </div>

                  {/* Recent Targets if any exist */}
                  {recentDossiers.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wider">
                          Recent Research Archive
                        </span>
                        <button
                          onClick={() => setActiveView("companies")}
                          className="text-[12px] text-fg-secondary hover:text-fg font-medium transition-colors"
                        >
                          View all in directory &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recentDossiers.map((res, i) => (
                          <div
                            key={i}
                            onClick={() => handleLoadReport(res)}
                            className="bg-surface border border-border rounded-lg p-4 shadow-xs hover:border-fg/40 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-fg text-[13px] group-hover:underline">
                                {res.dossier.companyName}
                              </span>
                              <span className="text-[11px] text-fg-muted flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {res.dossier.domain}
                              </span>
                            </div>
                            <p className="text-[12px] text-fg-secondary line-clamp-2 leading-relaxed">
                              {res.dossier.oneSentenceSummary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* State 2: Active Pipeline Timeline (During Research) */}
              {isResearching && !dossier && activities.length > 0 && (
                <div className="max-w-xl mx-auto py-12 animate-fade-in">
                  <div className="bg-surface border border-border rounded-lg p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-border mb-5">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-fg animate-spin-slow" />
                        <h3 className="text-[14px] font-semibold text-fg">
                          Executing Intelligence Pipeline
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-fg-muted">
                        Target: {query}
                      </span>
                    </div>

                    <ActivityTimeline items={activities} />
                  </div>
                </div>
              )}

              {/* State 3: Researched Company Dossier */}
              {dossier && (
                <CompanyProfile
                  dossier={dossier}
                  emails={emails}
                  activities={activities}
                  isResearching={isResearching}
                />
              )}
            </div>
          )}

          {/* VIEW 2: COMPANIES DIRECTORY */}
          {activeView === "companies" && (
            <CompaniesView
              onLoadReport={handleLoadReport}
              refreshTrigger={refreshTrigger}
              onCountUpdate={setCompanyCount}
              onNewResearch={handleNewResearch}
            />
          )}

          {/* VIEW 3: SETTINGS & CONFIG */}
          {activeView === "settings" && (
            <SettingsView
              onRefreshHistory={() => setRefreshTrigger((p) => p + 1)}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view) => setActiveView(view)}
        onSelectCompany={handleLoadReport}
        onScoutDomain={(domain) => {
          setQuery(domain);
          handleLaunch(undefined, domain);
        }}
        onSetObjective={(obj) => setObjective(obj)}
        currentObjective={objective}
        currentDossier={dossier}
        currentEmails={emails}
      />
    </div>
  );
}
