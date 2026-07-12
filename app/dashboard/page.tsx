"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { GoalTrafficLight } from "@/components/GoalTrafficLight";
import { calculateGoalStatus } from "@/lib/business-days";
import {
  alertas,
  cartera,
  comerciales,
  inventario,
  money,
  productosPareto,
  ventasPerdidas
} from "@/lib/demo-data";
import {
  AlertTriangle,
  CalendarDays,
  DollarSign,
  Package,
  ShoppingCart,
  Target,
  TrendingUp,
  Users
} from "lucide-react";

type CurrentUser = {
  nombre?: string;
  rol?: string;
  comercial?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser>({ rol: "Gerencia Comercial" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("copiloto_user");
      setUser(raw ? JSON.parse(raw) : { rol: "Gerencia Comercial" });
    } catch {
      setUser({ rol: "Gerencia Comercial" });
    }
  }, []);

  const rol = user?.rol || "Gerencia Comercial";
  const totalVentas = comerciales.reduce((s, c) => s + c.venta, 0);
  const totalMeta = comerciales.reduce((s, c) => s + c.meta, 0);

  const currentCommercial = useMemo(() => {
    return (
      comerciales.find((c) => c.nombre === user?.comercial) ||
      comerciales.find((c) => c.nombre === user?.nombre) ||
      comerciales[0]
    );
  }, [user]);

  const generalStatus = calculateGoalStatus(totalVentas, totalMeta, "Equipo comercial");
  const commercialStatus = calculateGoalStatus(
    currentCommercial.venta,
    currentCommercial.meta,
    currentCommercial.nombre
  );

  if (rol === "Comercial") {
    return (
      <AppLayout>
        <Hero
          title={`Hola, ${user?.nombre || currentCommercial.nombre}`}
          subtitle="Tu tablero compara el avance real con los días hábiles transcurridos para ayudarte a actuar a tiempo."
        />

        <GoalTrafficLight status={commercialStatus} title="Mi semáforo comercial" />

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Mi meta mensual"
            value={money(currentCommercial.meta)}
            subtitle={`Periodo: ${commercialStatus.monthLabel}`}
            icon={<Target />}
          />
          <KpiCard
            title="Mis ventas"
            value={money(currentCommercial.venta)}
            subtitle={`${commercialStatus.actualProgress.toFixed(1)}% de cumplimiento`}
            icon={<TrendingUp />}
          />
          <KpiCard
            title="Días hábiles restantes"
            value={commercialStatus.businessDaysRemaining}
            subtitle={`${commercialStatus.businessDaysElapsed} de ${commercialStatus.businessDaysTotal} transcurridos`}
            icon={<CalendarDays />}
          />
          <KpiCard
            title="Mi cartera"
            value={money(currentCommercial.cartera)}
            subtitle="Revise clientes antes de nuevas ventas"
            icon={<DollarSign />}
          />
        </section>

        <section className="card mt-6">
          <h2 className="text-xl font-black">Qué hacer hoy</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="alert alert-blue">
              Priorice clientes que han disminuido compras y tienen potencial de recompra.
            </div>
            <div className="alert alert-green">
              Ofrezca {productosPareto[0]?.nombre || "el producto Pareto principal"} a clientes activos.
            </div>
            <div className="alert alert-yellow">
              Revise cartera pendiente antes de comprometer nuevas entregas.
            </div>
            <div className="alert alert-red">
              Registre de inmediato ventas perdidas por precio o agotados.
            </div>
          </div>
        </section>
      </AppLayout>
    );
  }

  if (rol === "Compras") {
    const críticos = inventario.filter((i) => i.estado !== "DISPONIBLE");
    const pérdidaAgotados = ventasPerdidas
      .filter((v) => v.motivo === "Agotado")
      .reduce((s, v) => s + v.valor, 0);

    return (
      <AppLayout>
        <Hero
          title="Compras e inventario"
          subtitle={`Hoy es ${generalStatus.todayLabel}. El tablero prioriza reposición, agotados y riesgo de pérdida.`}
        />
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Referencias críticas" value={críticos.length} subtitle="Agotadas o por debajo del punto de pedido" icon={<Package />} />
          <KpiCard title="Pérdida por agotados" value={money(pérdidaAgotados)} subtitle="Reportada por comerciales" icon={<ShoppingCart />} />
          <KpiCard title="Alertas urgentes" value={alertas.filter((a) => a.destinoRol === "Compras").length} subtitle="Requieren revisión" icon={<AlertTriangle />} />
          <KpiCard title="Fecha actual" value={generalStatus.todayLabel} subtitle="Calendario operativo Colombia" icon={<CalendarDays />} />
        </section>
      </AppLayout>
    );
  }

  const statuses = comerciales.map((c) => ({
    comercial: c,
    status: calculateGoalStatus(c.venta, c.meta, c.nombre)
  }));

  const criticalSeller = [...statuses].sort((a, b) => a.status.deviation - b.status.deviation)[0];
  const bestSeller = [...statuses].sort((a, b) => b.status.deviation - a.status.deviation)[0];
  const carteraCritica = cartera.filter((c) => c.dias >= 60).reduce((s, c) => s + c.saldo, 0);

  return (
    <AppLayout>
      <Hero
        title={rol === "Gerencia General" ? "Panel ejecutivo general" : "Gerencia Comercial"}
        subtitle="La meta general y el desempeño individual se comparan con los días hábiles reales del mes."
      />

      <GoalTrafficLight status={generalStatus} title="Semáforo de meta general" />

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Meta general" value={money(totalMeta)} subtitle={generalStatus.monthLabel} icon={<Target />} />
        <KpiCard title="Ventas acumuladas" value={money(totalVentas)} subtitle={`${generalStatus.actualProgress.toFixed(1)}% real`} icon={<TrendingUp />} />
        <KpiCard title="Días hábiles restantes" value={generalStatus.businessDaysRemaining} subtitle={`${generalStatus.businessDaysElapsed} de ${generalStatus.businessDaysTotal}`} icon={<CalendarDays />} />
        <KpiCard title="Cartera crítica" value={money(carteraCritica)} subtitle="Mayor a 60 días" icon={<DollarSign />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-black">Alertas de acompañamiento</h2>
          <div className="mt-5 space-y-4">
            <div className="alert alert-red">
              {criticalSeller.status.managementMessage}
            </div>
            <div className="alert alert-green">
              {bestSeller.comercial.nombre} está mostrando un ritmo positivo. Conviene reconocer su gestión y revisar qué estrategia puede compartir con el equipo.
            </div>
            <div className="alert alert-yellow">
              Revise hoy los vendedores con desviación inferior a -5 puntos frente al cumplimiento esperado.
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-black">Semáforo por comercial</h2>
          <div className="mt-5 space-y-4">
            {statuses
              .sort((a, b) => a.status.deviation - b.status.deviation)
              .map(({ comercial, status }) => {
                const color =
                  status.color === "green"
                    ? "bg-green-500"
                    : status.color === "yellow"
                    ? "bg-amber-400"
                    : "bg-red-500";

                const border =
                  status.color === "green"
                    ? "border-green-200 bg-green-50"
                    : status.color === "yellow"
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50";

                return (
                  <div key={comercial.nombre} className={`rounded-2xl border p-4 ${border}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-4 w-4 rounded-full ${color}`} />
                        <div>
                          <p className="font-black">{comercial.nombre}</p>
                          <p className="text-sm text-slate-600">
                            {status.actualProgress.toFixed(1)}% real · {status.expectedProgress.toFixed(1)}% esperado
                          </p>
                        </div>
                      </div>
                      <span className="badge bg-white text-slate-800">{status.label}</span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.min(status.actualProgress, 100)}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      {status.managementMessage}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}