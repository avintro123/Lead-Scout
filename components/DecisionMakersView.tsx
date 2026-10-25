"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Zap,
  Target,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Briefcase,
  Layers,
  RotateCcw,
  UserCheck,
  Download,
} from "lucide-react";
import {
  DecisionMakerContact,
  CompanyDossier,
  Department,
  OutreachEmail,
} from "@/lib/types";
import {
  detectCompanyEmailPattern,
  generateCorporateEmail,
} from "@/lib/contact-discovery";
import {
  generateDecisionMakersCSV,
  triggerCSVDownload,
} from "@/lib/export-csv";

interface DecisionMakersViewProps {
  dossier: CompanyDossier;
  contacts: DecisionMakerContact[];
  selectedContact: DecisionMakerContact | null;
  onSelectContact: (contact: DecisionMakerContact) => void;
  onClearSelectedContact: () => void;
  onAddCustomContact?: (contact: DecisionMakerContact) => void;
}

const DEPARTMENTS: { id: Department | "all"; label: string }[] = [
  { id: "all", label: "All Roles" },
  { id: "Sales & Revenue", label: "Sales & Revenue" },
  { id: "Engineering & Tech", label: "Engineering & Tech" },
  { id: "Product", label: "Product" },
  { id: "Executive & Operations", label: "Executive" },
];

function getSeniorityBadgeStyle(seniority: string) {
  switch (seniority) {
    case "C-Level":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "VP":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Head / Director":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-subtle text-fg-secondary border-border";
  }
}

function getDepartmentColor(dept: Department) {
  switch (dept) {
    case "Sales & Revenue":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        ring: "ring-emerald-500/20",
      };
    case "Engineering & Tech":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
        ring: "ring-indigo-500/20",
      };
    case "Product":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        ring: "ring-amber-500/20",
      };
    case "Marketing & Growth":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        ring: "ring-rose-500/20",
      };
    case "Executive & Operations":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        ring: "ring-purple-500/20",
      };
    default:
      return {
        bg: "bg-subtle",
        text: "text-fg-secondary",
        border: "border-border",
        ring: "ring-border",
      };
  }
}

