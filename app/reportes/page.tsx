"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { cartera, clientesPareto, comerciales, inventario, money, pct, productosPareto, ventasPerdidas } from "@/lib/demo-data";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CalendarDays, DollarSign, Package, Target, TrendingUp, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

const ventasMes = [
  { mes: "Ene", ventas: 720, meta: 680 },
  { mes: "Feb", ventas: 790, meta: 710 },
  { mes: "Mar", ventas: 860, meta: 760 },
  { mes: "Abr", ventas: 810, meta: 780 },
  { mes: "May", ventas: 930, meta: 820 },
  { mes: "Jun", ventas: 997, meta: 860 }
];

const sectores = [
  { name: "Industrial", value: 38 },
  { name: "Construcción", value: 24 },
  { name: "Distribución", value: 18 },
  { name: "Hogar", value: 12 },
  { name: "Otros", value: 8 }
];

const motivosPerdida = [
  { motivo: "Agotado", valor: 32500000 },
  { motivo: "Precio", valor: 18700000 },
  { motivo: "Competencia", valor: 9400000 },
  { motivo: "Tiempo entrega", valor: 6200000 }
];

function ChartCard({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-xl font-black">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5 h-72">{children}</div>
    </div>
  );
}

export default function ReportesPage() {
  const [rol, setRol] = useState("Gerencia Comercial");
  const [periodo, setPeriodo] = useState("Mes actual");
  const [fechaInicial, setFechaInicial] = useState("2026-07-01");
  const [fechaFinal, setFechaFinal] = useState("2026-07-31");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("copiloto_user");
      const user = raw ? JSON.parse(raw) : null;
      setRol(user?.rol || "Gerencia Comercial");
    } catch {}
  }, []);

  const totalVentas = comerciales.reduce((s, c) => s + c.venta, 0);
  const totalMeta = comerciales.reduce((s, c) => s + c.meta, 0);
  const totalClientesAsignados = 42;
  const clientesCompraron = 26;
  const activacion = (clientesCompraron / totalClientesAsignados) * 100;
  const ventasPerdidasTotal = ventasPerdidas.reduce((s, v) => s + v.valor, 0);
  const carteraTotal = cartera.reduce((s, c) => s + c.saldo, 0);
  const inventarioCritico = inventario.filter((i) => i.estado !== "DISPONIBLE").length;

  const rankingComerciales = comerciales.map((c) => ({
    nombre: c.nombre,
    venta: Math.round(c.venta / 1000000),
    meta: Math.round(c.meta / 1000000),
    cumplimiento: Number(((c.venta / c.meta) * 100).toFixed(1))
  }));

  return (
    <AppLayout>
      <Hero
        title={`Centro visual de reportes · ${rol}`}
        subtitle="Reportes más gráficos, filtrables y enfocados al rol. Seleccione periodo o rango de fechas para analizar la información."
      />

      <section className="card mb-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <h2 className="text-xl font-black">Periodo del reporte</h2>
            <p className="mt-2 text-sm text-slate-500">
              Puede elegir una vista rápida o definir fecha inicial y fecha final.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {["Día", "Semana", "Mes actual", "Trimestre", "Año"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={periodo === p ? "btn" : "btn-secondary"}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Fecha inicial</label>
              <input className="input mt-1" type="date" value={fechaInicial} onChange={(e) => setFechaInicial(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Fecha final</label>
              <input className="input mt-1" type="date" value={fechaFinal} onChange={(e) => setFechaFinal(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-black">Semáforo ejecutivo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5"><div className="flex items-center gap-3"><AlertTriangle className="text-red-600"/><div><p className="text-sm font-black text-red-800">Crítico</p><p className="text-lg font-black text-red-950">{rol === "Compras" ? `${inventarioCritico} referencias con riesgo` : rol === "Cartera" ? `${cartera.filter((c) => c.dias >= 60).length} clientes críticos` : rol === "Comercial" ? `${totalClientesAsignados - clientesCompraron} clientes sin compra` : money(ventasPerdidasTotal)}</p></div></div></div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-3"><CalendarDays className="text-amber-600"/><div><p className="text-sm font-black text-amber-800">Atención</p><p className="text-lg font-black text-amber-950">{rol === "Compras" ? "Revisar lead time y reposición" : rol === "Cartera" ? "Promesas y bloqueos pendientes" : rol === "Comercial" ? "Clientes en caída" : "Comerciales bajo meta"}</p></div></div></div>
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-green-600"/><div><p className="text-sm font-black text-green-800">Positivo</p><p className="text-lg font-black text-green-950">{rol === "Comercial" ? `${pct(activacion)} de activación` : rol === "Compras" ? "Compras sugeridas calculadas" : rol === "Cartera" ? "Acciones priorizadas" : `${pct((totalVentas / totalMeta) * 100)} de cumplimiento`}</p></div></div></div>
        </div>
      </section>

      {rol === "Compras" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Referencias críticas" value={inventarioCritico} subtitle="Agotadas o por debajo del punto de pedido" icon={<Package />} />
            <KpiCard title="Ventas perdidas por agotado" value={money(motivosPerdida[0].valor)} subtitle="Impacto comercial por falta de inventario" icon={<DollarSign />} />
            <KpiCard title="Lead time promedio" value="9 días" subtitle="Editable solo por compras" icon={<CalendarDays />} />
            <KpiCard title="Compra sugerida" value="530 uds" subtitle="Según stock, punto pedido y seguridad" icon={<TrendingUp />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Pérdidas por agotado" subtitle="Útil para priorizar compras y proveedores.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motivosPerdida.filter((m) => m.motivo === "Agotado")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="motivo" />
                  <YAxis />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Bar dataKey="valor" fill="#f97316" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Estado de inventario" subtitle="Agotados, críticos y disponibles.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventario.map((i) => ({ producto: i.producto, stock: i.stock, punto: i.puntoPedido }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="producto" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#14b8a6" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="punto" fill="#f59e0b" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      ) : rol === "Cartera" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Cartera total" value={money(carteraTotal)} subtitle="Saldo a gestionar" icon={<DollarSign />} />
            <KpiCard title="Clientes críticos" value={cartera.filter((c) => c.dias >= 60).length} subtitle="Mayor a 60 días" icon={<Users />} />
            <KpiCard title="Bloqueos sugeridos" value={cartera.filter((c) => c.bloqueado).length} subtitle="Por política de riesgo" icon={<Target />} />
            <KpiCard title="Promesas por revisar" value={cartera.filter((c) => c.promesa !== "Sin promesa").length} subtitle="Seguimiento diario" icon={<CalendarDays />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Cartera por cliente" subtitle="Prioriza gestión según saldo y edad.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cartera.map((c) => ({ cliente: c.cliente, saldo: c.saldo / 1000000, dias: c.dias }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cliente" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="saldo" fill="#dc2626" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Edad de cartera" subtitle="Días vencidos por cliente.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cartera.map((c) => ({ cliente: c.cliente, dias: c.dias }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cliente" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="dias" fill="#f59e0b" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      ) : rol === "Comercial" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Clientes asignados" value={totalClientesAsignados} subtitle="Base comercial disponible" icon={<Users />} />
            <KpiCard title="Clientes que compran" value={clientesCompraron} subtitle={`${pct(activacion)} de activación`} icon={<TrendingUp />} />
            <KpiCard title="Venta periodo" value={money(comerciales[0].venta)} subtitle={`Meta: ${money(comerciales[0].meta)}`} icon={<Target />} />
            <KpiCard title="Cartera asignada" value={money(comerciales[0].cartera)} subtitle="Debe gestionarse antes de vender más" icon={<DollarSign />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Sectores fuertes" subtitle="Dónde enfocar la gestión comercial.">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectores} dataKey="value" nameKey="name" outerRadius={95} label>
                    {sectores.map((entry, index) => <Cell key={`cell-${index}`} fill={["#2563eb","#14b8a6","#f59e0b","#8b5cf6","#ef4444"][index % 5]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Activación de base" subtitle="Clientes asignados vs clientes que compran.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { nombre: "Asignados", cantidad: totalClientesAsignados },
                  { nombre: "Compraron", cantidad: clientesCompraron },
                  { nombre: "Sin compra", cantidad: totalClientesAsignados - clientesCompraron }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#0ea5e9" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="card mt-6">
            <h2 className="text-xl font-black">Paretos comerciales accionables</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="alert alert-green">Sector más fuerte: Industrial · 38% de mis ventas.</div>
              <div className="alert alert-blue">Mejor cliente histórico: Cliente A · $420.000.000.</div>
              <div className="alert alert-yellow">Producto más vendido: Línea Industrial.</div>
              <div className="alert alert-red">Cliente con caída: Cliente E · requiere seguimiento.</div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Ventas periodo" value={money(totalVentas)} subtitle={`${pct((totalVentas / totalMeta) * 100)} de cumplimiento`} icon={<TrendingUp />} />
            <KpiCard title="Meta general" value={money(totalMeta)} subtitle="Sumatoria comercial" icon={<Target />} />
            <KpiCard title="Ventas perdidas" value={money(ventasPerdidasTotal)} subtitle="Consolidado del equipo" icon={<DollarSign />} />
            <KpiCard title="Cartera total" value={money(carteraTotal)} subtitle="Riesgo financiero" icon={<Users />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Ventas vs meta" subtitle="Evolución mensual tipo Power BI.">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="ventas" stroke="#2563eb" fill="#60a5fa" strokeWidth={3} fillOpacity={0.35} />
                  <Area type="monotone" dataKey="meta" stroke="#14b8a6" fill="#5eead4" strokeWidth={3} fillOpacity={0.22} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Cumplimiento por comercial" subtitle="Ranking visual de desempeño.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingComerciales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cumplimiento" fill="#2563eb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Motivos de ventas perdidas" subtitle="Para decidir si el problema es precio, agotado o competencia.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motivosPerdida}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="motivo" />
                  <YAxis />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Bar dataKey="valor" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Clientes Pareto" subtitle="Clientes que explican la mayor parte del negocio.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientesPareto.map((c) => ({ cliente: c.nombre, valor: c.valor / 1000000 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cliente" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      )}
    </AppLayout>
  );
}