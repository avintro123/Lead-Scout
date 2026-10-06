"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Sparkles,
  Globe,
  Building2,
  Settings,
  ExternalLink,
  Download,
  Table,
  FileText,
  Copy,
  Check,
  Target,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  Plus,
  CornerDownLeft,
  X,
} from "lucide-react";
import {
  CompanyDossier,
  OutreachEmail,
  ScoutResult,
  OutreachObjective,
  LeadRecord,
  OBJECTIVES,
} from "@/lib/types";
import { getLocalLeads } from "@/lib/storage";
import { PRESET_COMPANIES, getFallbackDossier } from "@/lib/mock-data";
import { generateSingleCompanyCSV, triggerCSVDownload } from "@/lib/export-csv";

export type View = "research" | "companies" | "settings";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onSelectCompany: (result: ScoutResult) => void;
  onScoutDomain: (domain: string) => void;
  onSetObjective?: (objective: OutreachObjective) => void;
  currentObjective?: OutreachObjective;
  currentDossier?: CompanyDossier | null;
  currentEmails?: OutreachEmail[] | null;
  onOpenBatchScout?: () => void;
}

interface CommandItem {
  id: string;
  category:
    | "Scout Action"
    | "Companies"
    | "Navigation"
    | "Outreach Objective"
    | "Quick Exports";
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectCompany,
  onScoutDomain,
  onSetObjective,
  currentObjective = "client_acquisition",
  currentDossier,
  currentEmails,
  onOpenBatchScout,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Load saved and preset companies
  const allCompanies = useMemo(() => {
    const localLeads = getLocalLeads();
    const map = new Map<string, ScoutResult>();

    // 1. Add presets
    Object.values(PRESET_COMPANIES).forEach((preset) => {
      map.set(preset.domain, {
        dossier: preset.dossier,
        emails:
          preset.emails[currentObjective] || preset.emails.client_acquisition,
        timestamp: new Date().toISOString(),
      });
    });

    // 2. Add local leads (overwrites presets with newer saved leads)
    localLeads.forEach((l) => {
      if (l.dossier_json?.dossier) {
        map.set(l.domain, l.dossier_json);
      }
    });

    return Array.from(map.values());
  }, [isOpen, currentObjective]);

