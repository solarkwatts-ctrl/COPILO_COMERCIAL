"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { alertas, cartera, clientesPareto, comerciales, metaEsperadaPorDias, money, pct, productosPareto } from "@/lib/demo-data";
import { CalendarDays, Target, TrendingUp, WalletCards } from "lucide-react";

export default function ComercialPage() {
  const [role, setRole] = useState("Gerencia Comercial");
  const [comercialUser, setComercialUser] = useState("");
  const [metas, setMetas] = useState(comerciales.map((c) => ({ nombre: c.nombre, meta: c.meta })));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("copiloto_user");
      const user = raw ? JSON.parse(raw) : null;
      setRole(user?.rol || "Gerencia Comercial");
      setComercialUser(user?.comercial || "");
    } catch {}
  }, []);

  const visibleComerciales = role === "Comercial" ? comerciales.filter((c) => c.nombre === comercialUser) : comerciales;

  const merged = visibleComerciales.map((c) => ({ ...c, meta: metas.find((m) => m.nombre === c.nombre)?.meta || c.meta }));
  const totalMeta = merged.reduce((s, c) => s + c.meta, 0);
  const totalVenta = merged.reduce((s, c) => s + c.venta, 0);
  const cumplimiento = (totalVenta / totalMeta) * 100;
  const tiempo = metaEsperadaPorDias(totalMeta);

  function updateMeta(nombre: string, value: string) {
    const v = Number(value.replace(/[^0-9]/g, ""));
    setMetas((prev) => prev.map((m) => m.nombre === nombre ? { ...m, meta: v } : m));
  }

  function sugerirMetasIA() {
    setMetas(comerciales.map((c) => {
      const crecimiento = c.venta > c.meta ? 1.08 : 1.04;
      return { nombre: c.nombre, meta: Math.round(c.venta * crecimiento) };
    }));
  }

  const alertasComercial = alertas.filter((a) => a.destinoRol === "Comercial" && (role !== "Comercial" || a.destino === comercialUser));

  return (
    <AppLayout>
      <Hero title={role === "Comercial" ? "Mi panel comercial" : "Gestión comercial y metas"} subtitle="Configure metas manualmente o por archivo, calcule meta general y mida cumplimiento contra días hábiles de Colombia." />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Meta del periodo" value={money(totalMeta)} subtitle={`Días hábiles: ${tiempo.habilesPasados}/${tiempo.habilesMes}`} icon={<Target />} />
        <KpiCard title="Venta acumulada" value={money(totalVenta)} subtitle={`Cumplimiento: ${pct(cumplimiento)}`} icon={<TrendingUp />} />
        <KpiCard title="Meta esperada a hoy" value={money(tiempo.esperado)} subtitle={`Avance calendario: ${pct(tiempo.cumplimientoEsperado)}`} icon={<CalendarDays />} />
        <KpiCard title="Cartera asignada" value={money(merged.reduce((s, c) => s + c.cartera, 0))} subtitle="Clientes del asesor/equipo" icon={<WalletCards />} />
      </section>

      {alertasComercial.length > 0 && (
        <section className="card mt-6">
          <h2 className="text-xl font-black">Alertas urgentes al comercial</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {alertasComercial.map((a) => <div key={a.id} className="alert alert-red">{a.mensaje}</div>)}
          </div>
        </section>
      )}

      {role !== "Comercial" && (
        <section className="card mt-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black">Asignación de metas por comercial</h2>
              <p className="mt-2 text-slate-500">Gerencia puede ajustar manualmente o usar sugerencia IA.</p>
            </div>
            <button className="btn" onClick={sugerirMetasIA}>Sugerir metas con IA</button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="table">
              <thead><tr><th>Comercial</th><th>Venta actual</th><th>Meta editable</th><th>% Cumplimiento</th></tr></thead>
              <tbody>
                {comerciales.map((c) => {
                  const meta = metas.find((m) => m.nombre === c.nombre)?.meta || c.meta;
                  return (
                    <tr key={c.nombre}>
                      <td className="font-bold">{c.nombre}</td>
                      <td>{money(c.venta)}</td>
                      <td><input className="input" value={meta} onChange={(e) => updateMeta(c.nombre, e.target.value)} /></td>
                      <td className="font-black text-blue-700">{pct((c.venta / meta) * 100)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-black">Qué vender / defender disponibilidad</h2>
          <div className="mt-5 space-y-3">
            {productosPareto.slice(0, 4).map((p) => <div key={p.sku} className="alert alert-blue">{p.nombre} · Pareto {p.abc} · {money(p.valor)}</div>)}
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-black">Clientes a recuperar</h2>
          <div className="mt-5 space-y-3">
            {clientesPareto.filter((c) => c.variacion < 0).map((c) => <div key={c.id} className="alert alert-yellow">{c.nombre}: variación {c.variacion}%. Acción sugerida: llamada y propuesta comercial.</div>)}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}