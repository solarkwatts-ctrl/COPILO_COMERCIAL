import type { SupabaseClient } from "@supabase/supabase-js";

type AnyRow = Record<string, any>;
const PAGE_SIZE = 1000;
const n = (v: unknown) => Number(v || 0);

async function fetchAll(
  db: SupabaseClient,
  table: string,
  select: string,
  empresaId: string,
  from?: string | null,
  to?: string | null,
  orderColumn = "fecha"
): Promise<AnyRow[]> {
  const rows: AnyRow[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    let query = db.from(table).select(select).eq("empresa_id", empresaId);
    if (from) query = query.gte("fecha", from);
    if (to) query = query.lte("fecha", to);
    query = query.order(orderColumn, { ascending: true }).range(start, start + PAGE_SIZE - 1);
    const { data, error } = await query;
    if (error) {
      // Tables may legitimately not exist in an older installation.
      if (["42P01", "PGRST205"].includes(String((error as any).code || ""))) return [];
      throw error;
    }
    const page = (data || []) as AnyRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function groupSum(rows: AnyRow[], keyFn: (r: AnyRow) => string, valueFn: (r: AnyRow) => number) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row) || "Sin clasificar";
    map.set(key, (map.get(key) || 0) + valueFn(row));
  }
  return map;
}

