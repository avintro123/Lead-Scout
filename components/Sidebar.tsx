"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Building2,
  Settings,
  Sparkles,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";
import { getLocalLeads, getUserSettings, UserSettings } from "@/lib/storage";
import { LeadRecord, ScoutResult } from "@/lib/types";

export type View = "research" | "companies" | "settings";

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  companyCount: number;
  onSelectCompany?: (result: ScoutResult) => void;
  currentDomain?: string;
}

export default function Sidebar({
  activeView,
  onNavigate,
  companyCount,
  onSelectCompany,
  currentDomain,
}: SidebarProps) {
  const [recentLeads, setRecentLeads] = useState<LeadRecord[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    setRecentLeads(getLocalLeads().slice(0, 5));
    setSettings(getUserSettings());
  }, [companyCount]);

  // Global hotkeys (when not in input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "r" || e.key === "R") {
        onNavigate("research");
      } else if (e.key === "c" || e.key === "C") {
        onNavigate("companies");
      } else if (e.key === "s" || e.key === "S") {
        onNavigate("settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavigate]);

  const navItems = [
    {
      id: "research" as View,
      label: "Research",
      icon: Search,
      shortcut: "R",
      count: undefined,
    },
    {
      id: "companies" as View,
      label: "Companies",
      icon: Building2,
      shortcut: "C",
      count: companyCount > 0 ? companyCount : undefined,
    },
    {
      id: "settings" as View,
      label: "Settings",
      icon: Settings,
      shortcut: "S",
      count: undefined,
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 h-full bg-surface border-r border-border flex flex-col select-none text-[13px]">
      {/* Workspace Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-fg text-surface flex items-center justify-center font-semibold text-xs tracking-tight shadow-xs">
            LS
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-fg tracking-tight text-[13px] leading-tight">
              LeadScout
            </span>
            <span className="text-[11px] text-fg-muted font-normal leading-tight">
              {settings?.senderCompany || "Acquisition Workspace"}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-subtle text-fg-muted border border-border">
          v2.4
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-subtle text-fg font-semibold shadow-xs"
                      : "text-fg-secondary hover:text-fg hover:bg-subtle/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-fg" : "text-fg-muted"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.count !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-border/60 text-fg-secondary tabular-nums">
                        {item.count}
                      </span>
                    )}
                    <kbd className="hidden sm:inline-block text-[10px] text-fg-muted font-mono px-1 py-0.2 rounded border border-border/80 bg-subtle/50">
                      {item.shortcut}
                    </kbd>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Recent Researched Targets in Sidebar */}
        {recentLeads.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                Recent Targets
              </span>
              <button
                onClick={() => onNavigate("companies")}
                className="text-[11px] text-fg-muted hover:text-fg transition-colors"
                title="View all companies"
              >
                All ({companyCount})
              </button>
            </div>
            <div className="space-y-0.5">
              {recentLeads.map((lead) => {
                const isSelected = currentDomain === lead.domain && activeView === "research";
                return (
                  <button
                    key={lead.id}
                    onClick={() => {
                      if (onSelectCompany) {
                        onSelectCompany(lead.dossier_json);
                      }
                      onNavigate("research");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-colors group text-left ${
                      isSelected
                        ? "bg-subtle text-fg font-medium"
                        : "text-fg-secondary hover:bg-subtle/60 hover:text-fg"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded bg-border/50 flex items-center justify-center text-[9px] font-semibold text-fg-secondary shrink-0 uppercase">
                        {lead.company_name?.charAt(0) || lead.domain.charAt(0)}
                      </div>
                      <span className="truncate">
                        {lead.company_name || lead.domain}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Tips / Capabilities */}
        <div className="px-2 pt-2">
          <div className="p-3 rounded-lg border border-border bg-subtle/40 text-[12px]">
            <div className="flex items-center gap-1.5 font-medium text-fg mb-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Deep Scraping</span>
            </div>
            <p className="text-fg-muted leading-relaxed text-[11px]">
              Type any domain to run live DOM extraction, market positioning, and PAS outreach generation.
            </p>
          </div>
        </div>
      </div>

      {/* User / Workspace Footer (with adequate pb to clear dev indicators) */}
      <div className="p-3 border-t border-border pb-10">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-subtle/60 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-fg text-surface flex items-center justify-center text-[10px] font-semibold shrink-0">
              {settings?.senderName
                ? settings.senderName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "AR"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-medium text-fg truncate">
                {settings?.senderName || "Alex Rivera"}
              </span>
              <span className="text-[10px] text-fg-muted truncate">
                {settings?.senderRole || "GTM Workspace"}
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="System Ready" />
        </div>
      </div>
    </aside>
  );
}
