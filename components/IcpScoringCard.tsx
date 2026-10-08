"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Star,
  TrendingUp,
  Building2,
  Briefcase,
  Cpu,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { IcpScoreResult, IcpCriterionBreakdown } from "@/lib/types";
import { getTierBadgeStyle } from "@/lib/icp-scorer";

interface IcpScoringCardProps {
  scoreResult: IcpScoreResult;
  onOpenSettings?: () => void;
}

export default function IcpScoringCard({
  scoreResult,
  onOpenSettings,
}: IcpScoringCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tierStyle = getTierBadgeStyle(scoreResult.tier);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPillarIcon = (id: string) => {
    switch (id) {
      case "headcount":
        return <Building2 className="w-3.5 h-3.5 text-accent" />;
      case "business_model":
        return <Briefcase className="w-3.5 h-3.5 text-accent" />;
      case "tech_stack":
        return <Cpu className="w-3.5 h-3.5 text-accent" />;
      case "pain_points":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-accent" />;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden transition-all">
      {/* Card Header & Main Score Gauge */}
      <div className="p-5 md:p-6 border-b border-border bg-subtle/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Overall Fit & Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                ICP Qualification Matrix
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                {scoreResult.tierLabel}
              </span>
            </div>

            <p className="text-[13px] text-fg leading-relaxed max-w-xl">
              {scoreResult.verdict}
            </p>

            {/* SDR Recommended Action Pill */}
            <div className="pt-1 flex items-start gap-2 text-[12px] bg-surface/80 p-2.5 rounded-md border border-border/80">
              <span className="font-semibold text-fg shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" />
                Action:
              </span>
              <span className="text-fg-secondary">
                {scoreResult.recommendedAction}
              </span>
            </div>
          </div>

          {/* Right: Score Gauge */}
          <div className="flex items-center gap-4 shrink-0 bg-surface border border-border p-3.5 rounded-xl shadow-2xs self-start md:self-center">
            {/* Circular Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    scoreResult.totalScore >= 80
                      ? "text-emerald-600"
                      : scoreResult.totalScore >= 60
                      ? "text-blue-600"
                      : "text-slate-500"
                  }
                  strokeDasharray={`${scoreResult.totalScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-fg leading-none">
                  {scoreResult.totalScore}
                </span>
                <span className="text-[9px] text-fg-muted font-medium">/100</span>
              </div>
            </div>

            <div className="text-left space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-fg-muted tracking-wider block">
                Target Fit Score
              </span>
              <span className="text-[13px] font-semibold text-fg block">
                {scoreResult.priorityLevel} Priority
              </span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium pt-0.5"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize ICP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Progress Grid */}
      <div className="p-5 md:p-6 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">
            Evaluation Breakdown Across 4 Core Dimensions
          </span>
          <span className="text-[11px] text-fg-muted font-mono">
            25 Points Max Per Dimension
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scoreResult.breakdown.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isExpanded
                    ? "border-border-strong bg-subtle/50"
                    : "border-border bg-surface hover:bg-subtle/20"
                }`}
              >
                <div
                  className="cursor-pointer select-none"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getPillarIcon(item.id)}
                      <span className="text-[12.5px] font-semibold text-fg">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-bold text-fg">
                        {item.score} / {item.maxScore}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-fg-muted" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.score >= 22
                          ? "bg-emerald-600"
                          : item.score >= 18
                          ? "bg-blue-600"
                          : "bg-slate-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Reason & Signals Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-[12px] animate-fade-in">
                    <p className="text-fg-secondary leading-relaxed">
                      {item.reason}
                    </p>

                    {item.matchedSignals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.matchedSignals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10.5px] bg-subtle border border-border text-fg font-medium inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
