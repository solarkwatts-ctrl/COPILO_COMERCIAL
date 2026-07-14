import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { buildAnalytics } from "@/lib/server/analytics-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const analytics = await buildAnalytics(supabaseAdmin(), profile.empresa_id, from, to);
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("ERROR OPERACION:", error);
    return NextResponse.json({ error: error?.message || "No fue posible consultar la operación." }, { status: 500 });
  }
}
