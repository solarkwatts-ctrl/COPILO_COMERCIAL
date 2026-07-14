import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { buildEnterpriseAnalytics } from "@/lib/analytics/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    return NextResponse.json({ ok: true, ...(await buildEnterpriseAnalytics(profile, from, to)) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "No fue posible construir el análisis empresarial." }, { status: 500 });
  }
}
