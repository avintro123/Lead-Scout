"use client";

import { useState, useMemo } from "react";
import {
  Swords,
  Shield,
  Zap,
  Copy,
  Check,
  Printer,
  Download,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  FileText,
  Lightbulb,
  ExternalLink,
  Send,
  Volume2,
  RefreshCw,
  Clock,
  Briefcase,
  Code2,
  TrendingUp,
} from "lucide-react";
import {
  CompanyDossier,
  SalesPlaybook,
  ObjectionRebuttal,
  DiscoveryQuestion,
  CompetitorTrap,
  ColdCallHook,
  ObjectionCategory,
  DiscoveryFramework,
} from "@/lib/types";
import {
  generateSalesPlaybook,
  generatePlaybookMarkdownCheatSheet,
} from "@/lib/sales-playbook";
import { getUserSettings } from "@/lib/storage";

interface SalesBattlecardPlaybookProps {
  dossier: CompanyDossier;
}

type SubTab = "objections" | "discovery" | "competitors" | "hooks" | "ai_solver";

export default function SalesBattlecardPlaybook({
  dossier,
}: SalesBattlecardPlaybookProps) {
  const settings = getUserSettings();

  // Generate or use pre-existing playbook
  const playbook: SalesPlaybook = useMemo(() => {
    return (
      dossier.salesPlaybook ||
      generateSalesPlaybook(
        dossier,
        settings.senderName,
        settings.senderCompany
      )
    );
  }, [dossier, settings]);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("objections");

  // Objection state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedObjectionId, setExpandedObjectionId] = useState<string>(
    playbook.topObjections[0]?.id || ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Discovery state
  const [selectedFramework, setSelectedFramework] = useState<DiscoveryFramework | "ALL">("ALL");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Competitor state
  const [selectedCompetitorIdx, setSelectedCompetitorIdx] = useState(0);

  // Hook state
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState(0);

  // Live AI Solver state
  const [customObjectionInput, setCustomObjectionInput] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customRebuttal, setCustomRebuttal] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Cheat Sheet Modal state
  const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCheatSheet = () => {
    const markdown = generatePlaybookMarkdownCheatSheet(playbook, dossier);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-sales-cheat-sheet.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateCustomRebuttal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customObjectionInput.trim() || isGeneratingAi) return;

    setIsGeneratingAi(true);
    setAiError(null);
    setCustomRebuttal(null);

    try {
      const res = await fetch("/api/objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objection: customObjectionInput.trim(),
          companyName: dossier.companyName,
          domain: dossier.domain,
          primaryPainPoint: dossier.top3PainPoints?.[0],
          industry: dossier.industryTags?.[0],
          competitor: dossier.competitors?.[0]?.name,
          customApiKey: settings.geminiApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate rebuttal");
      }

      const data = await res.json();
      if (data.rebuttal) {
        setCustomRebuttal(data.rebuttal);
      } else {
        throw new Error("No rebuttal returned from model");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to contact AI objection engine");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Filtered objections
  const filteredObjections = useMemo(() => {
    if (selectedCategory === "all") return playbook.topObjections;
    return playbook.topObjections.filter((o) => o.category === selectedCategory);
  }, [playbook.topObjections, selectedCategory]);

  // Filtered discovery questions
  const filteredQuestions = useMemo(() => {
    if (selectedFramework === "ALL") return playbook.discoveryQuestions;
    return playbook.discoveryQuestions.filter((q) => q.framework === selectedFramework);
  }, [playbook.discoveryQuestions, selectedFramework]);

  const activeCompetitor =
    playbook.competitorTraps[selectedCompetitorIdx] || playbook.competitorTraps[0];

  const activeHook =
    playbook.coldCallHooks[selectedPersonaIdx] || playbook.coldCallHooks[0];

  return (
    <div className="space-y-6">
      {/* Top Banner / Value Proposition */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Swords className="w-4 h-4" />
              </span>
              <h2 className="text-base font-semibold text-fg tracking-tight">
                AI Sales Battlecard & Objection Playbook
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-subtle text-fg-secondary border border-border">
                {dossier.companyName}
              </span>
            </div>
            <p className="text-[13px] text-fg-secondary leading-relaxed">
              Tactical discovery questions, 3-step objection rebuttals, and competitor traps engineered for high-stake discovery calls.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCheatSheetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-subtle text-[12px] font-medium text-fg transition-colors shadow-2xs"
              title="Preview and print complete call cheat sheet"
            >
              <Printer className="w-3.5 h-3.5 text-fg-muted" />
              <span>Cheat Sheet</span>
            </button>

            <button
              onClick={handleDownloadCheatSheet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fg text-surface text-[12px] font-medium hover:bg-fg/90 transition-colors shadow-xs"
              title="Download Markdown call battlecard"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
          </div>
        </div>

        {/* Why We Win Elevator Pitch Banner */}
        <div className="mt-4 p-3.5 rounded-lg bg-subtle/50 border border-border/80 flex items-start gap-3">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-fg leading-relaxed">
            <span className="font-semibold text-fg">Core Winning Wedge: </span>
            <span>{playbook.whyWeWinElevatorPitch}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("objections")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "objections"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-fg-secondary hover:text-fg hover:border-border"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Top 6 Objection Rebuttals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-subtle border border-border text-fg-muted font-mono">
            {playbook.topObjections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("discovery")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "discovery"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-fg-secondary hover:text-fg hover:border-border"
          }`}
        >
          <Target className="w-4 h-4 text-blue-500" />
          <span>Discovery Playbook (SPIN & MEDDIC)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-subtle border border-border text-fg-muted font-mono">
            {playbook.discoveryQuestions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("competitors")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "competitors"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-fg-secondary hover:text-fg hover:border-border"
          }`}
        >
          <Swords className="w-4 h-4 text-purple-500" />
          <span>Competitor Traps & Landmines</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-subtle border border-border text-fg-muted font-mono">
            {playbook.competitorTraps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("hooks")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "hooks"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-fg-secondary hover:text-fg hover:border-border"
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-500" />
          <span>Cold Call Hooks (30s)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-subtle border border-border text-fg-muted font-mono">
            {playbook.coldCallHooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("ai_solver")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "ai_solver"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-fg-secondary hover:text-fg hover:border-border"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Live AI Objection Solver</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
            Realtime
          </span>
        </button>
      </div>

      {/* ─── TAB 1: TOP 6 OBJECTION REBUTTALS ─────────────────────────────── */}
      {activeSubTab === "objections" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider mr-1">
              Filter:
            </span>
            {[
              { id: "all", label: "All Objections" },
              { id: "budget", label: "Budget & ROI" },
              { id: "competitor", label: "Competitor Lock-in" },
              { id: "inhouse", label: "In-House Bias" },
              { id: "general", label: "Send Info / Brush-off" },
              { id: "timing", label: "Roadmap Timing" },
              { id: "authority", label: "Contract Renewal" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-fg text-surface"
                    : "bg-surface border border-border text-fg-secondary hover:text-fg hover:bg-subtle"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Objections Accordion / Card List */}
          <div className="space-y-3.5">
            {filteredObjections.map((obj, idx) => {
              const isExpanded = expandedObjectionId === obj.id;
              return (
                <div
                  key={obj.id}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "bg-surface border-border shadow-sm ring-1 ring-border/50"
                      : "bg-surface border-border hover:border-border/80"
                  }`}
                >
                  {/* Header / Click to Toggle */}
                  <div
                    onClick={() =>
                      setExpandedObjectionId(isExpanded ? "" : obj.id)
                    }
                    className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none hover:bg-subtle/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-subtle border border-border flex items-center justify-center text-[11px] font-mono font-semibold text-fg-secondary shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-subtle text-fg-secondary border border-border/80">
                            {obj.categoryLabel}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-fg mt-1">
                          &ldquo;{obj.objection}&rdquo;
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(obj.voiceScript, obj.id);
                        }}
                        className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-subtle border border-transparent hover:border-border transition-colors"
                        title="Copy voice script"
                      >
                        {copiedId === obj.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="text-fg-muted p-1"
                        aria-label="Expand objection details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border/60 animate-fade-in">
                      {/* Psychological Root */}
                      <div className="text-[12px] text-fg-secondary bg-subtle/40 p-3 rounded-lg border border-border/60 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-fg">Psychology Behind the Pushback: </span>
                          <span>{obj.psychologicalRoot}</span>
                        </div>
                      </div>

                      {/* Complete Voice Script (Teleprompter view) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Word-for-Word Voice Script</span>
                          </span>
                          <button
                            onClick={() => handleCopy(obj.voiceScript, `voice_${obj.id}`)}
                            className="text-[11px] font-medium text-fg-secondary hover:text-fg inline-flex items-center gap-1"
                          >
                            {copiedId === `voice_${obj.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied Voice Script</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Script</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 rounded-lg bg-surface border-2 border-emerald-500/30 text-[13.5px] text-fg leading-relaxed font-sans shadow-2xs select-text">
                          &ldquo;{obj.voiceScript}&rdquo;
                        </div>
                      </div>

                      {/* 3-Step Counter-Framing Architecture */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted block">
                          3-Step Objection Pivot Architecture
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Step 1: Acknowledge */}
                          <div className="p-3 rounded-lg bg-subtle/40 border border-border space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Step 1 · Disarm
                            </span>
                            <p className="text-[12px] text-fg leading-relaxed">
                              {obj.steps.acknowledge}
                            </p>
                          </div>

                          {/* Step 2: Reframe */}
                          <div className="p-3 rounded-lg bg-subtle/40 border border-border space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              Step 2 · Reframe Wedge
                            </span>
                            <p className="text-[12px] text-fg leading-relaxed">
                              {obj.steps.reframe}
                            </p>
                          </div>

                          {/* Step 3: Low-Friction Pivot */}
                          <div className="p-3 rounded-lg bg-subtle/40 border border-border space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              Step 3 · Soft Pivot Ask
                            </span>
                            <p className="text-[12px] text-fg leading-relaxed">
                              {obj.steps.pivot}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Trap Question & Coach Tip */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-subtle border border-border text-[12px]">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-fg">Trap Question to Flip Burden: </span>
                            <span className="text-fg-secondary italic">{obj.trapQuestion}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(obj.trapQuestion, `trap_${obj.id}`)}
                          className="shrink-0 px-2.5 py-1 text-[11px] font-medium bg-surface border border-border rounded text-fg hover:bg-subtle transition-colors"
                        >
                          {copiedId === `trap_${obj.id}` ? "Copied" : "Copy Trap"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DISCOVERY PLAYBOOK (SPIN & MEDDIC) ──────────────────── */}
      {activeSubTab === "discovery" && (
        <div className="space-y-4">
          {/* Framework Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider mr-1">
                Framework:
              </span>
              {(["ALL", "SPIN", "MEDDIC"] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    selectedFramework === fw
                      ? "bg-fg text-surface"
                      : "bg-surface border border-border text-fg-secondary hover:text-fg hover:bg-subtle"
                  }`}
                >
                  {fw === "ALL" ? "All Discovery Questions" : `${fw} Framework`}
                </button>
              ))}
            </div>

            <span className="text-[12px] text-fg-muted">
              Showing {filteredQuestions.length} tailored discovery prompts
            </span>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-border/80 transition-all"
                >
                  <div className="space-y-2.5">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            q.framework === "SPIN"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300"
                              : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300"
                          }`}
                        >
                          {q.framework} · {q.stage}
                        </span>
                        <span className="text-[11px] text-fg-muted">
                          {q.targetPersona}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(q.question, q.id)}
                        className="p-1 rounded text-fg-muted hover:text-fg hover:bg-subtle transition-colors"
                        title="Copy question"
                      >
                        {copiedId === q.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Question Itself */}
                    <p className="text-[13.5px] font-semibold text-fg leading-relaxed">
                      &ldquo;{q.question}&rdquo;
                    </p>

                    {/* Rationale */}
                    <p className="text-[12px] text-fg-secondary leading-relaxed">
                      <span className="font-medium text-fg">Objective: </span>
                      {q.rationale}
                    </p>
                  </div>

                  {/* Listen-For Toggle */}
                  <div className="pt-2 border-t border-border/60">
                    <button
                      onClick={() =>
                        setExpandedQuestionId(isExpanded ? null : q.id)
                      }
                      className="text-[11px] font-semibold text-fg-muted hover:text-fg flex items-center justify-between w-full"
                    >
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-fg-muted" />
                        <span>What to Listen For (Red & Green Flags)</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-2 text-[11.5px] animate-fade-in">
                        {/* Green flags */}
                        <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 space-y-1">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Buy Signals (Green Flags):</span>
                          </span>
                          <ul className="space-y-0.5 text-fg leading-relaxed pl-4 list-disc">
                            {q.listenFor.greenFlags.map((flag, fIdx) => (
                              <li key={fIdx}>{flag}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Red flags */}
                        <div className="p-2 rounded bg-subtle border border-border space-y-1">
                          <span className="font-semibold text-fg-secondary flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-fg-muted" />
                            <span>Risk Warnings (Red Flags):</span>
                          </span>
                          <ul className="space-y-0.5 text-fg-secondary leading-relaxed pl-4 list-disc">
                            {q.listenFor.redFlags.map((flag, fIdx) => (
                              <li key={fIdx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPETITOR TRAPS & LANDMINES ──────────────────────────── */}
      {activeSubTab === "competitors" && (
        <div className="space-y-6">
          {/* Competitor Selector Pills */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block">
              Select Competitor Matchup:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {playbook.competitorTraps.map((comp, idx) => {
                const isSelected = selectedCompetitorIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCompetitorIdx(idx)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "bg-surface border-fg shadow-xs ring-1 ring-fg/20"
                        : "bg-surface border-border hover:border-border/80 hover:bg-subtle/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-fg">
                        {comp.competitorName}
                      </span>
                      {comp.competitorDomain && (
                        <span className="text-[10px] font-mono text-fg-muted">
                          {comp.competitorDomain}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-fg-secondary block truncate">
                      Wedge: {comp.wedgeAngle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Competitor Trap Deep Dive */}
          {activeCompetitor && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                    <Swords className="w-4 h-4 text-purple-500" />
                    <span>Laying Landmines Against {activeCompetitor.competitorName}</span>
                  </h3>
                  <p className="text-[12px] text-fg-muted mt-0.5">
                    How to expose {activeCompetitor.competitorName}&apos;s architectural vulnerability without badmouthing them.
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `Landmine Question:\n"${activeCompetitor.landmineQuestion}"\n\nKill Point:\n${activeCompetitor.killPoint}`,
                      "comp_trap"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-lg bg-surface hover:bg-subtle text-fg"
                >
                  {copiedId === "comp_trap" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Script</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-fg-muted" />
                      <span>Copy Landmine</span>
                    </>
                  )}
                </button>
              </div>

              {/* The Landmine Question */}
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                  💣 The Subtle Landmine Question to Ask:
                </span>
                <p className="text-[14px] font-semibold text-fg leading-relaxed">
                  &ldquo;{activeCompetitor.landmineQuestion}&rdquo;
                </p>
                <p className="text-[12px] text-fg-secondary">
                  <strong>Why it works:</strong> Forces the prospect to calculate the internal friction or maintenance delay of {activeCompetitor.competitorName} on their own terms.
                </p>
              </div>

              {/* Kill Point & Vulnerability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-subtle/50 border border-border space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted block">
                    ⚡ Kill Point (The Knockout Fact)
                  </span>
                  <p className="text-[13px] text-fg font-medium leading-relaxed">
                    {activeCompetitor.killPoint}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-subtle/50 border border-border space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted block">
                    🛡️ Your Unfair Wedge
                  </span>
                  <p className="text-[13px] text-fg font-medium leading-relaxed">
                    {activeCompetitor.wedgeAngle}
                  </p>
                </div>
              </div>

              {/* Where they stumble */}
              <div className="p-3.5 rounded-lg bg-subtle border border-border text-[12.5px] text-fg-secondary leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-fg-muted shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-fg">Competitor Vulnerability: </span>
                  <span>{activeCompetitor.whereTheyFail}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: COLD CALL HOOKS (30s) ─────────────────────────────────── */}
      {activeSubTab === "hooks" && (
        <div className="space-y-6">
          {/* Persona Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {playbook.coldCallHooks.map((hook, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPersonaIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedPersonaIdx === idx
                    ? "bg-fg text-surface"
                    : "bg-surface border border-border text-fg-secondary hover:text-fg hover:bg-subtle"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{hook.personaRole}</span>
              </button>
            ))}
          </div>

          {/* Persona Script Card */}
          {activeHook && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Volume2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-fg">
                      30-Second Cold Call Hook for {activeHook.personaRole}
                    </h3>
                    <p className="text-[11.5px] text-fg-muted">
                      Engineered to break pattern, lower defensiveness, and earn 5 minutes.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `${activeHook.patternInterrupt}\n\n${activeHook.hookScript}\n\n${activeHook.elevatorPitch}\n\n${activeHook.softAsk}`,
                      "call_hook"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-lg bg-surface hover:bg-subtle text-fg"
                >
                  {copiedId === "call_hook" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Script</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-fg-muted" />
                      <span>Copy Full Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* 4 Steps of the Cold Call */}
              <div className="space-y-4">
                {/* 1. Pattern Interrupt */}
                <div className="p-3.5 rounded-lg bg-subtle/50 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Phase 1 · 5s Pattern Interrupt
                  </span>
                  <p className="text-[13px] text-fg italic font-medium">
                    {activeHook.patternInterrupt}
                  </p>
                </div>

                {/* 2. Personalized Context */}
                <div className="p-3.5 rounded-lg bg-subtle/50 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Phase 2 · 10s Acute Pain Observation
                  </span>
                  <p className="text-[13px] text-fg leading-relaxed">
                    {activeHook.hookScript}
                  </p>
                </div>

                {/* 3. Elevator Value Pitch */}
                <div className="p-3.5 rounded-lg bg-subtle/50 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Phase 3 · 10s Quantifiable Outcome
                  </span>
                  <p className="text-[13px] text-fg leading-relaxed font-semibold">
                    {activeHook.elevatorPitch}
                  </p>
                </div>

                {/* 4. Soft Low-Friction Ask */}
                <div className="p-3.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Phase 4 · 5s Soft Pivot Question (Not a hard sales pitch)
                  </span>
                  <p className="text-[13.5px] text-fg font-medium">
                    {activeHook.softAsk}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: LIVE AI OBJECTION SOLVER ──────────────────────────────── */}
      {activeSubTab === "ai_solver" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-fg">
                  Real-Time AI Objection Solver
                </h3>
              </div>
              <p className="text-[12.5px] text-fg-secondary mt-1">
                Enter any unexpected objection or pushback you just heard from a lead at {dossier.companyName}. Gemini will generate an instant 3-step counter-framing script.
              </p>
            </div>

            <form onSubmit={handleGenerateCustomRebuttal} className="space-y-3">
              <div className="relative">
                <textarea
                  value={customObjectionInput}
                  onChange={(e) => setCustomObjectionInput(e.target.value)}
                  placeholder={`e.g. "We're currently restructuring our tech team after layoffs so all new software purchases are completely frozen."`}
                  rows={3}
                  className="w-full text-[13px] bg-subtle/50 border border-border rounded-lg p-3 text-fg placeholder:text-fg-muted focus:outline-hidden focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-fg-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Personalized against {dossier.companyName}&apos;s profile</span>
                </div>

                <button
                  type="submit"
                  disabled={!customObjectionInput.trim() || isGeneratingAi}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fg text-surface text-[12px] font-semibold hover:bg-fg/90 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Killer Rebuttal...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Solve Objection</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {aiError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-[12px] border border-rose-200">
                {aiError}
              </div>
            )}

            {/* Generated Rebuttal Output */}
            {customRebuttal && (
              <div className="mt-5 p-5 rounded-xl bg-subtle/40 border border-border space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-border/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AI-Engineered Counter-Script</span>
                  </span>

                  <button
                    onClick={() =>
                      handleCopy(customRebuttal.voiceScript, "custom_voice")
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-border rounded bg-surface hover:bg-subtle text-fg"
                  >
                    {copiedId === "custom_voice" ? "Copied" : "Copy Voice Script"}
                  </button>
                </div>

                {/* Psychological Root */}
                {customRebuttal.psychologicalRoot && (
                  <div className="text-[12px] text-fg-secondary flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Why they said this:</strong> {customRebuttal.psychologicalRoot}
                    </span>
                  </div>
                )}

                {/* Voice Script */}
                <div className="p-4 rounded-lg bg-surface border-2 border-emerald-500/30 text-[13.5px] text-fg leading-relaxed font-sans shadow-2xs select-text">
                  &ldquo;{customRebuttal.voiceScript}&rdquo;
                </div>

                {/* 3 Steps */}
                {customRebuttal.steps && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded bg-surface border border-border space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-blue-600">
                        1. Acknowledge
                      </span>
                      <p className="text-[11.5px] text-fg">
                        {customRebuttal.steps.acknowledge}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-surface border border-border space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-purple-600">
                        2. Reframe
                      </span>
                      <p className="text-[11.5px] text-fg">
                        {customRebuttal.steps.reframe}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-surface border border-border space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-emerald-600">
                        3. Pivot
                      </span>
                      <p className="text-[11.5px] text-fg">
                        {customRebuttal.steps.pivot}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trap question */}
                {customRebuttal.trapQuestion && (
                  <div className="p-3 rounded bg-surface border border-border text-[12px] flex items-center justify-between gap-3">
                    <span className="italic text-fg font-medium">
                      &ldquo;{customRebuttal.trapQuestion}&rdquo;
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(customRebuttal.trapQuestion, "custom_trap")
                      }
                      className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border border-border hover:bg-subtle"
                    >
                      {copiedId === "custom_trap" ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: PRINTABLE CALL CHEAT SHEET ────────────────────────────── */}
      {showCheatSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-fg" />
                <h3 className="text-sm font-semibold text-fg">
                  Executive Call Cheat Sheet: {dossier.companyName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 text-[12px] font-medium rounded-md bg-fg text-surface hover:bg-fg/90"
                >
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowCheatSheetModal(false)}
                  className="p-1 rounded text-fg-muted hover:text-fg text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-[12.5px] text-fg leading-relaxed">
              <div className="border-b border-border pb-3">
                <h1 className="text-lg font-bold text-fg">
                  {dossier.companyName} Call Battlecard
                </h1>
                <p className="text-fg-muted text-[11.5px]">
                  Domain: {dossier.domain} | Scale: {dossier.estimatedHeadcount} | Business Model: {dossier.estimatedBusinessModel}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-fg uppercase text-[11px] tracking-wider mb-1">
                  1. Core Elevator Pitch & Wedge
                </h4>
                <p className="bg-subtle p-3 rounded border border-border">
                  {playbook.whyWeWinElevatorPitch}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-fg uppercase text-[11px] tracking-wider mb-2">
                  2. Top 5 Objection Voice Scripts
                </h4>
                <div className="space-y-3">
                  {playbook.topObjections.slice(0, 5).map((obj, i) => (
                    <div key={i} className="p-3 rounded border border-border bg-subtle/30 space-y-1">
                      <span className="font-bold text-fg block text-[12px]">
                        &ldquo;{obj.objection}&rdquo;
                      </span>
                      <p className="text-[12px] text-fg italic">&ldquo;{obj.voiceScript}&rdquo;</p>
                      <p className="text-[11px] text-fg-muted">
                        <strong>Trap Question:</strong> {obj.trapQuestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-fg uppercase text-[11px] tracking-wider mb-2">
                  3. SPIN & MEDDIC Discovery Highlights
                </h4>
                <ul className="space-y-1.5 list-disc pl-4 text-[12px]">
                  {playbook.discoveryQuestions.slice(0, 6).map((q, i) => (
                    <li key={i}>
                      <strong>[{q.framework} - {q.stage}]:</strong> {q.question}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
