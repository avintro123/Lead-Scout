"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Trash2,
  Eye,
  Download,
  Search,
  Building2,
  Cloud,
  HardDrive,
  Filter,
  Plus,
  ArrowUpRight,
  Table,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { LeadRecord, ScoutResult } from "@/lib/types";
import { getLocalLeads, deleteLocalLead, getUserSettings } from "@/lib/storage";
import { calculateIcpScore, getTierBadgeStyle } from "@/lib/icp-scorer";
import {
  generateBulkCompaniesCSV,
  generateSingleCompanyCSV,
  triggerCSVDownload,
} from "@/lib/export-csv";

interface CompaniesViewProps {
  onLoadReport: (result: ScoutResult) => void;
  refreshTrigger: number;
  onCountUpdate: (count: number) => void;
  onNewResearch?: () => void;
  onOpenBatchModal?: () => void;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
}

export default function CompaniesView({
  onLoadReport,
  refreshTrigger,
  onCountUpdate,
  onNewResearch,
  onOpenBatchModal,
  isAdmin = false,
  onOpenAdminAuth,
}: CompaniesViewProps) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const settings = getUserSettings();

  const fetchLeads = async () => {
    setLoading(true);
    let cloudLeads: LeadRecord[] = [];
    let cloudReady = false;

    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      cloudLeads = data.leads || [];
      cloudReady = data.configured || false;
      setIsCloudConfigured(cloudReady);
    } catch {
      // ignore
    }

    // Merge with local storage leads
    const localLeads = getLocalLeads();

    // Map by domain to dedup
    const map = new Map<string, LeadRecord>();
    cloudLeads.forEach((l) => map.set(l.domain.toLowerCase(), l));
    localLeads.forEach((l) => {
      if (!map.has(l.domain.toLowerCase())) {
        map.set(l.domain.toLowerCase(), l);
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setLeads(merged);
    onCountUpdate(merged.length);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, domain: string) => {
    // If it's a cloud lead in Supabase, require admin authorization
    if (!id.startsWith("local_")) {
      if (!isAdmin) {
        if (onOpenAdminAuth) {
          onOpenAdminAuth();
        }
        return;
      }

      try {
        const res = await fetch("/api/leads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!res.ok) {
          if (res.status === 401 && onOpenAdminAuth) {
            onOpenAdminAuth();
          }
          return;
        }
      } catch (err) {
        console.error("Cloud lead deletion error:", err);
        return;
      }
    }

    // Delete from local storage
    deleteLocalLead(id);

    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== id && l.domain !== domain);
      onCountUpdate(updated.length);
      return updated;
    });
  };

  const handleExportMarkdown = (lead: LeadRecord) => {
    const result = lead.dossier_json;
    const d = result.dossier;
    let md = `# Executive Dossier: ${d.companyName}\n\n`;
    md += `**Domain:** ${d.domain}\n`;
    md += `**Generated:** ${new Date(result.timestamp).toLocaleString()}\n`;
    md += `**Industry:** ${d.industryTags?.join(", ") || "N/A"}\n\n`;
    md += `## Executive Summary\n${d.oneSentenceSummary}\n\n`;
    md += `## Target Audience\n${d.targetAudience}\n\n`;
    md += `## Value Propositions\n`;
    d.valuePropositions?.forEach((v) => (md += `- ${v}\n`));
    md += `\n## Identified Pain Points\n`;
    d.top3PainPoints?.forEach((p, i) => (md += `${i + 1}. ${p}\n`));

    if (result.emails?.length > 0) {
      md += `\n---\n\n## Outreach Sequence\n\n`;
      result.emails.forEach((e) => {
        md += `### ${e.label}\n**Subject:** ${e.subject}\n\n${e.body}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.companyName.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLeadCSV = (lead: LeadRecord) => {
    const d = lead.dossier_json.dossier;
    const emails = lead.dossier_json.emails || [];
    const csv = generateSingleCompanyCSV(d, emails, "apollo");
    triggerCSVDownload(
      csv,
      `${d.companyName.toLowerCase().replace(/\s+/g, "-")}-apollo.csv`
    );
  };

  const handleExportBulkApolloCSV = () => {
    const csv = generateBulkCompaniesCSV(filteredLeads, "apollo");
    triggerCSVDownload(
      csv,
      `leadscout-apollo-campaign-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleExportBulkLemlistCSV = () => {
    const csv = generateBulkCompaniesCSV(filteredLeads, "lemlist");
    triggerCSVDownload(
      csv,
      `leadscout-lemlist-campaign-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleExportAllJSON = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadscout-companies-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.dossier_json?.dossier?.industryTags?.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesObjective =
      selectedObjective === "all" || l.objective === selectedObjective;

    const matchesTier =
      selectedTier === "all" ||
      (() => {
        if (!l.dossier_json?.dossier) return false;
        const score = calculateIcpScore(l.dossier_json.dossier, settings);
        return score.tier === selectedTier;
      })();

    return matchesSearch && matchesObjective && matchesTier;
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-fg tracking-tight">Companies</h1>
          <p className="text-[13px] text-fg-muted mt-0.5">
            Directory of researched accounts, synthesized signals, and outreach cadences.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {leads.length > 0 && (
            <>
              <button
                onClick={handleExportBulkApolloCSV}
                className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md bg-surface hover:bg-subtle text-fg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                title="Export all leads as a CSV for Apollo.io / Instantly"
              >
                <Table className="w-3.5 h-3.5 text-accent" />
                <span>Export Apollo CSV</span>
              </button>

              <button
                onClick={handleExportBulkLemlistCSV}
                className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md bg-surface hover:bg-subtle text-fg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                title="Export all leads as a CSV for Lemlist / Smartlead"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lemlist CSV</span>
              </button>

              <button
                onClick={handleExportAllJSON}
                className="px-2.5 py-1.5 text-[12px] font-medium border border-border rounded-md bg-surface hover:bg-subtle text-fg-secondary hover:text-fg transition-colors inline-flex items-center gap-1"
                title="Download raw JSON archive"
              >
                <Download className="w-3 h-3 text-fg-muted" />
                <span>JSON</span>
              </button>
            </>
          )}

          {onOpenBatchModal && (
            <button
              onClick={onOpenBatchModal}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md bg-surface hover:bg-subtle text-fg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>Batch Ingest</span>
            </button>
          )}

          {onNewResearch && (
            <button
              onClick={onNewResearch}
              className="px-3.5 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Research</span>
            </button>
          )}
        </div>
      </div>

      {/* Storage Badge Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border bg-subtle/40 mb-6 text-[12px]">
        <div className="flex items-center gap-2">
          {isCloudConfigured ? (
            <>
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-fg">Supabase Cloud Database</span>
              <span className="text-fg-muted">· Real-time PostgreSQL sync active</span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-fg">Local Browser Workspace</span>
              <span className="text-fg-muted">
                · Offline-first persistence. Add Supabase in Settings to sync across devices.
              </span>
            </>
          )}
        </div>

        <span className="text-fg-muted font-medium tabular-nums">
          {leads.length} {leads.length === 1 ? "Company" : "Companies"} Saved
        </span>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
          <input
            type="text"
            placeholder="Search by company name, domain, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface border border-border rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2.5 py-1.5 text-[12px]">
          <Filter className="w-3.5 h-3.5 text-fg-muted" />
          <select
            value={selectedObjective}
            onChange={(e) => setSelectedObjective(e.target.value)}
            className="bg-transparent text-fg text-[12px] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Pitch Types</option>
            <option value="client_acquisition">Client Acquisition</option>
            <option value="partnership_inquiry">Partnership Inquiry</option>
            <option value="tech_stack_audit">Tech Stack Audit</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2.5 py-1.5 text-[12px]">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-transparent text-fg text-[12px] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All ICP Tiers</option>
            <option value="tier_1">Tier 1 · Priority (80+)</option>
            <option value="tier_2">Tier 2 · Qualified (60-79)</option>
            <option value="tier_3">Tier 3 · Nurture (&lt;60)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-border border-t-fg rounded-full animate-spin-slow" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-10 h-10 rounded-full bg-subtle border border-border flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-5 h-5 text-fg-muted" />
            </div>
            <p className="text-[14px] font-medium text-fg mb-1">
              {searchQuery ? "No matching companies found" : "No companies researched yet"}
            </p>
            <p className="text-[12px] text-fg-muted max-w-sm mx-auto mb-4">
              {searchQuery
                ? "Try searching for a different domain name or clear your filters."
                : "Enter any domain on the Research page to build your company dossier and outreach cadences."}
            </p>
            {onNewResearch && !searchQuery && (
              <button
                onClick={onNewResearch}
                className="px-3 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Launch First Research</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-subtle/30 text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-4">Objective</th>
                  <th className="py-2.5 px-4">ICP Fit</th>
                  <th className="py-2.5 px-4">Industry &amp; Size</th>
                  <th className="py-2.5 px-4">Signals</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead) => {
                  const d = lead.dossier_json?.dossier;
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-subtle/40 transition-colors group cursor-pointer"
                      onClick={() => onLoadReport(lead.dossier_json)}
                    >
                      {/* Company Name & Domain */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-subtle border border-border flex items-center justify-center text-fg font-semibold text-[11px] shrink-0">
                            {lead.company_name?.charAt(0) || lead.domain.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-fg block leading-tight">
                              {lead.company_name || lead.domain}
                            </span>
                            <span className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
                              <Globe className="w-2.5 h-2.5" />
                              {lead.domain}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Objective */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-fg-secondary border border-border capitalize">
                          {lead.objective?.replace(/_/g, " ") || "Acquisition"}
                        </span>
                      </td>

                      {/* ICP Fit Column */}
                      <td className="py-3 px-4">
                        {d ? (() => {
                          const scoreResult = calculateIcpScore(d, settings);
                          const tierStyle = getTierBadgeStyle(scoreResult.tier);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                              title={scoreResult.verdict}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                              <span>
                                {scoreResult.tier === "tier_1"
                                  ? "Tier 1"
                                  : scoreResult.tier === "tier_2"
                                  ? "Tier 2"
                                  : "Tier 3"}
                              </span>
                              <span className="font-mono opacity-80">({scoreResult.totalScore})</span>
                            </span>
                          );
                        })() : (
                          <span className="text-fg-muted text-[11px]">—</span>
                        )}
                      </td>

                      {/* Industry & Size */}
                      <td className="py-3 px-4">
                        <div className="text-[12px] text-fg-secondary">
                          <span>{d?.industryTags?.[0] || "B2B SaaS"}</span>
                          {d?.estimatedHeadcount && (
                            <span className="text-fg-muted block text-[11px]">
                              {d.estimatedHeadcount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Signals Count */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] text-fg-secondary">
                          {d?.top3PainPoints?.length || 3} friction angles
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[12px] text-fg-muted tabular-nums">
                        {new Date(lead.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onLoadReport(lead.dossier_json)}
                            className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-subtle transition-colors"
                            title="Open Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleExportLeadCSV(lead)}
                            className="p-1.5 rounded text-fg-muted hover:text-accent hover:bg-subtle transition-colors"
                            title="Export Apollo CSV"
                          >
                            <Table className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleExportMarkdown(lead)}
                            className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-subtle transition-colors"
                            title="Export Markdown"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(lead.id, lead.domain)}
                            className={`p-1.5 rounded transition-colors ${
                              !lead.id.startsWith("local_") && !isAdmin
                                ? "text-fg-muted hover:text-amber-600 hover:bg-amber-500/10"
                                : "text-fg-muted hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={
                              !lead.id.startsWith("local_") && !isAdmin
                                ? "Admin authentication required to delete cloud record"
                                : "Delete Record"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
