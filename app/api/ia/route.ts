import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { buildStrictRoleContext } from "@/lib/ai/role-context";
import { buildSystemPrompt } from "@/lib/ai/context-builder";
import { askGemini } from "@/lib/ai/gemini";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function fallback(context: any, question: string) {
  const values = Object.entries(context.resumen || {});
  return [
    "## Respuesta directa",
    `La consulta “${question}” fue procesada con los datos disponibles para el rol ${context.rol}.`,
    "",
    "## Datos que la sustentan",
    ...(values.length ? values.map(([key, value], index) => `${index + 1}. ${key.replaceAll("_", " ")}: ${value}`) : ["1. No hay suficientes registros cargados para cuantificar la respuesta."]),
    "",
    "## Acción recomendada",
    values.length
      ? "Revise primero el indicador con mayor impacto y actualice los registros del periodo antes de tomar una decisión definitiva."
      : "Cargue la base correspondiente al módulo consultado para obtener una respuesta cuantitativa y específica."
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (profile.rol === "Asistente Comercial") {
      return NextResponse.json({ answer: "Este rol solo carga y valida bases; no tiene acceso al Copiloto IA.", mode: "restricted" }, { status: 403 });
    }

    const payload = await req.json();
    const question = String(payload?.question || "").trim();
    if (question.length < 3) {
      return NextResponse.json({ answer: "Escriba una pregunta completa.", mode: "error" }, { status: 400 });
    }

    const context = await buildStrictRoleContext(profile, question);
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.AI_MODEL || "gemini-2.5-flash";
    const useGemini = Boolean(apiKey && apiKey !== "pendiente");
    const answer = useGemini
      ? await askGemini({ apiKey: apiKey as string, model, systemPrompt: buildSystemPrompt(profile), analysis: context, question })
      : fallback(context, question);

    await supabaseAdmin().from("ia_historial").insert({
      empresa_id: profile.empresa_id,
      usuario_id: profile.id,
      pregunta: question,
      respuesta: answer
    });

    return NextResponse.json({ answer, mode: useGemini ? "gemini" : "local", role: profile.rol });
  } catch (error: any) {
    const message = error?.message || "ERROR";
    const status = message === "UNAUTHORIZED" ? 401 : message.startsWith("FORBIDDEN") ? 403 : 500;
    const answer = message === "UNAUTHORIZED"
      ? "La sesión expiró. Ingrese nuevamente."
      : message.startsWith("FORBIDDEN")
        ? "Su perfil no tiene permiso para consultar esa empresa o información."
        : `No fue posible completar el análisis: ${message}.`;
    return NextResponse.json({ answer, mode: "error" }, { status });
  }
}
