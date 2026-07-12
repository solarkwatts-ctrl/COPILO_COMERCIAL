"use client";

import { GoalStatus } from "@/lib/business-days";
import { CalendarDays, Clock3, Target, TrendingUp } from "lucide-react";

const styles = {
  green: {
    card: "border-green-200 bg-green-50",
    light: "bg-green-500 shadow-[0_0_24px_rgba(34,197,94,0.7)]",
    badge: "bg-green-100 text-green-800",
    text: "text-green-900",
    progress: "bg-green-500"
  },
  yellow: {
    card: "border-amber-200 bg-amber-50",
    light: "bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.75)]",
    badge: "bg-amber-100 text-amber-800",
    text: "text-amber-900",
    progress: "bg-amber-400"
  },
  red: {
    card: "border-red-200 bg-red-50",
    light: "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.7)]",
    badge: "bg-red-100 text-red-800",
    text: "text-red-900",
    progress: "bg-red-500"
  }
};

export function GoalTrafficLight({
  status,
  title = "Semáforo de cumplimiento"
}: {
  status: GoalStatus;
  title?: string;
}) {
  const s = styles[status.color];

  return (
    <section className={`rounded-3xl border p-6 ${s.card}`}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="flex shrink-0 items-center gap-4">
          <div className="rounded-3xl bg-slate-950 p-4">
            <div className="flex flex-col gap-2">
              <span className={`h-7 w-7 rounded-full ${status.color === "red" ? s.light : "bg-slate-700"}`} />
              <span className={`h-7 w-7 rounded-full ${status.color === "yellow" ? s.light : "bg-slate-700"}`} />
              <span className={`h-7 w-7 rounded-full ${status.color === "green" ? s.light : "bg-slate-700"}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</p>
            <h2 className={`mt-1 text-2xl font-black ${s.text}`}>{status.label}</h2>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-black ${s.badge}`}>
              {status.actualProgress.toFixed(1)}% real · {status.expectedProgress.toFixed(1)}% esperado
            </span>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/80 p-4">
            <CalendarDays className="text-blue-700" size={20} />
            <p className="mt-2 text-xs font-bold text-slate-500">Fecha actual</p>
            <p className="mt-1 font-black capitalize text-slate-950">{status.todayLabel}</p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <Clock3 className="text-violet-700" size={20} />
            <p className="mt-2 text-xs font-bold text-slate-500">Días hábiles restantes</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{status.businessDaysRemaining}</p>
            <p className="text-xs text-slate-500">
              {status.businessDaysElapsed} de {status.businessDaysTotal} transcurridos
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <Target className="text-amber-700" size={20} />
            <p className="mt-2 text-xs font-bold text-slate-500">Cumplimiento esperado</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{status.expectedProgress.toFixed(1)}%</p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <TrendingUp className="text-green-700" size={20} />
            <p className="mt-2 text-xs font-bold text-slate-500">Cumplimiento real</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{status.actualProgress.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
          <span>Avance hacia la meta</span>
          <span>{Math.min(status.actualProgress, 100).toFixed(1)}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-all ${s.progress}`}
            style={{ width: `${Math.min(status.actualProgress, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white/85 p-5">
        <p className={`text-lg font-black ${s.text}`}>{status.message}</p>
      </div>
    </section>
  );
}