export default function DecisionMakersView({
  dossier,
  contacts,
  selectedContact,
  onSelectContact,
  onClearSelectedContact,
  onAddCustomContact,
}: DecisionMakersViewProps) {
  const [selectedDept, setSelectedDept] = useState<Department | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFirst, setCustomFirst] = useState("");
  const [customLast, setCustomLast] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDept, setCustomDept] = useState<Department>("Sales & Revenue");

  const patternInfo = detectCompanyEmailPattern(
    dossier.domain,
    dossier.estimatedHeadcount,
  );

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportContacts = () => {
    const csv = generateDecisionMakersCSV(dossier, contacts);
    triggerCSVDownload(
      csv,
      `${dossier.companyName.toLowerCase().replace(/\s+/g, "-")}-decision-makers.csv`,
    );
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesDept = selectedDept === "all" || c.department === selectedDept;
    const matchesQuery =
      searchQuery === "" ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.corporateEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const handleSaveCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFirst.trim() || !customLast.trim() || !customTitle.trim())
      return;

    const email = generateCorporateEmail(
      customFirst,
      customLast,
      dossier.domain,
      patternInfo.primaryPattern,
    );

    const newContact: DecisionMakerContact = {
      id: `custom_${Date.now()}`,
      firstName: customFirst.trim(),
      lastName: customLast.trim(),
      fullName: `${customFirst.trim()} ${customLast.trim()}`,
      title: customTitle.trim(),
      department: customDept,
      seniority:
        customTitle.toLowerCase().includes("chief") ||
        customTitle.toLowerCase().includes("ceo") ||
        customTitle.toLowerCase().includes("cto")
          ? "C-Level"
          : customTitle.toLowerCase().includes("vp")
            ? "VP"
            : "Head / Director",
      corporateEmail: email,
      emailConfidence: patternInfo.confidence,
      patternUsed: patternInfo.primaryPattern.replace(
        "{domain}",
        dossier.domain,
      ),
      departmentPainPoint: `Optimizing department workflows and execution velocity for ${customDept.toLowerCase()}.`,
      talkingAngle: `Streamlining operations and increasing leverage for ${customTitle}.`,
      suggestedHook: `Aligning with ${customTitle} initiatives across ${dossier.companyName}.`,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        `${customFirst} ${customLast} ${dossier.companyName}`,
      )}`,
      isVerifiedPattern: false,
    };

    onAddCustomContact?.(newContact);
    setShowAddModal(false);
    setCustomFirst("");
    setCustomLast("");
    setCustomTitle("");
  };

  return (
    <div className="space-y-6">
      {/* Active Persona Banner */}
      {selectedContact && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-2xs">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-emerald-950">
                  Target Persona Active: {selectedContact.fullName}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedContact.title}
                </span>
              </div>
              <p className="text-[12px] text-emerald-800 mt-0.5">
                4-touch sequence in the Outreach tab is customized for{" "}
                {selectedContact.corporateEmail} ({selectedContact.department}).
              </p>
            </div>
          </div>
          <button
            onClick={onClearSelectedContact}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to General</span>
          </button>
        </div>
      )}

      {/* Pattern Detection & Heuristics Bar */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-fg tracking-tight">
                Corporate Email Pattern Recognition
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {patternInfo.confidence}% Confidence
              </span>
            </div>
            <p className="text-[13px] text-fg-secondary">
              Based on {dossier.companyName}&apos;s scale (
              {dossier.estimatedHeadcount}), the dominant email convention is{" "}
              <code className="px-1.5 py-0.5 rounded bg-subtle text-fg font-mono text-[12px] border border-border font-semibold">
                {patternInfo.primaryPattern}
              </code>
            </p>
          </div>

          {/* Alternative pattern chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {patternInfo.patterns.map((p, idx) => (
              <div
                key={idx}
                className={`px-2.5 py-1.5 rounded-md border text-[11px] font-mono flex items-center gap-2 ${
                  p.isLikelyPrimary
                    ? "bg-fg text-surface border-fg font-medium shadow-2xs"
                    : "bg-subtle text-fg-secondary border-border"
                }`}
              >
                <span>{p.pattern}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded ${
                    p.isLikelyPrimary
                      ? "bg-surface/20 text-surface"
                      : "bg-surface text-fg-muted border border-border/60"
                  }`}
                >
                  {p.confidenceScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md whitespace-nowrap transition-colors border ${
                selectedDept === dept.id
                  ? "bg-fg text-surface border-fg shadow-xs"
                  : "bg-surface text-fg-secondary border-border hover:bg-subtle hover:text-fg"
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        {/* Search & Add Custom Lead */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-fg-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-surface border border-border rounded-md text-fg placeholder:text-fg-muted focus:outline-hidden focus:border-fg transition-colors"
            />
          </div>

          <button
            onClick={handleExportContacts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-surface text-fg border border-border rounded-md hover:bg-subtle transition-colors shadow-2xs shrink-0"
            title="Download CSV of all discovered decision-makers"
          >
            <Download className="w-3.5 h-3.5 text-fg-muted" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Personas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.map((contact) => {
          const isSelected = selectedContact?.id === contact.id;
          const deptColors = getDepartmentColor(contact.department);

          return (
            <div
              key={contact.id}
              className={`bg-surface border rounded-lg p-5 transition-all duration-150 flex flex-col justify-between gap-4 ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20"
                  : "border-border hover:border-fg/40 shadow-xs"
              }`}
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border shrink-0 ${deptColors.bg} ${deptColors.text} ${deptColors.border}`}
                    >
                      {contact.firstName.charAt(0)}
                      {contact.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-semibold text-fg tracking-tight">
                          {contact.fullName}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getSeniorityBadgeStyle(
                            contact.seniority,
                          )}`}
                        >
                          {contact.seniority}
                        </span>
                      </div>
                      <p className="text-[12px] text-fg-secondary font-medium">
                        {contact.title}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${deptColors.bg} ${deptColors.text} ${deptColors.border}`}
                  >
                    {contact.department}
                  </span>
                </div>

                {/* Email Address with Copy & Confidence */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-subtle/80 border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                    <span className="text-[12px] font-mono text-fg font-medium truncate">
                      {contact.corporateEmail}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        contact.emailConfidence >= 90
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                      title={`Calculated via ${contact.patternUsed} pattern`}
                    >
                      {contact.emailConfidence}% Match
                    </span>
                    <button
                      onClick={() =>
                        handleCopyEmail(contact.corporateEmail, contact.id)
                      }
                      className="p-1 rounded text-fg-muted hover:text-fg hover:bg-surface border border-transparent hover:border-border transition-colors"
                      title="Copy email to clipboard"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Department Priority / Pain Point Callout */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-fg-muted tracking-wider">
                    Role-Specific Operational Focus
                  </span>
                  <p className="text-[12px] text-fg-secondary leading-relaxed bg-surface p-2.5 rounded border border-border/80">
                    &ldquo;{contact.departmentPainPoint}&rdquo;
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <a
                  href={contact.linkedinSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-fg-secondary hover:text-fg transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-fg-muted" />
                  <span>Verify on LinkedIn</span>
                </a>

                <button
                  onClick={() => onSelectContact(contact)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors shadow-xs ${
                    isSelected
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-fg hover:bg-fg/90 text-surface"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Targeting This Lead</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Personalize Outreach</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredContacts.length === 0 && (
        <div className="p-8 text-center bg-surface border border-border rounded-lg">
          <p className="text-sm text-fg-muted">
            No contacts match the selected filter. Try choosing &ldquo;All
            Roles&rdquo; or add a custom lead.
          </p>
        </div>
      )}

      {/* Add Custom Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-fg" />
                <h3 className="text-sm font-semibold text-fg">
                  Add Decision Maker / Lead
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-fg-muted hover:text-fg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomContact} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah"
                    value={customFirst}
                    onChange={(e) => setCustomFirst(e.target.value)}
                    className="w-full px-3 py-1.5 text-[13px] bg-subtle border border-border rounded-md text-fg focus:outline-hidden focus:border-fg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Connor"
                    value={customLast}
                    onChange={(e) => setCustomLast(e.target.value)}
                    className="w-full px-3 py-1.5 text-[13px] bg-subtle border border-border rounded-md text-fg focus:outline-hidden focus:border-fg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                  Exact Job Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VP of Engineering"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] bg-subtle border border-border rounded-md text-fg focus:outline-hidden focus:border-fg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                  Department
                </label>
                <select
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value as Department)}
                  className="w-full px-3 py-1.5 text-[13px] bg-subtle border border-border rounded-md text-fg focus:outline-hidden focus:border-fg"
                >
                  <option value="Sales & Revenue">Sales & Revenue</option>
                  <option value="Engineering & Tech">Engineering & Tech</option>
                  <option value="Product">Product</option>
                  <option value="Marketing & Growth">Marketing & Growth</option>
                  <option value="Executive & Operations">
                    Executive & Operations
                  </option>
                </select>
              </div>

              {customFirst && customLast && (
                <div className="p-3 bg-subtle border border-border rounded-md text-[12px]">
                  <span className="text-fg-muted block text-[11px] mb-1">
                    Estimated Email Preview ({patternInfo.primaryPattern})
                  </span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {generateCorporateEmail(
                      customFirst,
                      customLast,
                      dossier.domain,
                      patternInfo.primaryPattern,
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-[12px] text-fg-secondary hover:text-fg rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 transition-colors shadow-xs"
                >
                  Add & Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
