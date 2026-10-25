"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  PipelineLead,
  PipelineStage,
  PipelineMetrics,
  PIPELINE_STAGES,
  ScoutResult,
} from "@/lib/types";
import {
  syncLeadsToPipeline,
  movePipelineLead,
  updatePipelineLead,
  deletePipelineLead,
  computePipelineMetrics,
} from "@/lib/storage";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  X,
  AlertTriangle,
  CheckCircle2,
  Mail,
  User,
  Globe,
  Tag,
  Bell,
} from "lucide-react";

// ─── Conversion Funnel Bar ───────────────────────────────────────────────────

function ConversionFunnel({ metrics }: { metrics: PipelineMetrics }) {
  const stages: { key: PipelineStage; label: string }[] = [
    { key: "cold", label: "Cold" },
    { key: "contacted", label: "Contacted" },
    { key: "replied", label: "Replied" },
    { key: "won", label: "Won" },
  ];

  const rates = [
    metrics.conversionRates.coldToContacted,
    metrics.conversionRates.contactedToReplied,
    metrics.conversionRates.repliedToWon,
  ];

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      {stages.map((stage, i) => {
        const stageConfig = PIPELINE_STAGES[stage.key];
        const count = metrics.byStage[stage.key];
        return (
          <div key={stage.key} className="flex items-center gap-1">
            <div
              className="flex flex-col items-center px-2.5 py-1.5 rounded-md text-[11px] font-medium min-w-[56px]"
              style={{ backgroundColor: stageConfig.bgColor, color: stageConfig.color, border: `1px solid ${stageConfig.borderColor}` }}
            >
              <span className="text-[15px] font-bold tabular-nums">{count}</span>
              <span className="text-[10px] opacity-80">{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex flex-col items-center mx-0.5">
                <ArrowRight className="w-3 h-3 text-fg-muted" />
                <span className="text-[9px] text-fg-muted font-medium tabular-nums">
                  {rates[i]}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric Cards Row ────────────────────────────────────────────────────────

function MetricCards({ metrics }: { metrics: PipelineMetrics }) {
  const cards = [
    {
      label: "Pipeline Value",
      value: metrics.estimatedPipelineValue > 0 ? `$${metrics.estimatedPipelineValue.toLocaleString()}` : "$0",
      icon: DollarSign,
      color: "#059669",
    },
    {
      label: "Win Rate",
      value: `${metrics.conversionRates.overallWinRate}%`,
      icon: TrendingUp,
      color: "#2563eb",
    },
    {
      label: "Avg. Days",
      value: `${metrics.avgDaysInPipeline}d`,
      icon: Clock,
      color: "#d97706",
    },
    {
      label: "Follow-Ups Due",
      value: `${metrics.overdueFollowUps}`,
      icon: metrics.overdueFollowUps > 0 ? AlertTriangle : Bell,
      color: metrics.overdueFollowUps > 0 ? "#dc2626" : "#6b7280",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-lg px-3.5 py-2.5 shadow-xs flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: card.color + "14", color: card.color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-fg tabular-nums leading-tight">{card.value}</div>
              <div className="text-[11px] text-fg-muted font-medium">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Lead Card (Draggable) ───────────────────────────────────────────────────

function LeadCard({
  lead,
  onEdit,
  onDelete,
  onViewDossier,
  onDragStart,
}: {
  lead: PipelineLead;
  onEdit: (lead: PipelineLead) => void;
  onDelete: (leadId: string) => void;
  onViewDossier?: (result: ScoutResult) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.stage !== "won" && lead.stage !== "lost";
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-surface border border-border rounded-lg p-3 shadow-xs hover:shadow-sm hover:border-fg/30 cursor-grab active:cursor-grabbing transition-all group animate-fade-in select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical className="w-3.5 h-3.5 text-fg-faint opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-fg truncate leading-tight">
              {lead.companyName}
            </div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" />
              <span className="truncate">{lead.domain}</span>
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded hover:bg-subtle text-fg-muted hover:text-fg opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-md overflow-hidden z-50 p-1 text-[12px]">
              <button
                onClick={() => { onEdit(lead); setShowMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-subtle text-fg-secondary hover:text-fg flex items-center gap-2"
              >
                <Pencil className="w-3 h-3" /> Edit Details
              </button>
              {lead.dossierRef && onViewDossier && (
                <button
                  onClick={() => { onViewDossier(lead.dossierRef!); setShowMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-subtle text-fg-secondary hover:text-fg flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" /> View Dossier
                </button>
              )}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { onDelete(lead.id); setShowMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-danger-light text-danger flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact info */}
      {lead.contactName && (
        <div className="flex items-center gap-1.5 text-[11px] text-fg-secondary mb-1.5">
          <User className="w-3 h-3 text-fg-muted" />
          <span className="truncate">{lead.contactName}</span>
          {lead.contactTitle && (
            <span className="text-fg-muted">· {lead.contactTitle}</span>
          )}
        </div>
      )}

      {/* ICP Score pill */}
      {lead.icpScore !== undefined && lead.icpScore > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              lead.icpScore >= 80
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : lead.icpScore >= 60
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            ICP {lead.icpScore}/100
          </div>
          {lead.estimatedValue !== undefined && lead.estimatedValue > 0 && (
            <div className="text-[10px] text-fg-muted font-medium flex items-center gap-0.5">
              <DollarSign className="w-2.5 h-2.5" />
              {lead.estimatedValue.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-fg-muted bg-subtle px-1.5 py-0.5 rounded-md border border-border/80 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes preview */}
      {lead.notes && (
        <p className="text-[11px] text-fg-secondary line-clamp-2 leading-relaxed mb-2 italic">
          &ldquo;{lead.notes}&rdquo;
        </p>
      )}

      {/* Footer: follow-up & activity */}
      <div className="flex items-center justify-between text-[10px] text-fg-muted pt-1.5 border-t border-border/60">
        <div className="flex items-center gap-2">
          {lead.touchesSent > 0 && (
            <span className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5" /> {lead.touchesSent} sent
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" /> {daysSinceActivity}d ago
          </span>
        </div>
        {isOverdue && (
          <span className="text-danger font-semibold flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
          </span>
        )}
        {lead.followUpDate && !isOverdue && lead.stage !== "won" && lead.stage !== "lost" && (
          <span className="text-fg-muted flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(lead.followUpDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Lead Edit Modal ─────────────────────────────────────────────────────────

function LeadEditModal({
  lead,
  onSave,
  onClose,
}: {
  lead: PipelineLead;
  onSave: (updates: Partial<PipelineLead>) => void;
  onClose: () => void;
}) {
  const [contactName, setContactName] = useState(lead.contactName || "");
  const [contactEmail, setContactEmail] = useState(lead.contactEmail || "");
  const [contactTitle, setContactTitle] = useState(lead.contactTitle || "");
  const [notes, setNotes] = useState(lead.notes || "");
  const [estimatedValue, setEstimatedValue] = useState(lead.estimatedValue?.toString() || "");
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate ? lead.followUpDate.slice(0, 10) : "");
  const [followUpNote, setFollowUpNote] = useState(lead.followUpNote || "");
  const [touchesSent, setTouchesSent] = useState(lead.touchesSent.toString());
  const [tagsInput, setTagsInput] = useState(lead.tags.join(", "));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactTitle: contactTitle.trim() || undefined,
      notes: notes.trim(),
      estimatedValue: parseInt(estimatedValue) || 0,
      followUpDate: followUpDate || undefined,
      followUpNote: followUpNote.trim() || undefined,
      touchesSent: parseInt(touchesSent) || 0,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-fg">Edit Lead — {lead.companyName}</h3>
            <p className="text-[12px] text-fg-muted mt-0.5">{lead.domain}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-subtle text-fg-muted hover:text-fg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Contact Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Contact Name</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Title</label>
                <input
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="VP of Sales"
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-fg-secondary block mb-1">Email</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
              />
            </div>
          </div>

          {/* Deal Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Deal Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Estimated Value ($)</label>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Touches Sent</label>
                <input
                  type="number"
                  value={touchesSent}
                  onChange={(e) => setTouchesSent(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-fg-secondary block mb-1">Tags (comma separated)</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="FinTech, Enterprise, SaaS"
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
              />
            </div>
          </div>

          {/* Follow-Up */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Follow-Up Reminder</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-fg/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-fg-secondary block mb-1">Reminder Note</label>
                <input
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Send case study"
                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this lead..."
              className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium border border-border rounded-lg bg-surface hover:bg-subtle text-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-[13px] font-medium bg-fg text-surface rounded-lg hover:bg-fg/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pipeline Column (Drop Target) ──────────────────────────────────────────

function PipelineColumn({
  stage,
  leads,
  onDropLead,
  onEditLead,
  onDeleteLead,
  onViewDossier,
  onDragStart,
}: {
  stage: PipelineStage;
  leads: PipelineLead[];
  onDropLead: (leadId: string, targetStage: PipelineStage) => void;
  onEditLead: (lead: PipelineLead) => void;
  onDeleteLead: (leadId: string) => void;
  onViewDossier?: (result: ScoutResult) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageConfig = PIPELINE_STAGES[stage];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      onDropLead(leadId, stage);
    }
  };

  return (
    <div
      className={`flex-1 min-w-[220px] max-w-[280px] flex flex-col rounded-xl border transition-all ${
        isDragOver
          ? "border-accent bg-accent-light/30 shadow-md"
          : "border-border bg-subtle/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className="px-3.5 py-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: stageConfig.borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{stageConfig.icon}</span>
          <span className="text-[13px] font-semibold" style={{ color: stageConfig.color }}>
            {stageConfig.label}
          </span>
        </div>
        <span
          className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: stageConfig.bgColor, color: stageConfig.color }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {leads.length === 0 && (
          <div className="text-center py-8 text-[12px] text-fg-faint">
            {isDragOver ? "Drop here" : "No leads"}
          </div>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={onEditLead}
            onDelete={onDeleteLead}
            onViewDossier={onViewDossier}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Pipeline View ──────────────────────────────────────────────────────

interface PipelineViewProps {
  onViewDossier?: (result: ScoutResult) => void;
  refreshTrigger?: number;
}

export default function PipelineView({ onViewDossier, refreshTrigger }: PipelineViewProps) {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [editingLead, setEditingLead] = useState<PipelineLead | null>(null);
  const [showLostColumn, setShowLostColumn] = useState(false);

  // Load and sync pipeline
  const refresh = useCallback(() => {
    const synced = syncLeadsToPipeline();
    setLeads(synced);
    setMetrics(computePipelineMetrics(synced));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshTrigger]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropLead = (leadId: string, targetStage: PipelineStage) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;
    movePipelineLead(leadId, targetStage);
    refresh();
  };

  const handleEditSave = (updates: Partial<PipelineLead>) => {
    if (!editingLead) return;
    updatePipelineLead(editingLead.id, updates);
    setEditingLead(null);
    refresh();
  };

  const handleDelete = (leadId: string) => {
    if (!confirm("Remove this lead from the pipeline?")) return;
    deletePipelineLead(leadId);
    refresh();
  };

  const stageOrder: PipelineStage[] = showLostColumn
    ? ["cold", "contacted", "replied", "won", "lost"]
    : ["cold", "contacted", "replied", "won"];

  const leadsByStage = (stage: PipelineStage) =>
    leads
      .filter((l) => l.stage === stage)
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

  const lostCount = leads.filter((l) => l.stage === "lost").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Pipeline Header */}
      <div className="px-8 py-5 border-b border-border bg-surface shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-fg tracking-tight">Sales Pipeline</h2>
            <p className="text-[12px] text-fg-muted mt-0.5">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} in pipeline • Drag cards between stages to update status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLostColumn(!showLostColumn)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                showLostColumn
                  ? "bg-danger-light border-danger/30 text-danger"
                  : "border-border bg-surface hover:bg-subtle text-fg-secondary"
              }`}
            >
              {showLostColumn ? "Hide" : "Show"} Lost ({lostCount})
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        {metrics && leads.length > 0 && (
          <div className="space-y-3">
            <MetricCards metrics={metrics} />
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider shrink-0">Funnel</span>
              <ConversionFunnel metrics={metrics} />
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 max-w-sm">
            <div className="w-14 h-14 rounded-xl bg-subtle border border-border flex items-center justify-center mx-auto">
              <Target className="w-7 h-7 text-fg-muted" />
            </div>
            <h3 className="text-[15px] font-semibold text-fg">No Leads in Pipeline</h3>
            <p className="text-[13px] text-fg-secondary leading-relaxed">
              Research companies first — they&apos;ll automatically appear here as cold leads ready to be moved through your sales stages.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
          <div className="flex gap-4 h-full min-w-0">
            {stageOrder.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                leads={leadsByStage(stage)}
                onDropLead={handleDropLead}
                onEditLead={setEditingLead}
                onDeleteLead={handleDelete}
                onViewDossier={onViewDossier}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onSave={handleEditSave}
          onClose={() => setEditingLead(null)}
        />
      )}
    </div>
  );
}
