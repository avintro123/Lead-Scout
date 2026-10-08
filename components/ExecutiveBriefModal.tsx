"use client";

import { useState, useEffect, useRef } from "react";
import {
  Printer,
  Copy,
  Check,
  X,
  Globe,
  Users,
  ShieldCheck,
  ExternalLink,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
} from "lucide-react";
import { CompanyDossier, OutreachEmail } from "@/lib/types";
import { calculateIcpScore, getTierBadgeStyle } from "@/lib/icp-scorer";
import { getUserSettings } from "@/lib/storage";

interface ExecutiveBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: CompanyDossier;
  emails: OutreachEmail[] | null;
}

export default function ExecutiveBriefModal({
  isOpen,
  onClose,
  dossier,
  emails,
}: ExecutiveBriefModalProps) {
  const [copied, setCopied] = useState(false);
  const briefRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const primaryCompetitor = dossier.competitors?.[0];
  const icpScore = calculateIcpScore(dossier, getUserSettings());
  const tierStyle = getTierBadgeStyle(icpScore.tier);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `=======================================================\n`;
    text += `EXECUTIVE SALES BRIEF: ${dossier.companyName.toUpperCase()}\n`;
    text += `=======================================================\n\n`;
    text += `Domain: ${dossier.domain}\n`;
    text += `Headcount: ${dossier.estimatedHeadcount}\n`;
    text += `Business Model: ${dossier.estimatedBusinessModel}\n`;
    text += `ICP Qualification: ${icpScore.tierLabel} (${icpScore.totalScore}/100)\n`;
    text += `Action Recommendation: ${icpScore.recommendedAction}\n`;
    text += `Industries: ${dossier.industryTags?.join(", ")}\n\n`;
    text += `1. EXECUTIVE SUMMARY:\n${dossier.oneSentenceSummary}\n\n`;
    text += `2. IDEAL CUSTOMER PROFILE (ICP):\n${dossier.targetAudience}\n\n`;
    text += `3. TOP OPERATIONAL PAIN POINTS:\n`;
    dossier.top3PainPoints?.forEach((pp, i) => {
      text += `   ${i + 1}. ${pp}\n`;
    });
    text += `\n4. COMPETITIVE BATTLECARD:\n`;
    if (dossier.battlecardSummary?.whySwitchSummary) {
      text += `Why Switch: ${dossier.battlecardSummary.whySwitchSummary}\n\n`;
    }
    if (dossier.competitors && dossier.competitors[0]) {
      const comp = dossier.competitors[0];
      text += `Primary Competitor: ${comp.name} (${comp.domain})\n`;
      text += `Our Edge: ${comp.whereTargetWins?.join("; ")}\n`;
      text += `Objection: "${comp.objectionScript?.objection}"\n`;
      text += `Counter-Script: "${comp.objectionScript?.response}"\n`;
      text += `Kill Point: ${comp.objectionScript?.killPoint}\n\n`;
    }
    if (emails && emails[0]) {
      text += `5. INITIAL OUTREACH TOUCH:\n`;
      text += `Subject: ${emails[0].subject}\n\n`;
      text += `${emails[0].body}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Toolbar (hidden during print) */}
        <div className="no-print px-6 py-3.5 border-b border-border bg-subtle/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border text-fg shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-accent" />
              Executive 1-Pager Brief
            </span>
            <span className="text-[12px] text-fg-muted font-normal">
              Print-optimized discovery briefing sheet for {dossier.companyName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 text-[12px] font-medium border border-border bg-surface hover:bg-subtle text-fg rounded-md transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied Text</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-fg-muted" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-subtle transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Executive Document Area */}
        <div
          ref={briefRef}
          className="print-page bg-surface text-fg p-8 sm:p-10 space-y-6 font-sans select-text leading-relaxed"
        >
          {/* Document Header */}
          <div className="border-b border-border-strong pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-md bg-fg text-surface flex items-center justify-center font-bold text-sm shrink-0">
                  {dossier.companyName.charAt(0)}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-fg">
                  {dossier.companyName}
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-subtle text-fg-secondary">
                  {dossier.domain}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified Intel
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                  {icpScore.tierLabel} ({icpScore.totalScore}/100)
                </span>
              </div>
              <p className="text-[13px] text-fg-secondary italic">
                &ldquo;{dossier.tagline || dossier.oneSentenceSummary}&rdquo;
              </p>
            </div>

            <div className="text-right text-[11px] text-fg-muted font-mono shrink-0">
              <span className="block font-medium text-fg uppercase tracking-wider">
                Executive Sales Brief
              </span>
              <span>Prepared: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Metrics Bar (5 Metrics including ICP Fit) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-lg border border-border bg-subtle/30 text-[12px] print-avoid-break">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted block">
                Headcount
              </span>
              <span className="font-semibold text-fg">{dossier.estimatedHeadcount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted block">
                Business Model
              </span>
              <span className="font-semibold text-fg truncate block">
                {dossier.estimatedBusinessModel}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted block">
                Primary Industry
              </span>
              <span className="font-semibold text-fg truncate block">
                {dossier.industryTags?.slice(0, 2).join(", ")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted block">
                Detected Stack
              </span>
              <span className="font-semibold text-fg truncate block">
                {dossier.techTags?.slice(0, 2).join(", ")} ({dossier.techTags?.length} tech)
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted block">
                ICP Fit Score
              </span>
              <span className={`font-semibold inline-flex items-center gap-1 ${tierStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                {icpScore.totalScore}/100 ({icpScore.tier === "tier_1" ? "Tier 1" : icpScore.tier === "tier_2" ? "Tier 2" : "Tier 3"})
              </span>
            </div>
          </div>

          {/* 2-Column Core Section: Profile & ICP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-avoid-break">
            {/* Executive Summary & Value Props */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-1 border-b border-border">
                <Target className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg">
                  Executive Profile &amp; Value Engine
                </h3>
              </div>
              <p className="text-[13px] text-fg leading-relaxed">
                {dossier.oneSentenceSummary}
              </p>
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-fg-secondary block">
                  Core Value Propositions:
                </span>
                {dossier.valuePropositions?.slice(0, 3).map((vp, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-fg-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{vp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target ICP & Key Capabilities */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-1 border-b border-border">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg">
                  Ideal Customer Profile (ICP)
                </h3>
              </div>
              <p className="text-[13px] text-fg leading-relaxed">
                {dossier.targetAudience}
              </p>
              {dossier.keyFeatures?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-fg-secondary block">
                    Key Products &amp; Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dossier.keyFeatures.slice(0, 5).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] bg-subtle border border-border/80 text-fg font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Operational Friction & Rep Discovery Talk-Tracks */}
          <div className="space-y-3 print-avoid-break">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg">
                  Identified Operational Gaps &amp; Discovery Angles
                </h3>
              </div>
              <span className="text-[10px] text-fg-muted font-mono">
                Pain-Agitate-Solution Talking Points
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dossier.top3PainPoints?.map((pp, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-border bg-subtle/20 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-fg-muted mb-1">
                      <span>ANGLE #{i + 1}</span>
                    </div>
                    <p className="text-[12.5px] font-medium text-fg leading-snug">
                      {pp}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 text-[11px] text-fg-secondary">
                    <span className="font-semibold text-fg">Discovery Track: </span>
                    <span>Confirm if this friction bottleneck touches their current quarterly roadmap.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Head-to-Head Competitive Battlecard */}
          {primaryCompetitor && (
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg">
                    Competitive Radar &amp; Objection Battlecard
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-fg-secondary">
                  Matchup vs {primaryCompetitor.name} ({primaryCompetitor.domain})
                </span>
              </div>

              {/* Switching Thesis */}
              {dossier.battlecardSummary?.whySwitchSummary && (
                <p className="text-[12.5px] text-fg-secondary bg-subtle/30 p-2.5 rounded border border-border/60">
                  <strong className="text-fg">Switching Catalyst: </strong>
                  {dossier.battlecardSummary.whySwitchSummary}
                </p>
              )}

              {/* Head-to-head grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/20 space-y-1.5">
                  <span className="font-bold text-emerald-800 text-[11px] block">
                    WHERE {dossier.companyName.toUpperCase()} WINS (YOUR ADVANTAGE):
                  </span>
                  <ul className="space-y-1">
                    {primaryCompetitor.whereTargetWins?.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-fg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-border bg-subtle/30 space-y-1.5">
                  <span className="font-bold text-fg-secondary text-[11px] block">
                    WHERE {primaryCompetitor.name.toUpperCase()} LEADS (GAPS TO NAVIGATE):
                  </span>
                  <ul className="space-y-1">
                    {primaryCompetitor.whereCompetitorWins?.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-fg-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-fg-muted mt-1.5 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* The Objection Counter-Script */}
              {primaryCompetitor.objectionScript && (
                <div className="p-3.5 rounded-lg border border-border bg-subtle/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                      Objection Counter-Script
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">
                      ⚡ Kill Point: {primaryCompetitor.objectionScript.killPoint}
                    </span>
                  </div>
                  <p className="text-[12px] italic text-fg font-medium">
                    &ldquo;{primaryCompetitor.objectionScript.objection}&rdquo;
                  </p>
                  <p className="text-[12px] text-fg-secondary">
                    <span className="font-semibold text-fg">Counter-Framing: </span>
                    {primaryCompetitor.objectionScript.response}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section: Recommended Outreach Sequence Snippet */}
          {emails && emails[0] && (
            <div className="space-y-2.5 print-avoid-break">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg">
                    Recommended Outreach Sequence Touch 1
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-fg-muted">
                  Pain-Agitate-Solution Cold Open
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-subtle/20 space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg">Subject:</span>
                  <span className="text-fg font-medium">{emails[0].subject}</span>
                </div>
                <p className="text-fg-secondary whitespace-pre-line leading-relaxed text-[11.5px] line-clamp-4">
                  {emails[0].body}
                </p>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-fg-muted font-mono">
            <span>LeadScout Enterprise Intelligence Engine</span>
            <span>Confidential Sales Enablement · Internal Use Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
