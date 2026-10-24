"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Send,
  Mail,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Layers,
  X,
  FileCode,
  ArrowRight,
  Eye,
} from "lucide-react";
import { OutreachEmail, CompanyDossier } from "@/lib/types";
import { getUserSettings, saveUserSettings } from "@/lib/storage";
import { isValidEmail, getEmailPreheader, compileHtmlEmail } from "@/lib/email-renderer";
import { analyzeEmailDeliverability } from "@/lib/spam-checker";

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: CompanyDossier;
  currentEmail: OutreachEmail;
  allEmails: OutreachEmail[];
  activeTouchIndex: number;
  targetContactEmail?: string;
}

type ModalTab = "dispatch" | "preview" | "diagnostics";
type DeviceView = "gmail_desktop" | "apple_mobile";

export default function TestEmailModal({
  isOpen,
  onClose,
  dossier,
  currentEmail,
  allEmails,
  activeTouchIndex,
  targetContactEmail,
}: TestEmailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("dispatch");
  const [deviceView, setDeviceView] = useState<DeviceView>("gmail_desktop");
  const [mobileScreen, setMobileScreen] = useState<"list" | "body">("body");

  // Dispatch state
  const [recipient, setRecipient] = useState("");
  const [mode, setMode] = useState<"single" | "all">("single");
  const [provider, setProvider] = useState<"resend" | "simulation">("simulation");
  const [customResendKey, setCustomResendKey] = useState("");
  const [saveKeyToSettings, setSaveKeyToSettings] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message?: string;
    messageId?: string;
    deliveredAt?: string;
    isSimulated?: boolean;
    error?: string;
  } | null>(null);

  const [copiedHtml, setCopiedHtml] = useState(false);

  // Settings & user persona
  const settings = useMemo(() => getUserSettings(), []);

  useEffect(() => {
    if (isOpen) {
      const s = getUserSettings();
      if (targetContactEmail) {
        setRecipient(targetContactEmail);
      } else if (s.testRecipientEmail && !recipient) {
        setRecipient(s.testRecipientEmail);
      }
      if (s.resendApiKey && !customResendKey) {
        setCustomResendKey(s.resendApiKey);
      }
      if (s.preferredDeliveryProvider) {
        setProvider(s.preferredDeliveryProvider);
      }
      setSendResult(null);
    }
  }, [isOpen, targetContactEmail]);

  // Personalized body helper
  const resolvedBody = useMemo(() => {
    return currentEmail.body
      .replace(/\[Name\]/g, "Alex")
      .replace(/\[Your Name\]/g, settings.senderName || "Alex Rivera")
      .replace(/\[Company\]/g, dossier.companyName);
  }, [currentEmail.body, settings.senderName, dossier.companyName]);

  const resolvedSubject = useMemo(() => {
    return currentEmail.subject
      .replace(/\[Company\]/g, dossier.companyName)
      .replace(/\[Name\]/g, "Alex");
  }, [currentEmail.subject, dossier.companyName]);

  const preheaderSnippet = useMemo(
    () => getEmailPreheader(resolvedBody, 85),
    [resolvedBody]
  );

  const wordCount = useMemo(
    () => resolvedBody.trim().split(/\s+/).filter(Boolean).length,
    [resolvedBody]
  );

  const spamAnalysis = useMemo(
    () => analyzeEmailDeliverability(resolvedSubject, resolvedBody),
    [resolvedSubject, resolvedBody]
  );

  const rawHtmlCode = useMemo(() => {
    return compileHtmlEmail({
      subject: resolvedSubject,
      body: resolvedBody,
      senderName: settings.senderName,
      senderRole: settings.senderRole,
      senderCompany: settings.senderCompany,
      companyName: dossier.companyName,
      touchLabel: currentEmail.label,
      touchIndex: activeTouchIndex + 1,
      totalTouches: allEmails.length || 4,
      isTestPreview: true,
    });
  }, [
    resolvedSubject,
    resolvedBody,
    settings.senderName,
    settings.senderRole,
    settings.senderCompany,
    dossier.companyName,
    currentEmail.label,
    activeTouchIndex,
    allEmails.length,
  ]);

  if (!isOpen) return null;

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(recipient)) {
      setSendResult({
        success: false,
        error: "Please enter a valid recipient email address (e.g. alex@yourdomain.com).",
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    // Save preferences
    saveUserSettings({
      testRecipientEmail: recipient.trim(),
      preferredDeliveryProvider: provider,
      ...(saveKeyToSettings && customResendKey.trim()
        ? { resendApiKey: customResendKey.trim() }
        : {}),
    });

    try {
      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipient.trim(),
          subject: resolvedSubject,
          body: resolvedBody,
          provider,
          customResendKey: customResendKey.trim() || undefined,
          senderName: settings.senderName,
          senderCompany: settings.senderCompany,
          senderRole: settings.senderRole,
          companyName: dossier.companyName,
          touchLabel: currentEmail.label,
          touchIndex: activeTouchIndex + 1,
          totalTouches: allEmails.length || 4,
          mode,
          allEmails: mode === "all" ? allEmails : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendResult({
          success: false,
          error: data.error || "Failed to dispatch test email.",
        });
      } else {
        setSendResult({
          success: true,
          message: data.notice || "Email dispatched successfully!",
          messageId: data.messageId,
          deliveredAt: data.deliveredAt,
          isSimulated: data.isSimulated,
        });
      }
    } catch {
      setSendResult({
        success: false,
        error: "Network error occurred while connecting to delivery engine.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(rawHtmlCode);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-fg">
                  Outreach Test Sender &amp; Inbox Simulator
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-subtle text-fg-muted border border-border">
                  {dossier.companyName}
                </span>
              </div>
              <p className="text-[12px] text-fg-muted">
                Dispatch a real test to your inbox or inspect live device rendering across clients.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-border bg-subtle/30 flex items-center justify-between shrink-0">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("dispatch")}
              className={`px-3.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "dispatch"
                  ? "border-fg text-fg font-semibold"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Live Test Dispatch</span>
            </button>

            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "border-fg text-fg font-semibold"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Device &amp; Client Preview</span>
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`px-3.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "diagnostics"
                  ? "border-fg text-fg font-semibold"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Deliverability &amp; Headers</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-fg-muted">
            <span className="font-medium text-fg">{wordCount} words</span>
            <span>·</span>
            <span
              className={`font-medium ${
                spamAnalysis.score === 0
                  ? "text-emerald-600"
                  : spamAnalysis.score < 50
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {spamAnalysis.recommendation}
            </span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface">
          {/* TAB 1: LIVE DISPATCH */}
          {activeTab === "dispatch" && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <form onSubmit={handleSendTestEmail} className="space-y-4">
                {/* Recipient Input */}
                <div>
                  <label className="block text-[12px] font-medium text-fg mb-1.5">
                    Your Test Recipient Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. founder@yourcompany.com"
                      required
                      className="w-full px-3.5 py-2.5 text-[13px] bg-subtle/40 border border-border rounded-lg text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                    />
                    {isValidEmail(recipient) && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-fg-muted mt-1">
                    Send directly to your inbox to check desktop/mobile formatting and spam classification.
                  </p>
                </div>

                {/* Scope Selection: Single Touch vs All Touches */}
                <div>
                  <label className="block text-[12px] font-medium text-fg mb-1.5">
                    Dispatch Scope
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setMode("single")}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        mode === "single"
                          ? "bg-surface border-fg ring-1 ring-fg/20 shadow-xs"
                          : "bg-surface border-border hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-fg">
                          Touch {activeTouchIndex + 1} Only
                        </span>
                        {mode === "single" && <span className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-[11px] text-fg-muted block truncate">
                        {currentEmail.label} ({currentEmail.type.replace("_", " ")})
                      </span>
                    </label>

                    <label
                      onClick={() => setMode("all")}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        mode === "all"
                          ? "bg-surface border-fg ring-1 ring-fg/20 shadow-xs"
                          : "bg-surface border-border hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-fg">
                          Full 4-Touch Cadence
                        </span>
                        {mode === "all" && <span className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-[11px] text-fg-muted block truncate">
                        Single digest email featuring Day 1, 4, 7 &amp; 11
                      </span>
                    </label>
                  </div>
                </div>

                {/* Delivery Engine: Sandbox vs Resend */}
                <div>
                  <label className="block text-[12px] font-medium text-fg mb-1.5">
                    Delivery Engine
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProvider("simulation")}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        provider === "simulation"
                          ? "bg-surface border-fg ring-1 ring-fg/20 shadow-xs"
                          : "bg-surface border-border hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-fg flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          Sandbox Simulation
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Instant / Zero Setup
                        </span>
                      </div>
                      <p className="text-[11px] text-fg-muted leading-tight">
                        Tests email compilation, validation, MIME headers, and client rendering with zero API keys required.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider("resend")}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        provider === "resend"
                          ? "bg-surface border-fg ring-1 ring-fg/20 shadow-xs"
                          : "bg-surface border-border hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-fg flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-fg" />
                          Resend API (Live Send)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-subtle text-fg border border-border">
                          Real Inbox
                        </span>
                      </div>
                      <p className="text-[11px] text-fg-muted leading-tight">
                        Dispatches actual physical email to your inbox using Resend transactional infrastructure.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Resend API Key Field if Resend selected */}
                {provider === "resend" && (
                  <div className="p-3.5 rounded-lg border border-border bg-subtle/40 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-fg">
                        Resend API Key
                      </label>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
                      >
                        Get free key at Resend.com
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={customResendKey}
                      onChange={(e) => setCustomResendKey(e.target.value)}
                      placeholder="re_..."
                      className="w-full px-3 py-2 text-[12px] font-mono bg-surface border border-border rounded-md text-fg focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20"
                    />
                    <div className="flex items-center justify-between text-[11px] text-fg-muted">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveKeyToSettings}
                          onChange={(e) => setSaveKeyToSettings(e.target.checked)}
                          className="rounded border-border text-fg focus:ring-0"
                        />
                        <span>Remember key in browser settings</span>
                      </label>
                      <span>Uses onboarding@resend.dev</span>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSending || !isValidEmail(recipient)}
                    className="w-full py-2.5 px-4 rounded-lg bg-fg text-surface text-[13px] font-medium hover:bg-fg/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dispatching Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {provider === "resend"
                            ? `Dispatch Test to ${recipient || "Inbox"}`
                            : `Run Sandbox Test Send`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Result Feedback Banner */}
              {sendResult && (
                <div
                  className={`p-4 rounded-lg border text-[12px] animate-fade-in ${
                    sendResult.success
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/80 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {sendResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <span className="font-semibold block">
                        {sendResult.success
                          ? sendResult.isSimulated
                            ? "Sandbox Delivery Verified Successfully"
                            : "Live Email Dispatched via Resend"
                          : "Delivery Failed"}
                      </span>
                      <p className="text-[12px] leading-relaxed">
                        {sendResult.success ? sendResult.message : sendResult.error}
                      </p>
                      {sendResult.messageId && (
                        <div className="pt-1.5 flex items-center gap-2 font-mono text-[10px] text-emerald-800">
                          <span>Message-ID: {sendResult.messageId}</span>
                          <span>·</span>
                          <span>Delivered: {new Date(sendResult.deliveredAt || "").toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEVICE & CLIENT PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-5 animate-fade-in">
              {/* Device Selector Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Client Viewport:
                  </span>
                  <div className="inline-flex rounded-md border border-border p-0.5 bg-subtle/50">
                    <button
                      type="button"
                      onClick={() => setDeviceView("gmail_desktop")}
                      className={`px-3 py-1 rounded text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                        deviceView === "gmail_desktop"
                          ? "bg-surface text-fg shadow-2xs font-semibold"
                          : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Gmail Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceView("apple_mobile")}
                      className={`px-3 py-1 rounded text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                        deviceView === "apple_mobile"
                          ? "bg-surface text-fg shadow-2xs font-semibold"
                          : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Apple Mail (iPhone)</span>
                    </button>
                  </div>
                </div>

                {deviceView === "apple_mobile" && (
                  <div className="inline-flex rounded-md border border-border p-0.5 bg-subtle/50 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMobileScreen("list")}
                      className={`px-2.5 py-0.5 rounded transition-colors ${
                        mobileScreen === "list"
                          ? "bg-surface text-fg font-medium shadow-2xs"
                          : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      Inbox Snippet
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileScreen("body")}
                      className={`px-2.5 py-0.5 rounded transition-colors ${
                        mobileScreen === "body"
                          ? "bg-surface text-fg font-medium shadow-2xs"
                          : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      Open Email
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Truncation Warning */}
              {resolvedSubject.length > 50 && (
                <div className="px-3.5 py-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Mobile Cutoff Notice:</strong> Subject is {resolvedSubject.length} characters (typical mobile cut-off is ~45-50 characters).
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-700">
                    Preview: &quot;{resolvedSubject.slice(0, 48)}...&quot;
                  </span>
                </div>
              )}

              {/* Viewport 1: Gmail Desktop Mock */}
              {deviceView === "gmail_desktop" && (
                <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs bg-[#f6f8fc]">
                  {/* Gmail Top Bar */}
                  <div className="bg-white px-4 py-2.5 border-b border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px] text-fg-muted">
                      <span className="font-semibold text-slate-800">Inbox</span>
                      <span>›</span>
                      <span className="text-fg-secondary">LeadScout Outbound</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-fg-muted">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        SPF: Pass
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        DKIM: Signed
                      </span>
                    </div>
                  </div>

                  {/* Gmail Message Container */}
                  <div className="bg-white m-3 p-5 rounded-lg border border-border/60 shadow-2xs space-y-4">
                    {/* Subject Line & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-[16px] font-semibold text-slate-900 leading-snug">
                        {resolvedSubject}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 shrink-0">
                        Inbox
                      </span>
                    </div>

                    {/* Sender Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[13px]">
                          {(settings.senderName || "A").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="font-bold text-slate-900">
                              {settings.senderName || "Alex Rivera"}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              &lt;onboarding@resend.dev&gt;
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            to <strong className="text-slate-700">me</strong>
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div className="text-[14px] text-slate-800 leading-relaxed font-sans whitespace-pre-wrap py-2">
                      {resolvedBody}
                    </div>

                    {/* Signature */}
                    <div className="pt-3 border-t border-slate-100 text-[12px] text-slate-600">
                      <div className="font-semibold text-slate-900">{settings.senderName}</div>
                      <div>{settings.senderRole} · {settings.senderCompany}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport 2: Apple Mail iPhone Mock */}
              {deviceView === "apple_mobile" && (
                <div className="max-w-[340px] mx-auto bg-slate-950 p-3 rounded-[38px] shadow-2xl border-4 border-slate-800">
                  {/* Phone Bezel Top / Dynamic Island */}
                  <div className="w-24 h-4 bg-slate-900 mx-auto rounded-full mb-2 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  </div>

                  {/* Phone Screen Container */}
                  <div className="bg-[#f2f2f7] rounded-[26px] overflow-hidden min-h-[460px] text-slate-900 flex flex-col font-sans">
                    {/* iOS Status Bar */}
                    <div className="px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-800">
                      <span>9:41</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* iOS Mail Screen: List View Preview */}
                    {mobileScreen === "list" ? (
                      <div className="p-3 space-y-2 flex-1">
                        <div className="text-[18px] font-bold text-slate-900 px-1">Inbox</div>
                        {/* Mail Item Card */}
                        <div
                          onClick={() => setMobileScreen("body")}
                          className="bg-white p-3 rounded-xl shadow-2xs border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors relative"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[13px] text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              {settings.senderName || "Alex Rivera"}
                            </span>
                            <span className="text-[10px] text-slate-400">9:41 AM</span>
                          </div>
                          <div className="text-[12px] font-semibold text-slate-800 truncate mb-1">
                            {resolvedSubject}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                            {preheaderSnippet}
                          </div>
                        </div>

                        <p className="text-[10px] text-center text-slate-400 pt-3">
                          Tap card to view full mobile message
                        </p>
                      </div>
                    ) : (
                      /* iOS Mail Screen: Message View */
                      <div className="bg-white flex-1 p-4 flex flex-col space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <button
                            type="button"
                            onClick={() => setMobileScreen("list")}
                            className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5"
                          >
                            ‹ Back
                          </button>
                          <span className="text-[10px] text-slate-400">Touch {activeTouchIndex + 1}</span>
                        </div>

                        <div>
                          <h5 className="text-[14px] font-bold text-slate-900 leading-snug">
                            {resolvedSubject}
                          </h5>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                              {(settings.senderName || "A").slice(0, 1)}
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-slate-900">
                                {settings.senderName}
                              </div>
                              <div className="text-[9px] text-slate-500">
                                to me · Today 9:41 AM
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-[12px] text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto">
                          {resolvedBody}
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          {settings.senderRole} · {settings.senderCompany}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERABILITY & RAW HEADERS */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
              {/* Deliverability Rating Card */}
              <div className="p-4 rounded-xl border border-border bg-subtle/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-1">
                    Deliverability Verdict
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[15px] font-bold ${
                        spamAnalysis.score === 0
                          ? "text-emerald-600"
                          : spamAnalysis.score < 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {spamAnalysis.recommendation}
                    </span>
                    <span className="text-[11px] font-mono text-fg-muted">
                      (Risk Score: {spamAnalysis.score}/100)
                    </span>
                  </div>
                  <p className="text-[11px] text-fg-muted mt-1">
                    Screened against SpamAssassin heuristics and Google Workspace promotional filters.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[20px] font-bold text-fg block">
                    {Math.max(0, 100 - spamAnalysis.score)}%
                  </span>
                  <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold">
                    Inbox Prob.
                  </span>
                </div>
              </div>

              {/* Technical SMTP Headers Simulation */}
              <div>
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block mb-2">
                  Simulated SMTP &amp; Authentication Headers
                </span>
                <div className="p-3.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-1">
                  <div><span className="text-slate-500">From:</span> {settings.senderName} &lt;onboarding@resend.dev&gt;</div>
                  <div><span className="text-slate-500">To:</span> {recipient || "recipient@prospect.com"}</div>
                  <div><span className="text-slate-500">Subject:</span> {resolvedSubject}</div>
                  <div><span className="text-slate-500">Authentication-Results:</span> spf=pass (sender IP verified); dkim=pass header.d=resend.dev</div>
                  <div><span className="text-slate-500">Content-Type:</span> multipart/alternative; boundary=&quot;----=_NextPart_000&quot;</div>
                  <div><span className="text-slate-500">X-Mailer:</span> LeadScout Autonomous B2B Engine v1.0</div>
                </div>
              </div>

              {/* Raw HTML Code Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                    Compiled Responsive HTML Payload
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-border bg-surface hover:bg-subtle text-fg-secondary transition-colors"
                  >
                    {copiedHtml ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied HTML!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Raw HTML</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={6}
                  value={rawHtmlCode}
                  className="w-full p-3 rounded-lg border border-border bg-subtle/40 text-[11px] font-mono text-fg-muted leading-relaxed focus:outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-subtle/20 flex items-center justify-between shrink-0 text-[12px]">
          <span className="text-fg-muted">
            Viewing: <strong className="text-fg">{currentEmail.label}</strong> for {dossier.companyName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-border bg-surface hover:bg-subtle text-fg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
