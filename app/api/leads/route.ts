import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeDomain, sanitizeString, isValidUUID } from "@/lib/security";
import { isAdminAuthenticated } from "@/lib/auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// GET — Fetch all leads (rate limited to 40 req/min)
export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    limit: 40,
    windowSeconds: 60,
    endpointKey: "leads-fetch",
  });

  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ leads: [], configured: false });
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, domain, company_name, objective, dossier_json, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase select error:", error.message);
      return NextResponse.json(
        { leads: [], configured: true, error: "Database query error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: data || [], configured: true });
  } catch (error) {
    console.error("Supabase fetch exception:", error);
    return NextResponse.json(
      { leads: [], configured: true, error: "Internal database error" },
      { status: 500 }
    );
  }
}

// POST — Save a lead (rate limited & sanitized)
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    limit: 25,
    windowSeconds: 60,
    endpointKey: "leads-save",
  });

  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured", saved: false },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const { domain, company_name, objective, dossier_json } = body || {};

    const cleanDomain = sanitizeDomain(domain);
    const cleanCompany = sanitizeString(company_name, 150);
    const cleanObjective = [
      "client_acquisition",
      "partnership_inquiry",
      "tech_stack_audit",
    ].includes(objective)
      ? objective
      : "client_acquisition";

    if (!cleanDomain) {
      return NextResponse.json(
        { error: "Valid domain is required", saved: false },
        { status: 400 }
      );
    }

    if (!dossier_json || typeof dossier_json !== "object") {
      return NextResponse.json(
        { error: "Dossier payload must be an object", saved: false },
        { status: 400 }
      );
    }

    // Guard against oversized payload attacks (>500KB)
    const jsonSize = JSON.stringify(dossier_json).length;
    if (jsonSize > 500 * 1024) {
      return NextResponse.json(
        { error: "Dossier payload exceeds maximum allowed size", saved: false },
        { status: 413 }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          domain: cleanDomain,
          company_name: cleanCompany,
          objective: cleanObjective,
          dossier_json,
        },
      ])
      .select("id, domain, company_name, created_at")
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json(
        { error: "Database write error", saved: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: data, saved: true });
  } catch (error) {
    console.error("Supabase save exception:", error);
    return NextResponse.json(
      { error: "Failed to persist lead record", saved: false },
      { status: 500 }
    );
  }
}

// DELETE — Remove a lead (RESTRICTED TO AUTHENTICATED ADMIN)
export async function DELETE(req: NextRequest) {
  // 1. Enforce Admin Authentication
  const isAdmin = isAdminAuthenticated(req);
  if (!isAdmin) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Admin authentication is required to delete database records.",
      },
      { status: 401 }
    );
  }

  // 2. Rate limit
  const rateLimit = checkRateLimit(req, {
    limit: 15,
    windowSeconds: 60,
    endpointKey: "leads-delete",
  });

  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const id = body?.id;

    // Validate UUID format
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: "Valid UUID is required for deletion" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Supabase delete exception:", error);
    return NextResponse.json(
      { error: "Database deletion failed" },
      { status: 500 }
    );
  }
}
