"use client";

import { useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { alertas, cartera, comerciales, money, pct } from "@/lib/demo-data";
import { AlertTriangle, BellRing, Lock, WalletCards } from "lucide-react";

export default function CarteraPage() {
  const [data, setData] = useState(cartera);
  const total = data.reduce((s, c) => s + c.saldo, 0);
  const critica = data.filter((c) => c.dias >= 60).reduce((s, c) => s + c.saldo, 0);
  const bloqueados = data.filter((c) => c.bloqueado).length;
  const recuperado = comerciales.reduce((s, c) => s + c.recuperado, 0);
  const cumplimientoCartera = total > 0 ? (recuperado / (total + recuperado)) * 100 : 0;

  function bloquear(id: string) {
    setData((prev) => prev.map((x) => x.id === id ? { ...x, bloqueado: !x.bloqueado } : x));
  }

  function avisar(comercial: string) {
    alert(`Aviso urgente enviado a ${comercial}: gestionar cartera vencida del cliente.`);
  }

  return (
    <AppLayout>
      <Hero title="Gestión limpia de cartera" subtitle="Cartera puede subir archivos, generar alertas al comercial, activar bloqueos sugeridos y controlar cumplimiento de recuperación." />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Cartera total" value={money(total)} subtitle="Base cargada" icon={<WalletCards />} />
        <KpiCard title="Cartera crítica" value={money(critica)} subtitle="+60 días" icon={<AlertTriangle />} />
        <KpiCard title="Clientes bloqueados" value={bloqueados} subtitle="Por política de riesgo" icon={<Lock />} />
        <KpiCard title="Cumplimiento recaudo" value={pct(cumplimientoCartera)} subtitle="Recuperado vs saldo" icon={<BellRing />} />
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-black">Acciones críticas de cartera</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Comercial</th><th>Saldo</th><th>Días</th><th>Riesgo</th><th>Promesa</th><th>Bloqueo</th><th>Acción</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="font-bold">{c.cliente}</td>
                  <td>{c.comercial}</td>
                  <td>{money(c.saldo)}</td>
                  <td>{c.dias}</td>
                  <td><span className={c.riesgo === "Crítico" ? "badge bg-red-50 text-red-700" : c.riesgo === "Medio" ? "badge bg-yellow-50 text-yellow-700" : "badge bg-green-50 text-green-700"}>{c.riesgo}</span></td>
                  <td>{c.promesa}</td>
                  <td>{c.bloqueado ? "Bloqueado" : "Activo"}</td>
                  <td className="flex gap-2"><button className="btn-secondary" onClick={() => avisar(c.comercial)}>Avisar comercial</button><button className="btn-secondary" onClick={() => bloquear(c.id)}>{c.bloqueado ? "Desbloquear" : "Bloquear"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-black">Alertas enviadas a comerciales</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {alertas.filter((a) => a.destinoRol === "Comercial" && a.origen === "Cartera").map((a) => <div key={a.id} className="alert alert-red">{a.mensaje}</div>)}
        </div>
      </section>
    </AppLayout>
  );
}