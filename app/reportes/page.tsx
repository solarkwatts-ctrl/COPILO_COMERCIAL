"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { authFetch } from "@/lib/auth-fetch";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { AlertTriangle, DollarSign, Package, Target, Users } from "lucide-react";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
}

function pct(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

type ReportData = {
  empty: boolean;
  totals: {
    ventas: number;
    costo: number;
    margen: number;
    meta: number;
    cumplimiento: number;
    ventas_perdidas: number;
    cartera: number;
    clientes: number;
    compras: number;
    remisiones: number;
    facturas: number;
    ticket_promedio: number;
    pronostico_siguiente_mes: number;
    inventario_critico: number;
    cartera_critica: number;
  };
  ventas_mensuales: Array<{ mes: string; ventas: number }>;
  ventas_anuales: Array<{ anio: string; ventas: number }>;
  compras_mensuales: Array<{ mes: string; compras: number }>;
  remisiones_mensuales: Array<{ mes: string; remisiones: number }>;
  top_clientes: Array<{ nombre: string; valor: number }>;
  top_proveedores: Array<{ nombre: string; valor: number }>;
  comerciales: Array<{ nombre: string; venta: number; meta: number; cumplimiento: number }>;
  perdidas_motivo: Array<{ motivo: string; valor: number }>;
  inventario: Array<{ producto: string; stock: number; punto: number; estado: string }>;
};

export default function ReportesPage() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear() - 5}-01-01`);
  const [to, setTo] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/reportes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible cargar el reporte.");
      setData(payload);
    } catch (e: any) {
      setError(e.message || "No fue posible cargar el reporte.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <Hero
        title="Inteligencia empresarial"
        subtitle="Información calculada exclusivamente con los datos cargados para la empresa activa. No se muestran cifras de demostración embebidas."
      />

      <section className="card mb-6">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="text-xs font-bold text-slate-500">Fecha inicial</label>
            <input className="input mt-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Fecha final</label>
            <input className="input mt-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Calculando..." : "Actualizar"}</button>
        </div>
      </section>

      {error && <div className="alert alert-red mb-6">{error}</div>}
      {loading && <div className="card text-center text-slate-500">Consultando Supabase...</div>}

      {!loading && data?.empty && (
        <section className="card text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><AlertTriangle /></div>
          <h2 className="mt-4 text-2xl font-black">Sin datos cargados</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">
            Esta empresa no tiene información operativa. Cargue ventas, metas, cartera, inventario o clientes desde Centro de datos. Los indicadores permanecerán en cero hasta que existan datos reales.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <KpiCard title="Ventas" value={money(0)} />
            <KpiCard title="Meta" value={money(0)} />
            <KpiCard title="Cartera" value={money(0)} />
            <KpiCard title="Clientes" value={0} />
          </div>
        </section>
      )}

      {!loading && data && !data.empty && (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Ventas del periodo" value={money(data.totals.ventas)} subtitle={`${pct(data.totals.cumplimiento)} de la meta`} icon={<DollarSign />} />
            <KpiCard title="Compras del periodo" value={money(data.totals.compras)} subtitle="Histórico de proveedores" icon={<Target />} />
            <KpiCard title="Remisiones" value={money(data.totals.remisiones)} subtitle="Demanda y despachos" icon={<Package />} />
            <KpiCard title="Cartera" value={money(data.totals.cartera)} subtitle={`${data.totals.cartera_critica} registros críticos`} icon={<Users />} />
            <KpiCard title="Pronóstico siguiente mes" value={money(data.totals.pronostico_siguiente_mes)} subtitle="Tendencia histórica" icon={<Target />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="card">
              <h2 className="text-xl font-black">Ventas por mes</h2>
              <p className="mt-2 text-sm text-slate-500">Calculadas desde históricos; si no existen, usa ventas operativas.</p>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.ventas_mensuales.map((row) => ({ ...row, ventas: row.ventas / 1_000_000 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} M`} />
                    <Area type="monotone" dataKey="ventas" fill="#93c5fd" stroke="#2563eb" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black">Cumplimiento por comercial</h2>
              <p className="mt-2 text-sm text-slate-500">Ventas y metas vinculadas a cada comercial.</p>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.comerciales.map((row) => ({ ...row, venta: row.venta / 1_000_000, meta: row.meta / 1_000_000 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} M`} />
                    <Bar dataKey="venta" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="meta" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black">Ventas perdidas por motivo</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.perdidas_motivo.map((row) => ({ ...row, valor: row.valor / 1_000_000 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="motivo" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} M`} />
                    <Bar dataKey="valor" fill="#f97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black">Compras por mes</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(data.compras_mensuales || []).map((row) => ({ ...row, compras: row.compras / 1_000_000 }))}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} M`} />
                    <Area type="monotone" dataKey="compras" fill="#99f6e4" stroke="#0f766e" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black">Remisiones por mes</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data.remisiones_mensuales || []).map((row) => ({ ...row, remisiones: row.remisiones / 1_000_000 }))}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} M`} />
                    <Bar dataKey="remisiones" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black">Inventario vs punto de pedido</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inventario}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="producto" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="punto" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}
    </AppLayout>
  );
}
