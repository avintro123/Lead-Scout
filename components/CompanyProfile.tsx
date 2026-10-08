"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Users,
  Copy,
  Check,
  ExternalLink,
  Download,
  Sparkles,
  ArrowRight,
  Code2,
  Mail,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Table,
  FileSpreadsheet,
  Swords,
  ShieldCheck,
  AlertCircle,
  Zap,
  Target,
  MessageSquareQuote,
  Printer,
} from "lucide-react";
import { CompanyDossier, OutreachEmail, ActivityItem, CompetitorItem, BattlecardSummary } from "@/lib/types";
import ActivityTimeline from "./ActivityTimeline";
import ExecutiveBriefModal from "./ExecutiveBriefModal";
import IcpScoringCard from "./IcpScoringCard";
import { calculateIcpScore, getTierBadgeStyle } from "@/lib/icp-scorer";
import { getUserSettings } from "@/lib/storage";
import { getFallbackDossier } from "@/lib/mock-data";
import {
  generateSingleCompanyCSV,
  triggerCSVDownload,
  generateSubjectLineVariations,
  SubjectVariation,
} from "@/lib/export-csv";

type ProfileTab = "overview" | "signals" | "outreach" | "battlecards" | "tech" | "activity";

interface CompanyProfileProps {
  dossier: CompanyDossier;
  emails: OutreachEmail[] | null;
  activities: ActivityItem[];
  isResearching: boolean;
  onOpenSettings?: () => void;
}