function topFromMap(map: Map<string, number>, limit = 12) {
  return Array.from(map.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

function linearForecast(monthly: Array<{ mes: string; ventas: number }>) {
  const points = monthly.slice(-24);
  if (points.length < 2) return 0;
  const count = points.length;
  const sx = points.reduce((s, _r, i) => s + i, 0);
  const sy = points.reduce((s, r) => s + r.ventas, 0);
  const sxy = points.reduce((s, r, i) => s + i * r.ventas, 0);
  const sx2 = points.reduce((s, _r, i) => s + i * i, 0);
  const denominator = count * sx2 - sx * sx;
  const slope = denominator ? (count * sxy - sx * sy) / denominator : 0;
  const intercept = (sy - slope * sx) / count;
  return Math.max(0, intercept + slope * count);
}

export async function buildAnalytics(
  db: SupabaseClient,
  empresaId: string,
  from?: string | null,
  to?: string | null
) {
  const [ventasHist, comprasHist, remisionesHist] = await Promise.all([
    fetchAll(db, "ventas_historicas", "fecha,factura,cliente,vendedor,almacen,base,iva,total,anio,mes", empresaId, from, to),
    fetchAll(db, "compras_historicas", "fecha,factura_proveedor,documento_proveedor,proveedor,valor_total,saldo,estado,anio,mes", empresaId, from, to),
    fetchAll(db, "remisiones_historicas", "fecha,remision,cliente,estado,referencia,descripcion,cantidad,pendiente_facturar,facturada,devuelta,valor_unitario,total,anio,mes", empresaId, from, to),
  ]);

  const [operativas, metasRes, carteraRes, inventarioRes, perdidasRes, clientesRes, alertasRes] = await Promise.all([
    ventasHist.length
      ? Promise.resolve([] as AnyRow[])
      : fetchAll(db, "ventas", "fecha,factura,valor,costo,comerciales(nombre),clientes(nombre),productos(nombre,sku)", empresaId, from, to),
    db.from("metas").select("valor,anio,mes,comerciales(nombre)").eq("empresa_id", empresaId),
    db.from("cartera").select("id,factura,saldo,dias_mora,riesgo,bloqueado,promesa_pago,accion,comerciales(nombre),clientes(nombre)").eq("empresa_id", empresaId).order("dias_mora", { ascending: false }),
    db.from("inventario").select("id,stock,costo,precio,stock_seguridad,punto_pedido,lead_time_dias,proveedor,estado,productos(nombre,sku)").eq("empresa_id", empresaId).order("stock", { ascending: true }),
    (() => { let q = db.from("ventas_perdidas").select("fecha,motivo,valor,observacion").eq("empresa_id", empresaId); if (from) q = q.gte("fecha", from); if (to) q = q.lte("fecha", to); return q; })(),
    db.from("clientes").select("id,nombre,ultima_compra").eq("empresa_id", empresaId),
    db.from("alertas").select("id,tipo,prioridad,titulo,mensaje,estado,created_at").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(50),
  ]);

  for (const response of [metasRes, carteraRes, inventarioRes, perdidasRes, clientesRes, alertasRes]) {
    if (response.error && !["42P01", "PGRST205"].includes(String((response.error as any).code || ""))) throw response.error;
  }

  const source = ventasHist.length ? "ventas_historicas" : "ventas";
  const sales = ventasHist.length
    ? ventasHist.map((r) => ({ fecha: r.fecha, factura: r.factura, cliente: r.cliente || "Sin cliente", vendedor: r.vendedor || "Sin comercial", almacen: r.almacen || "Sin almacén", valor: n(r.total), costo: 0 }))
    : operativas.map((r) => ({ fecha: r.fecha, factura: r.factura, cliente: r.clientes?.nombre || "Sin cliente", vendedor: r.comerciales?.nombre || "Sin comercial", almacen: "Sin almacén", producto: r.productos?.nombre || "Sin producto", valor: n(r.valor), costo: n(r.costo) }));

  const monthlyMap = groupSum(sales, (r) => String(r.fecha || "").slice(0, 7), (r) => n(r.valor));
  const ventasMensuales = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mes, ventas]) => ({ mes, ventas }));
  const ventasAnuales = Array.from(groupSum(sales, (r) => String(r.fecha || "").slice(0, 4), (r) => n(r.valor)).entries()).sort(([a], [b]) => a.localeCompare(b)).map(([anio, ventas]) => ({ anio, ventas }));
  const comprasMensuales = Array.from(groupSum(comprasHist, (r) => String(r.fecha || "").slice(0, 7), (r) => n(r.valor_total)).entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mes, compras]) => ({ mes, compras }));
  const remisionesMensuales = Array.from(groupSum(remisionesHist, (r) => String(r.fecha || "").slice(0, 7), (r) => n(r.total)).entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mes, remisiones]) => ({ mes, remisiones }));

  const metas = (metasRes.data || []) as AnyRow[];
  const goalsFiltered = metas.filter((g) => {
    const month = `${g.anio}-${String(g.mes).padStart(2, "0")}`;
    return (!from || month >= from.slice(0, 7)) && (!to || month <= to.slice(0, 7));
  });
  const goalBySeller = groupSum(goalsFiltered, (r) => r.comerciales?.nombre || "Sin comercial", (r) => n(r.valor));
  const salesBySeller = groupSum(sales, (r) => r.vendedor, (r) => n(r.valor));
  const sellerNames = new Set([...salesBySeller.keys(), ...goalBySeller.keys()]);
  const comerciales = Array.from(sellerNames).map((nombre) => {
    const venta = salesBySeller.get(nombre) || 0;
    const meta = goalBySeller.get(nombre) || 0;
    return { nombre, venta, meta, cumplimiento: meta > 0 ? (venta / meta) * 100 : 0 };
  }).sort((a, b) => b.venta - a.venta);

  const cartera = (carteraRes.data || []) as AnyRow[];
  const inventario = (inventarioRes.data || []) as AnyRow[];
  const perdidas = (perdidasRes.data || []) as AnyRow[];
  const clientesOperativos = (clientesRes.data || []) as AnyRow[];
  const totalVentas = sales.reduce((s, r) => s + n(r.valor), 0);
  const totalCosto = sales.reduce((s, r) => s + n(r.costo), 0);
  const totalCompras = comprasHist.reduce((s, r) => s + n(r.valor_total), 0);
  const totalRemisiones = remisionesHist.reduce((s, r) => s + n(r.total), 0);
  const totalCantidadRemitida = remisionesHist.reduce((s, r) => s + n(r.cantidad), 0);
  const totalMeta = goalsFiltered.reduce((s, r) => s + n(r.valor), 0);
  const totalCartera = cartera.reduce((s, r) => s + n(r.saldo), 0);
  const totalPerdidas = perdidas.reduce((s, r) => s + n(r.valor), 0);
  const uniqueClients = new Set(sales.map((r) => r.cliente).filter(Boolean));
  const uniqueInvoices = new Set(sales.map((r) => r.factura).filter(Boolean));

  const productDemand = groupSum(remisionesHist, (r) => `${r.referencia || ""}||${r.descripcion || "Sin descripción"}`, (r) => n(r.cantidad));
  const referencias = topFromMap(productDemand, 20).map((r) => {
    const [referencia, descripcion] = r.nombre.split("||");
    return { referencia, descripcion, cantidad: r.valor };
  });

  const inventoryCritical = inventario.filter((r) => String(r.estado || "").toUpperCase() !== "DISPONIBLE" || n(r.stock) <= n(r.punto_pedido));
  const portfolioCritical = cartera.filter((r) => n(r.dias_mora) >= 60 || Boolean(r.bloqueado));
  const forecast = linearForecast(ventasMensuales);

  return {
    ok: true,
    source,
    period: { from: from || (sales[0]?.fecha ?? null), to: to || (sales.at(-1)?.fecha ?? null) },
    empty: sales.length === 0 && comprasHist.length === 0 && remisionesHist.length === 0 && cartera.length === 0 && inventario.length === 0,
    totals: {
      ventas: totalVentas,
      costo: totalCosto,
      margen: totalVentas - totalCosto,
      compras: totalCompras,
      remisiones: totalRemisiones,
      cantidad_remitida: totalCantidadRemitida,
      meta: totalMeta,
      cumplimiento: totalMeta > 0 ? (totalVentas / totalMeta) * 100 : 0,
      ventas_perdidas: totalPerdidas,
      cartera: totalCartera,
      clientes: uniqueClients.size || clientesOperativos.length,
      facturas: uniqueInvoices.size,
      ticket_promedio: uniqueInvoices.size ? totalVentas / uniqueInvoices.size : 0,
      inventario_critico: inventoryCritical.length,
      cartera_critica: portfolioCritical.length,
      pronostico_siguiente_mes: forecast,
    },
    ventas_mensuales: ventasMensuales,
    ventas_anuales: ventasAnuales,
    compras_mensuales: comprasMensuales,
    remisiones_mensuales: remisionesMensuales,
    comerciales,
    top_clientes: topFromMap(groupSum(sales, (r) => r.cliente, (r) => n(r.valor)), 15),
    top_almacenes: topFromMap(groupSum(sales, (r) => r.almacen, (r) => n(r.valor)), 10),
    top_proveedores: topFromMap(groupSum(comprasHist, (r) => r.proveedor || "Sin proveedor", (r) => n(r.valor_total)), 15),
    top_referencias: referencias,
    perdidas_motivo: topFromMap(groupSum(perdidas, (r) => r.motivo || "Sin motivo", (r) => n(r.valor)), 12).map((r) => ({ motivo: r.nombre, valor: r.valor })),
    inventario: inventario.map((r) => ({ ...r, producto: r.productos?.nombre || "Producto", sku: r.productos?.sku || "" })),
    cartera,
    alertas: (alertasRes.data || []) as AnyRow[],
  };
}