  // Handle markdown dossier download
  const handleExportMarkdown = (
    d: CompanyDossier,
    emails?: OutreachEmail[] | null,
  ) => {
    let md = `# Executive Dossier: ${d.companyName}\n\n`;
    md += `**Domain:** ${d.domain}\n`;
    md += `**Industry:** ${d.industryTags.join(", ")}\n`;
    md += `**Summary:** ${d.oneSentenceSummary}\n\n`;
    md += `## Target Audience\n${d.targetAudience}\n\n`;
    md += `## Key Value Propositions\n`;
    d.valuePropositions.forEach((vp) => (md += `- ${vp}\n`));
    md += `\n## Identified Pain Points\n`;
    d.top3PainPoints.forEach((pp, i) => (md += `${i + 1}. ${pp}\n`));

    if (emails && emails.length > 0) {
      md += `\n## Personalized Outreach Sequences\n\n`;
      emails.forEach((e, idx) => {
        md += `### Touch ${idx + 1}: ${e.label} (${e.type})\n`;
        md += `**Subject:** ${e.subject}\n\n`;
        md += `${e.body}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.companyName.toLowerCase().replace(/\s+/g, "-")}-dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build filtered command items
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];
    const q = search.trim().toLowerCase();

    // 1. Direct Scout Intent (when query contains a domain pattern or "scout")
    const cleanDomainCandidate = q
      .replace(/^scout\s+/i, "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .trim();

    if (
      cleanDomainCandidate.length >= 3 &&
      cleanDomainCandidate.includes(".")
    ) {
      list.push({
        id: `scout-${cleanDomainCandidate}`,
        category: "Scout Action",
        title: `Scout & analyze: "${cleanDomainCandidate}"`,
        subtitle:
          "Launch live website extraction & Gemini intelligence synthesis",
        badge: "Press ↵",
        icon: Sparkles,
        perform: () => {
          onScoutDomain(cleanDomainCandidate);
          onClose();
        },
      });
    }

    // 2. Companies (Saved & Presets)
    allCompanies
      .filter((c) => {
        if (!q) return true;
        const nameMatch = c.dossier.companyName.toLowerCase().includes(q);
        const domainMatch = c.dossier.domain.toLowerCase().includes(q);
        const industryMatch = c.dossier.industryTags?.some((t) =>
          t.toLowerCase().includes(q),
        );
        const summaryMatch = c.dossier.oneSentenceSummary
          ?.toLowerCase()
          .includes(q);
        return nameMatch || domainMatch || industryMatch || summaryMatch;
      })
      .slice(0, 5)
      .forEach((c) => {
        list.push({
          id: `company-${c.dossier.domain}`,
          category: "Companies",
          title: c.dossier.companyName,
          subtitle: `${c.dossier.domain} · ${c.dossier.industryTags?.slice(0, 2).join(", ")}`,
          badge: c.dossier.estimatedHeadcount || "Profile",
          icon: Globe,
          perform: () => {
            onSelectCompany(c);
            onClose();
          },
        });
      });

    // 3. Quick Actions & Navigation
    const navActions: {
      id: View;
      title: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [
      {
        id: "research",
        title: "Go to Research Workspace",
        subtitle: "Scout new domains and inspect active dossiers",
        icon: Search,
      },
      {
        id: "companies",
        title: "Go to Companies Directory (CRM)",
        subtitle: "View, filter, and bulk export saved target accounts",
        icon: Building2,
      },
      {
        id: "settings",
        title: "Go to Settings & API Keys",
        subtitle: "Manage Gemini API key and sender identity",
        icon: Settings,
      },
    ];

    navActions
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q),
      )
      .forEach((a) => {
        list.push({
          id: `nav-${a.id}`,
          category: "Navigation",
          title: a.title,
          subtitle: a.subtitle,
          icon: a.icon,
          perform: () => {
            onNavigate(a.id);
            onClose();
          },
        });
      });

    // 4. Outreach Objective Switching
    if (onSetObjective) {
      const objectivesList: {
        key: OutreachObjective;
        title: string;
        desc: string;
        icon: React.ComponentType<{ className?: string }>;
      }[] = [
        {
          key: "client_acquisition",
          title: "Set Objective: Client Acquisition",
          desc: "Pain-Agitate-Solution cold pitches focused on operational ROI",
          icon: Target,
        },
        {
          key: "partnership_inquiry",
          title: "Set Objective: Partnership Inquiry",
          desc: "Co-marketing, ecosystem integration, and distribution proposals",
          icon: Briefcase,
        },
        {
          key: "tech_stack_audit",
          title: "Set Objective: Tech Stack Audit",
          desc: "Architecture teardown, latency optimization, and infrastructure angles",
          icon: ShieldCheck,
        },
      ];

      objectivesList
        .filter(
          (o) =>
            !q ||
            o.title.toLowerCase().includes(q) ||
            o.desc.toLowerCase().includes(q),
        )
        .forEach((o) => {
          list.push({
            id: `obj-${o.key}`,
            category: "Outreach Objective",
            title: o.title,
            subtitle: o.desc,
            badge: currentObjective === o.key ? "Active" : undefined,
            icon: o.icon,
            perform: () => {
              onSetObjective(o.key);
              onClose();
            },
          });
        });
    }

    // 5. Active Company Exports & Actions (if active company loaded)
    if (currentDossier) {
      const exportActions: {
        id: string;
        title: string;
        subtitle: string;
        icon: React.ComponentType<{ className?: string }>;
        perform: () => void;
      }[] = [
        {
          id: "export-apollo",
          title: `Export Apollo / Instantly CSV for ${currentDossier.companyName}`,
          subtitle:
            "Generate RFC 4180 CSV with multi-touch email sequence columns",
          icon: Table,
          perform: () => {
            const csv = generateSingleCompanyCSV(
              currentDossier,
              currentEmails || null,
              "apollo",
            );
            triggerCSVDownload(
              csv,
              `${currentDossier.companyName.toLowerCase().replace(/\s+/g, "-")}-apollo-campaign.csv`,
            );
            onClose();
          },
        },
        {
          id: "export-lemlist",
          title: `Export Lemlist CSV for ${currentDossier.companyName}`,
          subtitle:
            "Optimized format with touch steps for Lemlist campaign importer",
          icon: Table,
          perform: () => {
            const csv = generateSingleCompanyCSV(
              currentDossier,
              currentEmails || null,
              "lemlist",
            );
            triggerCSVDownload(
              csv,
              `${currentDossier.companyName.toLowerCase().replace(/\s+/g, "-")}-lemlist-campaign.csv`,
            );
            onClose();
          },
        },
        {
          id: "export-markdown",
          title: `Export Executive Dossier (.md) for ${currentDossier.companyName}`,
          subtitle:
            "Download comprehensive sales brief and full intelligence report",
          icon: FileText,
          perform: () => {
            handleExportMarkdown(currentDossier, currentEmails);
            onClose();
          },
        },
        {
          id: "copy-summary",
          title: `Copy Executive Summary for ${currentDossier.companyName}`,
          subtitle: currentDossier.oneSentenceSummary.slice(0, 80) + "...",
          icon: Copy,
          perform: () => {
            navigator.clipboard.writeText(currentDossier.oneSentenceSummary);
            setCopiedText("Copied summary!");
            setTimeout(() => {
              setCopiedText(null);
              onClose();
            }, 600);
          },
        },
      ];

      exportActions
        .filter((a) => !q || a.title.toLowerCase().includes(q))
        .forEach((a) => {
          list.push({
            id: a.id,
            category: "Quick Exports",
            title: a.title,
            subtitle: a.subtitle,
            icon: a.icon,
            perform: a.perform,
          });
        });
    }

    return list;
  }, [
    search,
    allCompanies,
    currentDossier,
    currentEmails,
    currentObjective,
    onNavigate,
    onSelectCompany,
    onScoutDomain,
    onSetObjective,
    onClose,
  ]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + items.length) % Math.max(1, items.length),
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].perform();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border bg-surface">
          <Search className="w-4 h-4 text-fg-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies, actions, or type a domain (e.g. stripe.com)..."
            className="flex-1 bg-transparent text-[14px] text-fg placeholder:text-fg-muted outline-none font-normal"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 rounded-md text-fg-muted hover:text-fg hover:bg-subtle transition-colors mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-fg-muted bg-subtle border border-border/80 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-fg-muted text-[13px] space-y-2">
              <Search className="w-6 h-6 mx-auto text-fg-faint" />
              <p>No results found for &ldquo;{search}&rdquo;</p>
              <p className="text-[11px] text-fg-secondary">
                Type a valid domain like{" "}
                <code className="font-mono text-fg">slack.com</code> to trigger
                live research.
              </p>
            </div>
          ) : (
            (() => {
              let currentCat = "";
              return items.map((item, idx) => {
                const showHeader = item.category !== currentCat;
                currentCat = item.category;
                const isSelected = selectedIndex === idx;
                const IconComponent = item.icon;

                return (
                  <div key={item.id}>
                    {showHeader && (
                      <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                        {item.category}
                      </div>
                    )}
                    <button
                      type="button"
                      data-index={idx}
                      onClick={() => item.perform()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors ${
                        isSelected
                          ? "bg-subtle text-fg font-medium shadow-2xs"
                          : "text-fg-secondary hover:text-fg hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-surface border-border text-fg"
                              : "bg-subtle/60 border-border/60 text-fg-muted"
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-fg font-medium text-[13px]">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block truncate text-[11px] text-fg-muted">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              isSelected
                                ? "bg-surface border border-border text-fg"
                                : "bg-subtle text-fg-muted"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-fg-muted" />
                        )}
                      </div>
                    </button>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-border bg-subtle/40 flex items-center justify-between text-[11px] text-fg-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface border border-border/80 font-mono text-[9px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.2 rounded bg-surface border border-border/80 font-mono text-[9px]">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-surface border border-border/80 font-mono text-[9px]">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface border border-border/80 font-mono text-[9px]">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-fg-secondary">
            {copiedText ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                {copiedText}
              </span>
            ) : (
              <span>LeadScout Command Engine</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
