import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — Fetch all leads
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ leads: [], configured: false });
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ leads: data || [], configured: true });
  } catch (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ leads: [], configured: true, error: "Failed to fetch leads" });
  }
}

// POST — Save a lead
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured", saved: false },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const { domain, company_name, objective, dossier_json } = body;

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          domain,
          company_name,
          objective,
          dossier_json,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data, saved: true });
  } catch (error) {
    console.error("Supabase save error:", error);
    return NextResponse.json(
      { error: "Failed to save lead", saved: false },
      { status: 200 }
    );
  }
}

// DELETE — Remove a lead
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 200 });
  }

  try {
    const { id } = await req.json();

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 200 });
  }
}
