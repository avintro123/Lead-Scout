"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAuthChange: (authenticated: boolean) => void;
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  isAdmin,
  onAuthChange,
}: AdminAuthModalProps) {
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setErrorMsg("Please enter the admin passphrase.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password: passphrase.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        setSuccessMsg("Admin authentication successful!");
        onAuthChange(true);
        setPassphrase("");
        setTimeout(() => {
          setSuccessMsg("");
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || data.message || "Invalid admin credentials.");
      }
    } catch {
      setErrorMsg("Network error during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (res.ok) {
        onAuthChange(false);
        onClose();
      }
    } catch {
      setErrorMsg("Failed to terminate admin session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-subtle/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-fg text-surface">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-fg">
                {isAdmin ? "Admin Session Active" : "Admin Authentication"}
              </h2>
              <span className="text-[11px] text-fg-muted font-normal block">
                {isAdmin ? "Privileged operations unlocked" : "Role-based access protection"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-fg-muted hover:text-fg hover:bg-subtle rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 text-[12.5px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[12px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authenticated as Workspace Administrator</span>
                </div>
                <p className="text-fg-secondary text-[12px] leading-relaxed">
                  You have full authorization to delete CRM records, manage API keys, and update enterprise system settings.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-fg-muted font-mono">
                  Session Token: Active (HTTP-Only)
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-[12px] font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Admin Session</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-[12.5px] text-fg-secondary leading-relaxed">
                Enter your administrative passphrase to unlock protected routes, CRM record deletion, and workspace credentials.
              </p>

              <div>
                <label className="block text-[12px] font-medium text-fg mb-1.5">
                  Admin Passphrase
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                  <input
                    type="password"
                    autoFocus
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter admin secret..."
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-subtle/40 border border-border rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg/40 focus:ring-1 focus:ring-fg/20 transition-colors"
                  />
                </div>
                <span className="text-[10.5px] text-fg-muted mt-1 block">
                  Default development passphrase: <code className="bg-subtle px-1 rounded font-mono">scout-admin-2026</code>
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md hover:bg-subtle text-fg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !passphrase.trim()}
                  className="px-4 py-1.5 text-[12px] font-medium bg-fg text-surface rounded-md hover:bg-fg/90 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
