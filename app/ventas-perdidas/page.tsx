"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { inventario, money, ventasPerdidas } from "@/lib/demo-data";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const resumenMotivos = [
  { motivo: "Agotado", valor: 32500000 },
  { motivo: "Precio", valor: 18700000 },
  { motivo: "Competencia", valor: 9400000 },
  { motivo: "Tiempo entrega", valor: 6200000 }
];

export default function VentasPerdidasPage() {
  const [rol, setRol] = useState("Comercial");
  const [motivo, setMotivo] = useState("Agotado");
  const [producto, setProducto] = useState(inventario[0]?.producto || "");
  const seleccionado = inventario.find((i) => i.producto === producto);
  const total = ventasPerdidas.reduce((s, v) => s + v.valor, 0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("copiloto_user");
      const user = raw ? JSON.parse(raw) : null;
      setRol(user?.rol || "Comercial");
    } catch {}
  }, []);

  const esComercial = rol === "Comercial";

  return (
    <AppLayout>
      <Hero
        title={esComercial ? "Registrar ventas perdidas" : "Inteligencia de ventas perdidas"}
        subtitle={
          esComercial
            ? "Registre oportunidades que no se cerraron. Si fue por precio, adjunte evidencia; si fue por agotado, se alertará automáticamente a compras."
            : "Informe visual consolidado para entender por qué se pierden ventas y qué decisiones debe tomar cada área."
        }
      />

      {esComercial ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-black">Nuevo registro</h2>
            <p className="mt-2 text-slate-500">
              Este suministro lo registra únicamente el comercial porque conoce la conversación real con el cliente.
            </p>
            <div className="mt-5 space-y-4">
              <input className="input" placeholder="Cliente" />
              <input className="input" placeholder="Valor estimado perdido" />
              <select className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option>Agotado</option>
                <option>Precio</option>
                <option>Competencia</option>
                <option>Cartera</option>
                <option>Tiempo de entrega</option>
              </select>

              {motivo === "Agotado" && (
                <>
                  <select className="input" value={producto} onChange={(e) => setProducto(e.target.value)}>
                    {inventario.map((i) => <option key={i.sku}>{i.producto}</option>)}
                  </select>
                  {seleccionado && (
                    <div className="alert alert-red">
                      Se generará alerta a compras: {seleccionado.producto} tiene stock {seleccionado.stock} y estado {seleccionado.estado}.
                    </div>
                  )}
                </>
              )}

              {motivo === "Precio" && (
                <>
                  <input className="input" placeholder="Precio competencia / observación" />
                  <input className="input" type="file" accept="image/*,.pdf" />
                  <p className="text-sm text-slate-500">
                    Opcional: suba foto de factura, cotización o evidencia de competencia.
                  </p>
                </>
              )}

              <textarea className="input" placeholder="Observación del cliente" />
              <button className="btn w-full">Guardar venta perdida</button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-black">Mi retroalimentación comercial</h2>
            <p className="mt-2 text-slate-500">
              Este panel le ayuda a explicar por qué se pierden negocios y qué debe corregirse.
            </p>
            <div className="mt-5 space-y-3">
              <div className="alert alert-blue">Cuando sea agotado, el sistema avisa a compras.</div>
              <div className="alert alert-yellow">Cuando sea precio, adjunte evidencia para que gerencia evalúe margen o estrategia.</div>
              <div className="alert alert-green">Cuando sea competencia, registre nombre y condición ofrecida.</div>
              <div className="alert alert-red">Cuando sea cartera, revise bloqueo o autorización antes de insistir.</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-black">Resumen ejecutivo</h2>
            <p className="mt-2 text-slate-500">
              Consolidado para decidir acciones de precio, inventario, cartera o recuperación comercial.
            </p>
            <p className="mt-5 text-4xl font-black">{money(total)}</p>
            <p className="mt-2 text-sm text-slate-500">Valor estimado de ventas no cerradas.</p>

            <div className="mt-5 space-y-3">
              {ventasPerdidas.map((v) => (
                <div key={v.id} className={v.motivo === "Agotado" ? "alert alert-red" : "alert alert-yellow"}>
                  {v.motivo}: {v.cliente} · {v.producto} · {money(v.valor)} · Responsable: {v.comercial}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-black">Motivos de pérdida</h2>
            <p className="mt-2 text-slate-500">
              Gráfico para priorizar decisiones por impacto económico.
            </p>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumenMotivos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="motivo" />
                  <YAxis />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Bar dataKey="valor" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </AppLayout>
  );
}