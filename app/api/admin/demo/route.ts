import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_TABLES_IN_DELETE_ORDER = [
  "notificaciones",
  "alertas",
  "ventas_perdidas",
  "cartera",
  "inventario",
  "metas",
  "ventas",
  "ventas_historicas",
  "compras_historicas",
  "remisiones_historicas",
  "ia_historial",
  "cargas_archivos",
  "clientes",
  "productos",
  "categorias",
  "comerciales",
] as const;

const ANALYTIC_TABLES = [
  "ventas",
  "ventas_historicas",
  "compras_historicas",
  "remisiones_historicas",
  "cartera",
  "inventario",
  "metas",
  "ventas_perdidas",
  "alertas",
  "clientes",
  "productos",
  "comerciales",
] as const;

function statusFor(message: string) {
  if (message === "UNAUTHORIZED") return 401;
  if (["FORBIDDEN", "FORBIDDEN_COMPANY"].includes(message)) return 403;
  if (message === "COMPANY_NOT_FOUND") return 404;
  if (message === "DELETE_VERIFICATION_FAILED") return 409;
  return 500;
}

async function countCompanyRows(db: any, table: string, empresaId: string) {
  const { count, error } = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId);
  if (error) {
    if (["42P01", "42703", "PGRST205"].includes(String(error.code || ""))) return 0;
    throw error;
  }
  return count ?? 0;
}

async function deleteCompanyRows(db: any, table: string, empresaId: string) {
  const before = await countCompanyRows(db, table, empresaId);
  if (!before) return 0;
  const { error } = await db.from(table).delete().eq("empresa_id", empresaId);
  if (error) {
    if (["42P01", "42703", "PGRST205"].includes(String(error.code || ""))) return 0;
    throw error;
  }
  return before;
}

async function verifyCompanyIsEmpty(db: any, empresaId: string) {
  const remaining: Record<string, number> = {};
  for (const table of ANALYTIC_TABLES) {
    const count = await countCompanyRows(db, table, empresaId);
    if (count > 0) remaining[table] = count;
  }
  return remaining;
}

async function clearCompanyData(db: any, empresaId: string) {
  const { data: company, error: companyError } = await db
    .from("empresa")
    .select("id,nombre")
    .eq("id", empresaId)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!company?.id) throw new Error("COMPANY_NOT_FOUND");

  let deleted: Record<string, number> = {};

  // La función SQL ejecuta el borrado en una sola transacción y devuelve conteos.
  const rpc = await db.rpc("borrar_datos_empresa_definitivo", {
    p_empresa_id: company.id,
  });

  if (!rpc.error && rpc.data?.eliminados) {
    deleted = rpc.data.eliminados as Record<string, number>;
  } else {
    // Respaldo para instalaciones donde todavía no se haya ejecutado la migración 12.
    for (const table of DATA_TABLES_IN_DELETE_ORDER) {
      deleted[table] = await deleteCompanyRows(db, table, company.id);
    }
  }

  // No se responde éxito hasta comprobar físicamente que las fuentes de Dashboard y Comercial quedaron vacías.
  const remaining = await verifyCompanyIsEmpty(db, company.id);
  if (Object.keys(remaining).length > 0) {
    const error: any = new Error("DELETE_VERIFICATION_FAILED");
    error.details = remaining;
    throw error;
  }

  return deleted;
}

