"use client";

import { useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { alertas, inventario, money, ventasPerdidas } from "@/lib/demo-data";
import { AlertTriangle, Clock, PackageCheck, ShoppingCart } from "lucide-react";

export default function InventarioPage() {
  const [data, setData] = useState(inventario);
  const agotados = data.filter((i) => i.estado === "AGOTADO").length;
  const criticos = data.filter((i) => i.estado === "CRÍTICO").length;
  const perdidasAgotado = ventasPerdidas.filter((v) => v.motivo === "Agotado").reduce((s, v) => s + v.valor, 0);

  function aplicarSugerencia(sku: string) {
    setData((prev) => prev.map((i) => i.sku === sku ? { ...i, stockSeguridad: Math.max(i.stockSeguridad, i.puntoPedido), estado: i.stock === 0 ? "AGOTADO" : "CRÍTICO" } : i));
    alert("Sugerencia aplicada al parámetro demo. En Supabase se guardará en configuración de producto.");
  }

  const sugerencias = data.map((i) => ({
    ...i,
    cantidadSugerida: Math.max(i.puntoPedido + i.stockSeguridad - i.stock, 0),
    prioridad: i.estado === "AGOTADO" ? "Urgente" : i.estado === "CRÍTICO" ? "Alta" : "Normal"
  }));

  return (
    <AppLayout>
      <Hero title="Compras e inventario inteligente" subtitle="Compras administra lead time, stock de seguridad, punto de pedido y reposición. Estos parámetros solo pertenecen al rol de compras/inventario." />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Agotados" value={agotados} subtitle="Riesgo directo de pérdida" icon={<AlertTriangle />} />
        <KpiCard title="Stock crítico" value={criticos} subtitle="Por debajo del punto de pedido" icon={<PackageCheck />} />
        <KpiCard title="Ventas perdidas por agotado" value={money(perdidasAgotado)} subtitle="Información reportada por comerciales" icon={<ShoppingCart />} />
        <KpiCard title="Lead time promedio" value="9 días" subtitle="Configurable por producto/proveedor" icon={<Clock />} />
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-black">Alertas recibidas desde comerciales</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {alertas.filter((a) => a.destinoRol === "Compras").map((a) => <div key={a.id} className={a.prioridad === "Urgente" ? "alert alert-red" : "alert alert-yellow"}>{a.mensaje}</div>)}
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-black">Sugerencias de compra</h2>
        <p className="mt-2 text-slate-500">Cruza ventas perdidas, stock actual, stock de seguridad, punto de pedido y tiempo de reposición.</p>
        <div className="mt-5 overflow-x-auto">
          <table className="table">
            <thead><tr><th>SKU</th><th>Producto</th><th>Stock</th><th>Lead time</th><th>Stock seguridad</th><th>Punto pedido</th><th>Compra sugerida</th><th>Acción</th></tr></thead>
            <tbody>
              {sugerencias.map((i) => (
                <tr key={i.sku}>
                  <td className="font-bold">{i.sku}</td>
                  <td>{i.producto}</td>
                  <td>{i.stock}</td>
                  <td><input className="input" value={i.leadTimeDias} onChange={(e) => setData((prev) => prev.map((x) => x.sku === i.sku ? { ...x, leadTimeDias: Number(e.target.value) || 0 } : x))} /></td>
                  <td><input className="input" value={i.stockSeguridad} onChange={(e) => setData((prev) => prev.map((x) => x.sku === i.sku ? { ...x, stockSeguridad: Number(e.target.value) || 0 } : x))} /></td>
                  <td>{i.puntoPedido}</td>
                  <td className="font-black text-blue-700">{i.cantidadSugerida}</td>
                  <td><button className="btn-secondary" onClick={() => aplicarSugerencia(i.sku)}>Aplicar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}