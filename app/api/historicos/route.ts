import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLES = [
  "ventas_historicas",
  "compras_historicas",
  "remisiones_historicas",
] as const;

type HistoricalTable = (typeof TABLES)[number];

function validTable(value: unknown): value is HistoricalTable {
  return TABLES.includes(String(value) as HistoricalTable);
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ");
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, innerValue]) => [key, normalizeValue(innerValue)])
    );
  }

  return value;
}

function cleanHistoricalRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const ignoredFields = new Set([
    "id",
    "empresa_id",
    "cargado_por",
    "registro_hash",
    "created_at",
    "updated_at",
    "creado_en",
    "actualizado_en",
  ]);

  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => !ignoredFields.has(key))
      .map(([key, value]) => [key, normalizeValue(value)])
  );
}

function generateRowHash(
  table: HistoricalTable,
  row: Record<string, unknown>
): string {
  const cleanRow = cleanHistoricalRow(row);

  const canonicalJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(cleanRow).sort(([keyA], [keyB]) =>
        keyA.localeCompare(keyB)
      )
    )
  );

  return createHash("sha256")
    .update(`${table}|${canonicalJson}`)
    .digest("hex");
}

function prepareUniqueRows(
  table: HistoricalTable,
  rows: Record<string, unknown>[],
  empresaId: string,
  usuarioId: string
): Record<string, unknown>[] {
  const uniqueRows = new Map<string, Record<string, unknown>>();

  for (const originalRow of rows) {
    const cleanRow = cleanHistoricalRow(originalRow);
    const registroHash = generateRowHash(table, cleanRow);

    uniqueRows.set(registroHash, {
      ...cleanRow,
      empresa_id: empresaId,
      cargado_por: usuarioId,
      registro_hash: registroHash,
    });
  }

  return Array.from(uniqueRows.values());
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function getErrorField(
  error: unknown,
  field: "details" | "hint" | "code"
): string | null {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record[field] === "string") return record[field] as string;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, [
      "Administrador",
      "Asistente Comercial",
    ]);

    const db = supabaseAdmin();
    const resumen: Record<string, unknown> = {};

    for (const tabla of TABLES) {
      const { count, error: countError } = await db
        .from(tabla)
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", profile.empresa_id);

      if (countError) {
        throw countError;
      }

      const { data: firstDate, error: firstError } = await db
        .from(tabla)
        .select("fecha")
        .eq("empresa_id", profile.empresa_id)
        .not("fecha", "is", null)
        .order("fecha", { ascending: true })
        .limit(1);

      if (firstError) {
        throw firstError;
      }

      const { data: lastDate, error: lastError } = await db
        .from(tabla)
        .select("fecha")
        .eq("empresa_id", profile.empresa_id)
        .not("fecha", "is", null)
        .order("fecha", { ascending: false })
        .limit(1);

      if (lastError) {
        throw lastError;
      }

      resumen[tabla] = {
        registros: count ?? 0,
        desde: firstDate?.[0]?.fecha ?? null,
        hasta: lastDate?.[0]?.fecha ?? null,
      };
    }

    return NextResponse.json({
      ok: true,
      resumen,
    });
  } catch (error: unknown) {
    console.error("ERROR CONSULTANDO HISTÓRICOS:", error);

    const message = getErrorMessage(
      error,
      "No fue posible consultar históricos."
    );

    return NextResponse.json(
      {
        error: message,
        details: getErrorField(error, "details"),
        hint: getErrorField(error, "hint"),
        code: getErrorField(error, "code"),
      },
      {
        status: message === "FORBIDDEN" ? 403 : 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, [
      "Administrador",
      "Asistente Comercial",
    ]);

    const body = await req.json();
    const action = String(body.action || "batch");
    const table = body.table;

    if (!validTable(table)) {
      return NextResponse.json(
        {
          error: "Tipo histórico inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const db = supabaseAdmin();

    if (action === "start") {
      if (body.mode === "reemplazar") {
        const { count, error: countError } = await db
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", profile.empresa_id);

        if (countError) {
          throw countError;
        }

        const { error: deleteError } = await db
          .from(table)
          .delete()
          .eq("empresa_id", profile.empresa_id);

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({
          ok: true,
          eliminados: count ?? 0,
        });
      }

      return NextResponse.json({
        ok: true,
        eliminados: 0,
      });
    }

    if (action === "batch") {
      const receivedRows: Record<string, unknown>[] = Array.isArray(body.rows)
        ? body.rows
        : [];

      if (!receivedRows.length) {
        return NextResponse.json(
          {
            error: "El lote está vacío.",
          },
          {
            status: 400,
          }
        );
      }

      if (receivedRows.length > 1000) {
        return NextResponse.json(
          {
            error: "El lote supera el máximo de 1.000 registros.",
          },
          {
            status: 400,
          }
        );
      }

      const uniqueRows = prepareUniqueRows(
        table,
        receivedRows,
        profile.empresa_id,
        profile.id
      );

      const duplicatedInsideBatch =
        receivedRows.length - uniqueRows.length;

      const { error: upsertError } = await db
        .from(table)
        .upsert(uniqueRows, {
          onConflict: "empresa_id,registro_hash",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        throw upsertError;
      }

      return NextResponse.json({
        ok: true,
        recibidos: receivedRows.length,
        procesados: uniqueRows.length,
        duplicados_omitidos: duplicatedInsideBatch,
      });
    }

    if (action === "finish") {
      const total = Number(body.total || 0);
      const files = Number(body.files || 0);

      const { error: auditError } = await db.from("auditoria").insert({
        empresa_id: profile.empresa_id,
        usuario_id: profile.id,
        usuario_nombre: profile.nombre,
        rol: profile.rol,
        modulo: "Históricos",
        accion: `Importación ${table}`,
        detalle: `${total} registros históricos procesados en ${files} archivo(s).`,
        tabla_afectada: table,
        metadata: {
          archivos: Array.isArray(body.fileNames) ? body.fileNames : [],
          periodo_desde: body.periodFrom || null,
          periodo_hasta: body.periodTo || null,
          modo: body.mode || null,
        },
      });

      if (auditError) {
        throw auditError;
      }

      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json(
      {
        error: "Acción inválida.",
      },
      {
        status: 400,
      }
    );
  } catch (error: unknown) {
    console.error("================================");
    console.error("ERROR IMPORTANDO HISTÓRICOS");
    console.error("================================");
    console.error("ERROR COMPLETO:", error);
    console.error("MESSAGE:", getErrorMessage(error, ""));
    console.error("DETAILS:", getErrorField(error, "details"));
    console.error("HINT:", getErrorField(error, "hint"));
    console.error("CODE:", getErrorField(error, "code"));
    console.error("================================");

    const message = getErrorMessage(
      error,
      "No fue posible importar históricos."
    );

    return NextResponse.json(
      {
        error: message,
        details: getErrorField(error, "details"),
        hint: getErrorField(error, "hint"),
        code: getErrorField(error, "code"),
      },
      {
        status: message === "FORBIDDEN" ? 403 : 500,
      }
    );
  }
}