async function seedDemo(db: any, empresaId: string) {
  const { data: cat, error: e1 } = await db
    .from("categorias")
    .insert([
      { empresa_id: empresaId, nombre: "Tableros", es_demo: true },
      { empresa_id: empresaId, nombre: "Herrajes", es_demo: true },
    ])
    .select("id,nombre");
  if (e1) throw e1;

  const { data: prod, error: e2 } = await db
    .from("productos")
    .insert([
      {
        empresa_id: empresaId,
        categoria_id: cat?.[0]?.id,
        codigo: "DEMO-MDF",
        sku: "DEMO-MDF",
        nombre: "MDF 15 mm",
        categoria: "Tableros",
        abc: "A",
        participacion: 42,
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        categoria_id: cat?.[0]?.id,
        codigo: "DEMO-MEL",
        sku: "DEMO-MEL",
        nombre: "Melamina Blanca",
        categoria: "Tableros",
        abc: "A",
        participacion: 31,
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        categoria_id: cat?.[1]?.id,
        codigo: "DEMO-BIS",
        sku: "DEMO-BIS",
        nombre: "Bisagra cierre lento",
        categoria: "Herrajes",
        abc: "B",
        participacion: 12,
        es_demo: true,
      },
    ])
    .select("id,nombre");
  if (e2) throw e2;

  const { data: com, error: e3 } = await db
    .from("comerciales")
    .insert([
      {
        empresa_id: empresaId,
        nombre: "Laura Demo",
        codigo: "DEMO-01",
        activo: true,
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        nombre: "Carlos Demo",
        codigo: "DEMO-02",
        activo: true,
        es_demo: true,
      },
    ])
    .select("id,nombre");
  if (e3) throw e3;

  const { data: cli, error: e4 } = await db
    .from("clientes")
    .insert([
      {
        empresa_id: empresaId,
        comercial_id: com?.[0]?.id,
        nombre: "Muebles Horizonte",
        sector: "Muebles",
        ciudad: "Bucaramanga",
        ultima_compra: new Date().toISOString().slice(0, 10),
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        comercial_id: com?.[1]?.id,
        nombre: "Diseños del Oriente",
        sector: "Carpintería",
        ciudad: "Cúcuta",
        ultima_compra: new Date(Date.now() - 45 * 86400000)
          .toISOString()
          .slice(0, 10),
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        comercial_id: com?.[0]?.id,
        nombre: "Cocinas Premium",
        sector: "Cocinas",
        ciudad: "Floridablanca",
        ultima_compra: new Date(Date.now() - 70 * 86400000)
          .toISOString()
          .slice(0, 10),
        es_demo: true,
      },
    ])
    .select("id");
  if (e4) throw e4;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dates = [2, 5, 8, 11].map((d) =>
    new Date(year, now.getMonth(), Math.min(d, now.getDate()))
      .toISOString()
      .slice(0, 10)
  );

  const sales: any[] = [];
  for (let i = 0; i < 12; i += 1) {
    sales.push({
      empresa_id: empresaId,
      comercial_id: com?.[i % 2]?.id,
      cliente_id: cli?.[i % 3]?.id,
      producto_id: prod?.[i % 3]?.id,
      fecha: dates[i % 4],
      factura: `DEMO-${1000 + i}`,
      cantidad: 5 + i,
      valor: 12000000 + i * 1750000,
      costo: 8000000 + i * 900000,
      es_demo: true,
    });
  }

  const { error: e5 } = await db.from("ventas").insert(sales);
  if (e5) throw e5;

  const operations = [
    db.from("metas").insert([
      {
        empresa_id: empresaId,
        comercial_id: com?.[0]?.id,
        anio: year,
        mes: month,
        valor: 180000000,
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        comercial_id: com?.[1]?.id,
        anio: year,
        mes: month,
        valor: 150000000,
        es_demo: true,
      },
    ]),
    db.from("inventario").insert(
      prod?.map((p: any, i: number) => ({
        empresa_id: empresaId,
        producto_id: p.id,
        stock: i === 1 ? 4 : 80 - i * 20,
        costo: 120000,
        precio: 180000,
        stock_seguridad: 15,
        punto_pedido: 25,
        lead_time_dias: 8 + i * 2,
        proveedor: "Proveedor Demo",
        estado: i === 1 ? "CRITICO" : "DISPONIBLE",
        es_demo: true,
      })) || []
    ),
    db.from("cartera").insert([
      {
        empresa_id: empresaId,
        comercial_id: com?.[0]?.id,
        cliente_id: cli?.[0]?.id,
        factura: "DEMO-C001",
        saldo: 18500000,
        dias_mora: 15,
        riesgo: "Medio",
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        comercial_id: com?.[1]?.id,
        cliente_id: cli?.[1]?.id,
        factura: "DEMO-C002",
        saldo: 32800000,
        dias_mora: 78,
        riesgo: "Alto",
        bloqueado: true,
        es_demo: true,
      },
    ]),
    db.from("ventas_perdidas").insert([
      {
        empresa_id: empresaId,
        comercial_id: com?.[0]?.id,
        cliente_id: cli?.[2]?.id,
        producto_id: prod?.[1]?.id,
        motivo: "Agotado",
        valor: 9500000,
        observacion: "Demo",
        es_demo: true,
      },
    ]),
    db.from("alertas").insert([
      {
        empresa_id: empresaId,
        tipo: "inventario",
        prioridad: "alta",
        titulo: "Stock crítico",
        mensaje: "Melamina Blanca requiere reposición",
        origen: "Demo",
        es_demo: true,
      },
      {
        empresa_id: empresaId,
        tipo: "cartera",
        prioridad: "alta",
        titulo: "Cartera vencida",
        mensaje: "Diseños del Oriente supera 60 días",
        origen: "Demo",
        es_demo: true,
      },
    ]),
  ];

  const results = await Promise.all(operations);
  const operationError = results.find((result: any) => result.error)?.error;
  if (operationError) throw operationError;
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(
      req,
      ["Administrador"],
      { allowInactiveCompany: true }
    );
    const db = supabaseAdmin();
    const body = await req.json();
    const action = String(body.action || "");
    const empresaId = String(body.company_id || profile.empresa_id || "");

    if (!empresaId) throw new Error("COMPANY_NOT_FOUND");

    // Un administrador común solo puede trabajar con su empresa activa. El
    // superadministrador sí puede gestionar cualquier empresa seleccionada.
    if (!profile.es_superadmin && empresaId !== profile.empresa_id) {
      throw new Error("FORBIDDEN_COMPANY");
    }

    if (action === "toggle") {
      const { data, error } = await db
        .from("empresa")
        .select("demo_activo")
        .eq("id", empresaId)
        .single();
      if (error) throw error;

      const next = !data?.demo_activo;
      const { error: updateError } = await db
        .from("empresa")
        .update({
          demo_activo: next,
          tipo_entorno: next ? "demo" : "real",
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", empresaId);
      if (updateError) throw updateError;

      const { error: configError } = await db
        .from("configuracion_demo")
        .upsert(
          {
            empresa_id: empresaId,
            activo: next,
            actualizado_en: new Date().toISOString(),
          },
          { onConflict: "empresa_id" }
        );
      if (configError) throw configError;

      return NextResponse.json({ ok: true, demo_activo: next });
    }

    if (action === "clear") {
      const eliminados = await clearCompanyData(db, empresaId);

      const { error: configError } = await db
        .from("configuracion_demo")
        .upsert(
          {
            empresa_id: empresaId,
            datos_cargados: false,
            actualizado_en: new Date().toISOString(),
          },
          { onConflict: "empresa_id" }
        );
      if (configError) throw configError;

      await db.from("auditoria").insert({
        empresa_id: empresaId,
        usuario_id: profile.id,
        usuario_nombre: profile.nombre,
        rol: profile.rol,
        modulo: "Demo",
        accion: "Borrar datos de empresa",
        detalle:
          "Se eliminaron todos los datos operativos e históricos de la empresa seleccionada, conservando empresa, usuarios, roles, sucursales, zonas y configuración.",
        metadata: { eliminados },
      });

      const total = Object.values(eliminados).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );

      return NextResponse.json({
        ok: true,
        mensaje: `Datos borrados y verificados correctamente. ${total} registros eliminados.`,
        eliminados,
        empresa_id: empresaId,
        revision: Date.now(),
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    if (action === "load" || action === "reset") {
      if (action === "reset") {
        await clearCompanyData(db, empresaId);
      } else {
        const { count, error } = await db
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("es_demo", true);
        if (error) throw error;
        if ((count || 0) > 0) {
          return NextResponse.json(
            { error: "Ya hay datos demo. Use Reiniciar demo." },
            { status: 409 }
          );
        }
      }

      await seedDemo(db, empresaId);

      const { error: companyError } = await db
        .from("empresa")
        .update({ demo_activo: true, tipo_entorno: "demo" })
        .eq("id", empresaId);
      if (companyError) throw companyError;

      const { error: demoError } = await db
        .from("configuracion_demo")
        .upsert(
          {
            empresa_id: empresaId,
            activo: true,
            datos_cargados: true,
            actualizado_en: new Date().toISOString(),
          },
          { onConflict: "empresa_id" }
        );
      if (demoError) throw demoError;

      await db.from("auditoria").insert({
        empresa_id: empresaId,
        usuario_id: profile.id,
        usuario_nombre: profile.nombre,
        rol: profile.rol,
        modulo: "Demo",
        accion: action === "reset" ? "Reiniciar demo" : "Cargar demo",
        detalle: "Datos empresariales de demostración",
      });

      return NextResponse.json({
        ok: true,
        mensaje: action === "reset" ? "Demo reiniciada." : "Demo cargada.",
      });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || "No fue posible gestionar los datos.";
    console.error("ADMIN DEMO ERROR", error);
    return NextResponse.json(
      {
        error: message === "DELETE_VERIFICATION_FAILED"
          ? "El borrado no se completó: todavía existen registros en Supabase."
          : message,
        code: error?.code || null,
        details: error?.details || null,
      },
      { status: statusFor(message) }
    );
  }
}
