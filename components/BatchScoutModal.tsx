"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Table,
  FileSpreadsheet,
  Globe,
  ArrowRight,
  RotateCcw,
  Building2,
  ExternalLink,
  Target,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { OutreachObjective, LeadRecord, OBJECTIVES } from "@/lib/types";
import { executeScoutPipeline } from "@/lib/scout-pipeline";
import { generateBulkCompaniesCSV, triggerCSVDownload } from "@/lib/export-csv";

interface BatchScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectLead: (lead: LeadRecord) => void;
  onNavigateToCRM: () => void;
  initialObjective?: OutreachObjective;
}

interface BatchQueueItem {
  domain: string;
  status: "pending" | "fetching" | "analyzing" | "completed" | "error";
  statusText?: string;
  record?: LeadRecord;
  error?: string;
}

const PRESET_LISTS = [
  {
    label: "SaaS Scaleups (4)",
    domains: ["linear.app", "resend.com", "notion.so", "stripe.com"],
  },
  {
    label: "FinTech & Payments (3)",
    domains: ["stripe.com", "adyen.com", "checkout.com"],
  },
  {
    label: "Developer Infrastructure (3)",
    domains: ["supabase.com", "postman.com", "neon.tech"],
  },
];

export default function BatchScoutModal({
  isOpen,
  onClose,
  onInspectLead,
  onNavigateToCRM,
  initialObjective = "client_acquisition",
}: BatchScoutModalProps) {
  const [inputText, setInputText] = useState("");
  const [objective, setObjective] = useState<OutreachObjective>(initialObjective);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [completedRecords, setCompletedRecords] = useState<LeadRecord[]>([]);

  const isCancelledRef = useRef(false);

  // Sync objective if prop changes
  useEffect(() => {
    if (initialObjective) {
      setObjective(initialObjective);
    }
  }, [initialObjective]);

  // Reset modal when reopened
  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      if (isCompleted) {
        // Keep previous completed state visible if reopened without reset
      }
    }
  }, [isOpen, isCompleted]);

  // Parse and deduplicate domains from input
  const parsedDomains = useMemo(() => {
    const rawTokens = inputText
      .split(/[\n,;\s]+/)
      .map((t) =>
        t
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/.*$/, "")
      )
      .filter((t) => t.length >= 3 && t.includes("."));

    return Array.from(new Set(rawTokens));
  }, [inputText]);

  // Handle ESC key to dismiss modal when not running
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRunning) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isRunning, onClose]);

  const handleStartBatch = async () => {
    if (parsedDomains.length === 0 || isRunning) return;

    isCancelledRef.current = false;
    setIsRunning(true);
    setIsCompleted(false);
    setCompletedRecords([]);

    // Initialize queue items
    const initialQueue: BatchQueueItem[] = parsedDomains.map((domain) => ({
      domain,
      status: "pending",
      statusText: "Waiting in queue...",
    }));
    setQueue(initialQueue);

    const accumulated: LeadRecord[] = [];

    // Process sequentially for maximum stability & API resilience
    for (let i = 0; i < initialQueue.length; i++) {
      if (isCancelledRef.current) break;

      const item = initialQueue[i];

      // Update to fetching
      setQueue((prev) =>
        prev.map((q, idx) =>
          idx === i
            ? { ...q, status: "fetching", statusText: "Scraping DOM via Jina Reader..." }
            : q
        )
      );

      try {
        const leadRecord = await executeScoutPipeline(
          item.domain,
          objective,
          (step, msg) => {
            if (isCancelledRef.current) return;
            setQueue((prev) =>
              prev.map((q, idx) =>
                idx === i
                  ? {
                      ...q,
                      status: step === "fetch" ? "fetching" : "analyzing",
                      statusText: msg,
                    }
                  : q
              )
            );
          }
        );

        if (isCancelledRef.current) break;

        accumulated.push(leadRecord);
        setCompletedRecords([...accumulated]);

        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: "completed",
                  statusText: "Intelligence & 4-touch sequences ready",
                  record: leadRecord,
                }
              : q
          )
        );
      } catch (err) {
        console.error(`Batch item ${item.domain} failed:`, err);
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: "error",
                  statusText: "Extraction failed. Skipped.",
                  error: String(err),
                }
              : q
          )
        );
      }

      // Small breather between requests
      await new Promise((r) => setTimeout(r, 400));
    }

    setIsRunning(false);
    setIsCompleted(true);
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
  };

  const handleReset = () => {
    setInputText("");
    setQueue([]);
    setCompletedRecords([]);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleExportCSV = (format: "apollo" | "lemlist") => {
    if (completedRecords.length === 0) return;
    const csv = generateBulkCompaniesCSV(completedRecords, format);
    triggerCSVDownload(
      csv,
      `batch-${completedRecords.length}-companies-${format}-campaign.csv`
    );
  };

  const completedCount = queue.filter((q) => q.status === "completed").length;
  const progressPercent = queue.length > 0 ? Math.round((completedCount / queue.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isRunning) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-subtle border border-border flex items-center justify-center text-fg">
              <Layers className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-fg tracking-tight">
                Batch Prospecting &amp; Bulk Ingestion
              </h2>
              <p className="text-[12px] text-fg-muted">
                Analyze multiple B2B domains simultaneously and export unified campaign CSVs.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={onClose}
            className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-subtle transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!isRunning && !isCompleted ? (
            /* PHASE 1: CONFIGURATION & INPUT */
            <div className="space-y-4">
              {/* Objective Selector */}
              <div>
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-1.5">
                  Target Outreach Objective
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: "client_acquisition", label: "Client Acquisition", icon: Target },
                      { id: "partnership_inquiry", label: "Partnership", icon: Briefcase },
                      { id: "tech_stack_audit", label: "Tech Stack Audit", icon: ShieldCheck },
                    ] as const
                  ).map((obj) => {
                    const isSelected = objective === obj.id;
                    const Icon = obj.icon;
                    return (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => setObjective(obj.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors ${
                          isSelected
                            ? "bg-surface border-fg text-fg font-semibold shadow-2xs"
                            : "bg-surface border-border text-fg-secondary hover:bg-subtle"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-fg" : "text-fg-muted"}`} />
                        <span>{obj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea for Domain Ingestion */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Target Domains / URLs
                  </label>
                  <span className="text-[11px] font-mono text-fg-secondary">
                    {parsedDomains.length > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ {parsedDomains.length} valid domains detected
                      </span>
                    ) : (
                      "One domain per line or comma-separated"
                    )}
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Enter domains, e.g.:\nlinear.app\nresend.com\nstripe.com\nsupabase.com`}
                  className="w-full p-3.5 rounded-lg border border-border bg-subtle/30 text-[13px] font-mono text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg/50 focus:ring-1 focus:ring-fg/20 transition-all resize-y"
                />
              </div>

              {/* Quick Preset Lists */}
              <div>
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-1.5">
                  Or load a sample prospecting list:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LISTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(preset.domains.join("\n"))}
                      className="px-2.5 py-1 rounded-md border border-border/80 bg-subtle/40 hover:bg-subtle text-fg-secondary hover:text-fg text-[12px] transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* PHASE 2 & 3: QUEUE EXECUTION & RESULTS */
            <div className="space-y-4">
              {/* Progress Summary Header */}
              <div className="bg-subtle/40 border border-border rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="font-semibold text-fg">
                      {isRunning
                        ? `Scouting in progress (${completedCount} of ${queue.length})`
                        : `Batch completed! (${completedCount} of ${queue.length} processed)`}
                    </span>
                  </div>
                  <span className="font-mono text-[12px] text-fg-muted">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fg transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Completed Banner with Master Export CTAs */}
              {isCompleted && completedRecords.length > 0 && (
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-semibold text-emerald-900 dark:text-emerald-200">
                        {completedRecords.length} Accounts Ready for Outreach
                      </h4>
                      <p className="text-[12px] text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                        Dossiers and 4-touch email cadences have been saved to your local database &amp; Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExportCSV("apollo")}
                      className="px-3 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Download Master Apollo CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV("lemlist")}
                      className="px-3 py-1.5 text-[12px] font-medium border border-border bg-surface hover:bg-subtle text-fg rounded-md transition-colors inline-flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                      <span>Download Lemlist CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToCRM();
                      }}
                      className="px-3 py-1.5 text-[12px] font-medium border border-border bg-surface hover:bg-subtle text-fg rounded-md transition-colors inline-flex items-center gap-1.5 ml-auto"
                    >
                      <Building2 className="w-3.5 h-3.5 text-fg-muted" />
                      <span>View in Companies CRM</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Queue Items List */}
              <div className="border border-border rounded-lg divide-y divide-border/70 overflow-hidden bg-surface">
                {queue.map((item, idx) => {
                  const isDone = item.status === "completed";
                  const isBusy = item.status === "fetching" || item.status === "analyzing";
                  const isFail = item.status === "error";

                  return (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center justify-between text-[12px] hover:bg-subtle/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-6 h-6 rounded-md bg-subtle border border-border flex items-center justify-center shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          ) : isFail ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-fg-muted" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-fg truncate">
                              {item.record?.company_name || item.domain}
                            </span>
                            <span className="font-mono text-[11px] text-fg-muted">
                              {item.domain}
                            </span>
                          </div>
                          <span
                            className={`block truncate text-[11px] ${
                              isDone
                                ? "text-fg-secondary"
                                : isBusy
                                ? "text-accent font-medium"
                                : isFail
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-fg-muted"
                            }`}
                          >
                            {item.statusText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone && item.record && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onInspectLead(item.record!);
                            }}
                            className="px-2 py-1 text-[11px] font-medium border border-border rounded hover:bg-subtle text-fg inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 text-fg-muted" />
                          </button>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : isBusy
                              ? "bg-subtle text-accent font-semibold"
                              : isFail
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-subtle text-fg-muted"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-subtle/30 flex items-center justify-between shrink-0">
          <div>
            {isCompleted && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[12px] text-fg-muted hover:text-fg inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Batch</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 text-[12px] font-medium border border-border bg-surface hover:bg-subtle text-fg rounded-md transition-colors"
              >
                Stop Batch
              </button>
            ) : !isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-fg-secondary hover:text-fg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedDomains.length === 0}
                  onClick={handleStartBatch}
                  className="px-4 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>
                    Launch Batch ({parsedDomains.length}{" "}
                    {parsedDomains.length === 1 ? "domain" : "domains"})
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
