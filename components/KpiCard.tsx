import { ReactNode } from "react";

export function KpiCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <div className="text-blue-700">{icon}</div>
      </div>
      <p className="text-3xl font-black text-slate-950">{value}</p>
      {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}