function CopyBtn({
  text,
  label = "Copy",
  variant = "ghost",
}: {
  text: string;
  label?: string;
  variant?: "ghost" | "solid";
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (variant === "solid") {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? "Copied!" : label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] text-fg-secondary hover:text-fg rounded-md transition-colors hover:bg-subtle border border-border/80 bg-surface"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-fg-muted" />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

export default function CompanyProfile({
  dossier,
  emails,
  activities,
  isResearching,
  onOpenSettings,
}: CompanyProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [activeEmailIdx, setActiveEmailIdx] = useState(0);
  const [personalize, setPersonalize] = useState(true);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);

  const [selectedCompetitorIdx, setSelectedCompetitorIdx] = useState(0);

  // Editable sequence state
  const [currentEmails, setCurrentEmails] = useState<OutreachEmail[]>(emails || []);

  useEffect(() => {
    if (emails) {
      setCurrentEmails(emails);
    }
  }, [emails]);

  const settings = getUserSettings();

  // Deterministic ICP Qualification Score
  const icpScore = useMemo(
    () => calculateIcpScore(dossier, settings),
    [dossier, settings]
  );
  const tierStyle = getTierBadgeStyle(icpScore.tier);


  // If research finishes while on activity tab, auto switch to overview
  useEffect(() => {
    if (!isResearching && activeTab === "activity" && activities.length > 0) {
      const timer = setTimeout(() => setActiveTab("overview"), 400);
      return () => clearTimeout(timer);
    }
  }, [isResearching, activeTab, activities.length]);

  const updateCurrentEmail = (field: "subject" | "body", value: string) => {
    setCurrentEmails((prev) =>
      prev.map((e, idx) => (idx === activeEmailIdx ? { ...e, [field]: value } : e))
    );
  };

  const handleRevertCurrentEmail = () => {
    if (!emails || !emails[activeEmailIdx]) return;
    updateCurrentEmail("subject", emails[activeEmailIdx].subject);
    updateCurrentEmail("body", emails[activeEmailIdx].body);
  };

  const handleApplySubjectVariation = (variation: SubjectVariation) => {
    updateCurrentEmail("subject", variation.subject);
    setShowVariations(false);
  };

  const insertToken = (token: string) => {
    const active = currentEmails[activeEmailIdx];
    if (!active) return;
    updateCurrentEmail("body", `${active.body} ${token}`);
  };

  // Safe fallback for competitor intelligence & battlecards
  const fallbackData = getFallbackDossier(dossier.domain);
  const effectiveCompetitors: CompetitorItem[] =
    dossier.competitors && dossier.competitors.length > 0
      ? dossier.competitors
      : fallbackData.dossier.competitors || [];

  const effectiveBattlecardSummary: BattlecardSummary | undefined =
    dossier.battlecardSummary || fallbackData.dossier.battlecardSummary;

  const currentCompetitor =
    effectiveCompetitors[selectedCompetitorIdx] || effectiveCompetitors[0];

  // Cold email health stats
  const activeEmail = currentEmails[activeEmailIdx] || { subject: "", body: "", label: "", type: "cold_open" };
  const wordCount = activeEmail.body
    ? activeEmail.body.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedSeconds = Math.max(15, Math.round(wordCount / 2.5));

  const handleExportMarkdown = () => {
    let md = `# Executive Dossier: ${dossier.companyName}\n\n`;
    md += `**Domain:** ${dossier.domain}\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n`;
    md += `**Industry:** ${dossier.industryTags.join(", ")}\n`;
    md += `**Headcount:** ${dossier.estimatedHeadcount}\n`;
    md += `**Business Model:** ${dossier.estimatedBusinessModel}\n`;
    md += `**ICP Qualification:** ${icpScore.tierLabel} (${icpScore.totalScore}/100)\n`;
    md += `**Recommended SDR Motion:** ${icpScore.recommendedAction}\n\n`;
    md += `## One-Sentence Summary\n${dossier.oneSentenceSummary}\n\n`;
    md += `## Target Audience\n${dossier.targetAudience}\n\n`;
    md += `## Key Value Propositions\n`;
    dossier.valuePropositions.forEach((vp) => (md += `- ${vp}\n`));
    md += `\n## Identified Pain Points & Pitch Angles\n`;
    dossier.top3PainPoints.forEach((pp, i) => (md += `${i + 1}. ${pp}\n`));
    md += `\n## Tech Stack & Architecture\n`;
    dossier.techTags.forEach((t) => (md += `- ${t}\n`));

    if (effectiveCompetitors && effectiveCompetitors.length > 0) {
      md += `\n---\n\n## Competitor Intelligence & Battlecards\n\n`;
      if (effectiveBattlecardSummary?.whySwitchSummary) {
        md += `### Why Switch to ${dossier.companyName}\n${effectiveBattlecardSummary.whySwitchSummary}\n\n`;
      }
      effectiveCompetitors.forEach((c, idx) => {
        md += `### ${idx + 1}. ${c.name} (${c.domain})\n`;
        md += `- **Category:** ${c.category}\n`;
        md += `- **Market Position:** ${c.marketPosition}\n`;
        md += `- **Pricing Model:** ${c.pricingModel}\n\n`;
        md += `#### Where ${dossier.companyName} Wins:\n`;
        c.whereTargetWins.forEach((w) => (md += `- ${w}\n`));
        md += `\n#### Where ${c.name} Leads:\n`;
        c.whereCompetitorWins.forEach((w) => (md += `- ${w}\n`));
        md += `\n#### Objection Handling Script:\n`;
        md += `> **Prospect Objection:** "${c.objectionScript.objection}"\n>\n`;
        md += `> **Counter-Response:** "${c.objectionScript.response}"\n>\n`;
        md += `> **⚡ Kill Point:** ${c.objectionScript.killPoint}\n\n---\n\n`;
      });
    }

    if (currentEmails && currentEmails.length > 0) {
      md += `\n---\n\n## Personalized Outreach Cadence\n\n`;
      currentEmails.forEach((e, idx) => {
        md += `### Touch ${idx + 1}: ${e.label} (${e.type})\n`;
        md += `**Subject:** ${e.subject}\n\n`;
        md += `${getPersonalizedBody(e.body)}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  const handleExportBattlecardOnlyMarkdown = () => {
    let md = `# Sales Battlecard: ${dossier.companyName}\n\n`;
    md += `**Domain:** ${dossier.domain}\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;

    if (effectiveBattlecardSummary?.whySwitchSummary) {
      md += `## Why Switch to ${dossier.companyName}\n`;
      md += `${effectiveBattlecardSummary.whySwitchSummary}\n\n`;
    }

    if (effectiveBattlecardSummary?.differentiatorPillars) {
      md += `### Core Differentiator Pillars\n`;
      effectiveBattlecardSummary.differentiatorPillars.forEach((p) => {
        md += `- **${p.title}:** ${p.description}\n`;
      });
      md += `\n`;
    }

    if (effectiveCompetitors && effectiveCompetitors.length > 0) {
      md += `## Competitor Radar & Head-to-Head Battlecards\n\n`;
      effectiveCompetitors.forEach((c, idx) => {
        md += `### ${idx + 1}. ${c.name} (${c.domain})\n`;
        md += `- **Category:** ${c.category}\n`;
        md += `- **Market Position:** ${c.marketPosition}\n`;
        md += `- **Pricing Model:** ${c.pricingModel}\n\n`;
        md += `#### Where ${dossier.companyName} Wins:\n`;
        c.whereTargetWins.forEach((w) => (md += `- ${w}\n`));
        md += `\n#### Where ${c.name} Leads:\n`;
        c.whereCompetitorWins.forEach((w) => (md += `- ${w}\n`));
        md += `\n#### Objection Handling Script:\n`;
        md += `> **Prospect Objection:** "${c.objectionScript.objection}"\n>\n`;
        md += `> **Counter-Response:** "${c.objectionScript.response}"\n>\n`;
        md += `> **⚡ Kill Point:** ${c.objectionScript.killPoint}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-battlecard.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (format: "apollo" | "lemlist") => {
    const csv = generateSingleCompanyCSV(dossier, currentEmails, format);
    triggerCSVDownload(
      csv,
      `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-${format}-campaign.csv`
    );
    setExportDropdownOpen(false);
  };

  const handleExportJSON = () => {
    const data = {
      dossier,
      competitors: effectiveCompetitors,
      battlecard: effectiveBattlecardSummary,
      emails: currentEmails,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-intelligence.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  const getPersonalizedBody = (rawBody: string) => {
    if (!personalize) return rawBody;
    return rawBody
      .replace(/\[Your Name\]/g, settings.senderName || "Alex Rivera")
      .replace(/\[Your Company\]/g, settings.senderCompany || "Acquisition Engine")
      .replace(/\[Similar Company\]/g, "peer enterprise accounts");
  };

  const tabs: { id: ProfileTab; label: string; badge?: string | number }[] = [
    { id: "overview", label: "Executive Dossier" },
    { id: "signals", label: "Pain Points & Opportunities", badge: dossier.top3PainPoints.length },
    { id: "outreach", label: "Outreach Sequences", badge: currentEmails ? currentEmails.length : undefined },
    { id: "battlecards", label: "Competitor Radar & Battlecards", badge: effectiveCompetitors.length },
    { id: "tech", label: "Tech Stack & Architecture", badge: dossier.techTags.length },
    {
      id: "activity",
      label: "Live Pipeline",
      badge: isResearching ? "Running" : undefined,
    },
  ];

  const subjectVariations = generateSubjectLineVariations(
    dossier.companyName,
    activeEmail.type,
    dossier.top3PainPoints?.[0]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Company Header Card */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-lg shrink-0 shadow-2xs">
              {dossier.companyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-fg tracking-tight">
                  {dossier.companyName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-fg-secondary border border-border">
                  <Globe className="w-3 h-3 text-fg-muted" />
                  {dossier.domain}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Analyzed
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                  title={icpScore.verdict}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                  <span>
                    {icpScore.tier === "tier_1"
                      ? "Tier 1 Priority"
                      : icpScore.tier === "tier_2"
                      ? "Tier 2 Qualified"
                      : "Tier 3 Nurture"}
                  </span>
                  <span className="font-mono opacity-80">({icpScore.totalScore}/100)</span>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-fg-secondary flex-wrap">
                <span className="font-medium text-fg">
                  {dossier.industryTags.slice(0, 2).join(" · ")}
                </span>
                <span className="text-fg-faint">/</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-fg-muted" />
                  {dossier.estimatedHeadcount}
                </span>
                <span className="text-fg-faint">/</span>
                <span>{dossier.estimatedBusinessModel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowBriefModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border bg-surface hover:bg-subtle text-fg rounded-md transition-colors shadow-2xs"
              title="Preview & Print 1-Page Executive Discovery Brief"
            >
              <Printer className="w-3.5 h-3.5 text-accent" />
              <span>Executive Brief (PDF)</span>
            </button>

            <a
              href={`https://${dossier.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-fg-secondary border border-border rounded-md hover:bg-subtle transition-colors"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3 h-3 text-fg-muted" />
            </a>

            {/* Campaign Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-3 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Campaign</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${exportDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-surface border border-border rounded-lg shadow-md z-50 p-1 divide-y divide-border/60">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowBriefModal(true);
                        setExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] rounded-md hover:bg-subtle text-fg flex items-center gap-2 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-accent" />
                      <div>
                        <span className="font-medium block">Executive 1-Pager (PDF)</span>
                        <span className="text-[10px] text-fg-muted block">Print-ready discovery briefing</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExportCSV("apollo")}
                      className="w-full text-left px-3 py-2 text-[12px] rounded-md hover:bg-subtle text-fg flex items-center gap-2 transition-colors"
                    >
                      <Table className="w-3.5 h-3.5 text-accent" />
                      <div>
                        <span className="font-medium block">Apollo / Instantly CSV</span>
                        <span className="text-[10px] text-fg-muted block">Formatted for cold sequences</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExportCSV("lemlist")}
                      className="w-full text-left px-3 py-2 text-[12px] rounded-md hover:bg-subtle text-fg flex items-center gap-2 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <span className="font-medium block">Lemlist / Smartlead CSV</span>
                        <span className="text-[10px] text-fg-muted block">Custom token variables</span>
                      </div>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full text-left px-3 py-1.5 text-[12px] rounded-md hover:bg-subtle text-fg-secondary hover:text-fg transition-colors"
                    >
                      Full Report (.md)
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-1.5 text-[12px] rounded-md hover:bg-subtle text-fg-secondary hover:text-fg transition-colors"
                    >
                      Raw Intelligence (.json)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "text-fg font-semibold"
                    : "text-fg-muted hover:text-fg-secondary"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium tabular-nums ${
                      isActive
                        ? "bg-fg text-surface"
                        : "bg-subtle text-fg-muted border border-border/80"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-fg rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: EXECUTIVE DOSSIER */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* ICP Qualification Matrix Card */}
          <IcpScoringCard scoreResult={icpScore} onOpenSettings={onOpenSettings} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                  Executive Summary
                </span>
                <CopyBtn text={dossier.oneSentenceSummary} label="Copy" />
              </div>
              <p className="text-[14px] text-fg leading-relaxed font-normal">
                {dossier.oneSentenceSummary}
              </p>
              {dossier.tagline && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[12px] text-fg-muted italic">
                  <span className="font-semibold text-fg-secondary not-italic">Tagline:</span>
                  &ldquo;{dossier.tagline}&rdquo;
                </div>
              )}
            </div>

            {/* Target Audience & Market ICP */}
            <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-2">
                Ideal Customer Profile (ICP) &amp; Audience
              </span>
              <p className="text-[13px] text-fg-secondary leading-relaxed">
                {dossier.targetAudience}
              </p>
            </div>

            {/* Key Value Propositions */}
            <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-3">
                Core Value Propositions
              </span>
              <div className="space-y-2.5">
                {dossier.valuePropositions.map((vp, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[13px] text-fg-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-fg-muted mt-2 shrink-0" />
                    <span className="leading-relaxed">{vp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Products & Features */}
            {dossier.keyFeatures.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-3">
                  Products &amp; Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dossier.keyFeatures.map((f, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-md border border-border/80 bg-subtle/30 text-[12px] font-medium text-fg flex items-center justify-between"
                    >
                      <span>{f}</span>
                      <ArrowRight className="w-3 h-3 text-fg-muted shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Metadata & Fast Facts */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-4">
                Company Metadata
              </span>

              <dl className="space-y-3.5 text-[12px]">
                <div>
                  <dt className="text-fg-muted font-medium mb-0.5">Primary Domain</dt>
                  <dd className="font-mono text-fg text-[13px]">{dossier.domain}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted font-medium mb-0.5">Estimated Headcount</dt>
                  <dd className="font-medium text-fg text-[13px]">{dossier.estimatedHeadcount}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted font-medium mb-0.5">Business Model</dt>
                  <dd className="font-medium text-fg text-[13px] leading-snug">
                    {dossier.estimatedBusinessModel}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted font-medium mb-1">Industry Classification</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {dossier.industryTags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-fg-secondary border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Quick Action Box */}
            <div className="bg-subtle/50 border border-border rounded-lg p-5 text-[12px]">
              <div className="flex items-center gap-1.5 font-semibold text-fg mb-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Recommended Action</span>
              </div>
              <p className="text-fg-secondary leading-relaxed mb-3">
                Review the {dossier.top3PainPoints.length} detected operational friction points to personalize your pitch angle.
              </p>
              <button
                onClick={() => setActiveTab("signals")}
                className="w-full py-2 px-3 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Inspect Pain Points</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* TAB 2: PAIN POINTS & OPPORTUNITIES */}
      {activeTab === "signals" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-fg">
                  Identified Friction Signals &amp; Market Gaps
                </h3>
                <p className="text-[12px] text-fg-muted mt-0.5">
                  Actionable weaknesses and operational bottlenecks extracted from positioning analysis.
                </p>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted bg-subtle px-2.5 py-1 rounded border border-border">
                {dossier.top3PainPoints.length} Strategic Angles
              </span>
            </div>

            <div className="space-y-4">
              {dossier.top3PainPoints.map((pp, i) => {
                const labels = ["High Friction Point", "Scaling Bottleneck", "Vendor Vulnerability"];
                return (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border/80 bg-subtle/20 hover:bg-subtle/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-fg text-surface flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                          {labels[i] || `Angle #${i + 1}`}
                        </span>
                      </div>
                      <CopyBtn text={pp} label="Copy Angle" />
                    </div>

                    <p className="text-[13px] text-fg font-medium leading-relaxed mb-2.5 pl-7">
                      {pp}
                    </p>

                    <div className="pl-7 pt-2 border-t border-border/60 flex items-start gap-2 text-[12px] text-fg-secondary">
                      <span className="font-semibold text-fg shrink-0">Talk Track:</span>
                      <span className="text-fg-secondary">
                        Reference this operational friction to establish domain credibility in your first 2 sentences.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OUTREACH SEQUENCES (WITH INLINE EDITOR & A/B SUBJECT LINES) */}
      {activeTab === "outreach" && currentEmails && currentEmails.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Outreach Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-subtle/50 border border-border rounded-lg text-[12px]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-fg" />
              <span className="font-semibold text-fg">Multi-Touch Cadence</span>
              <span className="text-fg-muted">· {currentEmails.length} Editable Touches</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-fg-secondary hover:text-fg">
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={(e) => setPersonalize(e.target.checked)}
                  className="rounded border-border text-fg focus:ring-0"
                />
                <span>Inject Sender ({settings.senderName})</span>
              </label>

              <button
                onClick={() => handleExportCSV("apollo")}
                className="px-2.5 py-1 text-[11px] font-medium text-fg bg-surface border border-border rounded-md hover:bg-subtle transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Table className="w-3 h-3 text-accent" />
                <span>Export Apollo CSV</span>
              </button>

              <button
                onClick={() => {
                  const allText = currentEmails
                    .map(
                      (e, idx) =>
                        `=== STEP ${idx + 1}: ${e.label} ===\nSubject: ${e.subject}\n\n${getPersonalizedBody(e.body)}\n`
                    )
                    .join("\n\n");
                  navigator.clipboard.writeText(allText);
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-fg bg-surface border border-border rounded-md hover:bg-subtle transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Copy className="w-3 h-3 text-fg-muted" />
                <span>Copy All</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step Selection Sidebar */}
            <div className="md:col-span-1 space-y-1.5">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block px-1 mb-2">
                Sequence Cadence
              </span>
              {currentEmails.map((email, idx) => {
                const isSelected = activeEmailIdx === idx;
                const days = ["Day 1", "Day 4", "Day 7", "Day 11"];
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveEmailIdx(idx);
                      setShowVariations(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-[12px] transition-colors ${
                      isSelected
                        ? "bg-surface border-fg/80 shadow-xs"
                        : "bg-surface/60 border-border/80 hover:bg-subtle text-fg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                        Touch {idx + 1} · {days[idx] || `Step ${idx + 1}`}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-fg" />
                      )}
                    </div>
                    <span className="font-semibold text-fg block text-[13px] leading-tight">
                      {email.label}
                    </span>
                    <span className="text-[11px] text-fg-muted mt-1 block truncate">
                      {email.type.replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Email Composer & Live Editor */}
            <div className="md:col-span-3 bg-surface border border-border rounded-lg p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block">
                      Touch #{activeEmailIdx + 1} · {activeEmail.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[12px] text-fg-secondary">
                      <span className="font-medium text-fg">{wordCount} words</span>
                      <span className="text-fg-faint">·</span>
                      <span>~{estimatedSeconds}s read time</span>
                      <span className="text-fg-faint">·</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          wordCount <= 90
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : wordCount <= 125
                            ? "bg-subtle text-fg-secondary border border-border"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {wordCount <= 90
                          ? "Optimal Punchy Length"
                          : wordCount <= 125
                          ? "Standard Length"
                          : "Consider Trimming"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevertCurrentEmail}
                    className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-subtle transition-colors"
                    title="Revert to original AI draft"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <CopyBtn
                    text={`Subject: ${activeEmail.subject}\n\n${getPersonalizedBody(activeEmail.body)}`}
                    label="Copy Email"
                    variant="solid"
                  />
                </div>
              </div>

              {/* Subject Line & A/B Variations */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Subject Line
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVariations(!showVariations)}
                    className="text-[11px] text-accent hover:text-accent-hover font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showVariations ? "Hide Variations" : "A/B Subject Line Variations"}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeEmail.subject}
                    onChange={(e) => updateCurrentEmail("subject", e.target.value)}
                    className="flex-1 px-3 py-2 text-[13px] font-medium bg-subtle/30 border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                  />
                  <CopyBtn text={activeEmail.subject} label="Copy" />
                </div>

                {/* A/B Subject Lines Modal/Dropdown */}
                {showVariations && (
                  <div className="mt-2.5 p-3 rounded-lg border border-border bg-subtle/40 space-y-2 animate-fade-in text-[12px]">
                    <span className="text-[11px] font-semibold text-fg uppercase tracking-wider block">
                      Alternative Strategic Hooks (Click to apply)
                    </span>
                    <div className="space-y-1.5">
                      {subjectVariations.map((v, i) => (
                        <div
                          key={i}
                          onClick={() => handleApplySubjectVariation(v)}
                          className="p-2 rounded-md bg-surface border border-border/80 hover:border-fg/40 hover:bg-subtle/60 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-subtle text-fg-secondary border border-border">
                              {v.angle}
                            </span>
                            <span className="font-medium text-fg">{v.subject}</span>
                          </div>
                          <span className="text-[11px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Use this
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Email Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Message Body (Editable)
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                    <span>Quick Tokens:</span>
                    <button
                      type="button"
                      onClick={() => insertToken("[Name]")}
                      className="px-1.5 py-0.5 rounded bg-subtle hover:bg-border text-fg-secondary transition-colors"
                    >
                      + [Name]
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken(dossier.companyName)}
                      className="px-1.5 py-0.5 rounded bg-subtle hover:bg-border text-fg-secondary transition-colors"
                    >
                      + [Company]
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken(settings.senderName || "[Your Name]")}
                      className="px-1.5 py-0.5 rounded bg-subtle hover:bg-border text-fg-secondary transition-colors"
                    >
                      + [Sender]
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={getPersonalizedBody(activeEmail.body)}
                  onChange={(e) => updateCurrentEmail("body", e.target.value)}
                  className="w-full p-4 rounded-md border border-border bg-subtle/20 text-[13px] text-fg leading-relaxed font-normal focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors font-sans resize-y"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPETITOR RADAR & SALES BATTLECARDS */}
      {activeTab === "battlecards" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-subtle text-fg border border-border">
                  <Swords className="w-3 h-3 text-fg-secondary" />
                  Competitive Intelligence Engine
                </span>
                <span className="text-[11px] text-fg-muted font-mono">
                  {effectiveCompetitors.length} Key Competitors Tracked
                </span>
              </div>
              <h2 className="text-[16px] font-semibold text-fg">
                Competitor Radar &amp; Objection Battlecards
              </h2>
              <p className="text-[12px] text-fg-muted mt-0.5">
                Head-to-head differentiation vectors, ICP comparison matrix, and battle-tested scripts for objection handling.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportBattlecardOnlyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-subtle hover:bg-border text-fg rounded-md transition-colors border border-border shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-fg-secondary" />
                <span>Export Battlecard (.md)</span>
              </button>
            </div>
          </div>

          {/* Executive Switching Catalyst Card */}
          {effectiveBattlecardSummary && (
            <div className="bg-surface border border-border rounded-lg p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Core Switching Catalyst vs Alternatives
                  </span>
                </div>
                <CopyBtn text={effectiveBattlecardSummary.whySwitchSummary} label="Copy Thesis" />
              </div>

              <p className="text-[14px] text-fg leading-relaxed font-normal bg-subtle/30 p-3.5 rounded-md border border-border/60">
                &ldquo;{effectiveBattlecardSummary.whySwitchSummary}&rdquo;
              </p>

              {/* Differentiator Pillars Grid */}
              {effectiveBattlecardSummary.differentiatorPillars && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {effectiveBattlecardSummary.differentiatorPillars.map((pillar, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-md border border-border/80 bg-subtle/20 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-subtle border border-border flex items-center justify-center text-[11px] font-semibold text-fg shrink-0">
                          {pIdx + 1}
                        </span>
                        <h4 className="text-[13px] font-semibold text-fg">{pillar.title}</h4>
                      </div>
                      <p className="text-[12px] text-fg-secondary leading-relaxed pl-7">
                        {pillar.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Competitor Selector Pills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                Select Competitor for Deep Dive
              </span>
              <span className="text-[11px] text-fg-muted">
                Showing head-to-head matchup against {currentCompetitor?.name || "Competitor"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {effectiveCompetitors.map((comp, idx) => {
                const isSelected = selectedCompetitorIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCompetitorIdx(idx)}
                    className={`p-3.5 rounded-lg border text-left transition-all relative ${
                      isSelected
                        ? "bg-surface border-fg shadow-xs ring-1 ring-fg/20"
                        : "bg-surface border-border hover:border-border/80 hover:bg-subtle/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-fg flex items-center gap-1.5">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-mono text-fg-muted px-1.5 py-0.5 rounded bg-subtle border border-border/60">
                        {comp.domain}
                      </span>
                    </div>
                    <span className="text-[11px] text-fg-secondary block truncate font-medium">
                      {comp.category}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Competitor Deep Dive */}
          {currentCompetitor && (
            <div className="space-y-6">
              {/* Matchup Overview Card */}
              <div className="bg-surface border border-border rounded-lg p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-sm">
                      {currentCompetitor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-fg">
                          {currentCompetitor.name}
                        </h3>
                        <a
                          href={`https://${currentCompetitor.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-fg-muted hover:text-fg inline-flex items-center gap-1"
                        >
                          <span>{currentCompetitor.domain}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <span className="text-[11px] text-fg-secondary font-medium">
                        {currentCompetitor.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-[11px] font-medium bg-subtle border border-border text-fg-secondary">
                      Pricing: {currentCompetitor.pricingModel}
                    </span>
                  </div>
                </div>

                {/* Market Position Quote */}
                <div className="text-[12px] text-fg-secondary bg-subtle/30 p-3 rounded-md border border-border/60 flex items-start gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-fg-muted shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-fg">Market Positioning: </span>
                    <span>{currentCompetitor.marketPosition}</span>
                  </div>
                </div>

                {/* 2-Column Advantage Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Where Target Wins */}
                  <div className="p-4 rounded-lg border border-emerald-200/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[12px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Where {dossier.companyName} Wins (Your Edge)</span>
                    </div>
                    <ul className="space-y-2 text-[12.5px] text-fg leading-relaxed">
                      {currentCompetitor.whereTargetWins.map((win, wIdx) => (
                        <li key={wIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Where Competitor Wins / Gaps */}
                  <div className="p-4 rounded-lg border border-border bg-subtle/30 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-fg-secondary font-semibold text-[12px]">
                      <AlertCircle className="w-4 h-4 text-fg-muted" />
                      <span>Where {currentCompetitor.name} Leads (Gaps to Navigate)</span>
                    </div>
                    <ul className="space-y-2 text-[12.5px] text-fg-secondary leading-relaxed">
                      {currentCompetitor.whereCompetitorWins.map((edge, eIdx) => (
                        <li key={eIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-fg-muted mt-2 shrink-0" />
                          <span>{edge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Objection Handling Weapon */}
              <div className="bg-surface border-2 border-border/90 rounded-lg p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                      Sales Battlecard Weapon: Objection Counter-Script
                    </span>
                  </div>
                  <CopyBtn
                    text={`Objection: "${currentCompetitor.objectionScript.objection}"\n\nCounter-Script:\n"${currentCompetitor.objectionScript.response}"\n\nKill Point: ${currentCompetitor.objectionScript.killPoint}`}
                    label="Copy Script"
                  />
                </div>

                {/* The Prospect's Objection */}
                <div className="p-3.5 rounded-md bg-subtle/50 border border-border">
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-1">
                    When the prospect says:
                  </span>
                  <p className="text-[13.5px] font-semibold text-fg italic">
                    &ldquo;{currentCompetitor.objectionScript.objection}&rdquo;
                  </p>
                </div>

                {/* The Counter-Script */}
                <div className="p-4 rounded-md bg-surface border border-border shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Recommended Counter-Framing (Acknowledge &rarr; Reframe &rarr; Wedge):
                  </span>
                  <p className="text-[13px] text-fg leading-relaxed">
                    {currentCompetitor.objectionScript.response}
                  </p>
                </div>

                {/* Kill Point Banner */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-subtle border border-border text-[12px]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-fg">Kill Point:</span>
                    <span className="text-fg-secondary font-medium">
                      {currentCompetitor.objectionScript.killPoint}
                    </span>
                  </div>
                  <CopyBtn text={currentCompetitor.objectionScript.killPoint} label="Copy Kill Point" />
                </div>
              </div>

              {/* Competitive Matrix Comparison Table */}
              <div className="bg-surface border border-border rounded-lg p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-fg">
                      Side-by-Side Competitive Matrix
                    </h4>
                    <p className="text-[12px] text-fg-muted mt-0.5">
                      Head-to-head comparison across pricing model, advantages, and sales positioning wedge.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-border text-fg-muted uppercase text-[10px] tracking-wider bg-subtle/30">
                        <th className="py-2.5 px-3 font-semibold">Vendor / Platform</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Pricing Model</th>
                        <th className="py-2.5 px-3 font-semibold">Primary Advantage</th>
                        <th className="py-2.5 px-3 font-semibold">Key Vulnerability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr className="bg-subtle/10 font-medium">
                        <td className="py-3 px-3 text-fg font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <span>{dossier.companyName} (Target)</span>
                        </td>
                        <td className="py-3 px-3 text-fg-secondary">
                          {dossier.industryTags[0] || "Core Solution"}
                        </td>
                        <td className="py-3 px-3 text-fg-secondary">
                          {dossier.estimatedBusinessModel}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400">
                          {dossier.valuePropositions[0] || "High Product Craft"}
                        </td>
                        <td className="py-3 px-3 text-fg-muted">
                          {dossier.top3PainPoints[0]?.slice(0, 50)}...
                        </td>
                      </tr>

                      {effectiveCompetitors.map((comp, cIdx) => (
                        <tr key={cIdx} className="hover:bg-subtle/20 transition-colors">
                          <td className="py-3 px-3 font-semibold text-fg">
                            {comp.name}
                          </td>
                          <td className="py-3 px-3 text-fg-secondary">
                            {comp.category}
                          </td>
                          <td className="py-3 px-3 text-fg-secondary">
                            {comp.pricingModel}
                          </td>
                          <td className="py-3 px-3 text-fg-secondary">
                            {comp.whereCompetitorWins[0] || "Established Market Base"}
                          </td>
                          <td className="py-3 px-3 text-amber-700 dark:text-amber-400">
                            {comp.whereTargetWins[0] || "Slower time to value"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TECH STACK & ARCHITECTURE */}
      {activeTab === "tech" && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-xs animate-fade-in space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-[14px] font-semibold text-fg">
                Detected Technology Stack &amp; Infrastructure
              </h3>
              <p className="text-[12px] text-fg-muted mt-0.5">
                Inferred client-side frameworks, backend architecture, and third-party SaaS integrations.
              </p>
            </div>
            <CopyBtn text={dossier.techTags.join(", ")} label="Copy Tech Stack" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dossier.techTags.map((tech, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md border border-border bg-subtle/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-[13px] font-medium text-fg">{tech}</span>
                </div>
                <span className="text-[10px] font-mono text-fg-muted uppercase">Verified</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE PIPELINE LOG */}
      {activeTab === "activity" && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-fg">Research Execution Log</h3>
              <p className="text-[12px] text-fg-muted mt-0.5">
                Audit trail of Jina DOM crawl, DOM extraction, and synthesis.
              </p>
            </div>
            <span className="text-[11px] font-mono text-fg-muted">
              Model: gemini-3.5-flash
            </span>
          </div>

          <div className="max-w-xl">
            <ActivityTimeline items={activities} />
          </div>
        </div>
      )}

      {/* Executive Discovery 1-Pager Modal */}
      <ExecutiveBriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        dossier={dossier}
        emails={currentEmails}
      />
    </div>
  );
}
