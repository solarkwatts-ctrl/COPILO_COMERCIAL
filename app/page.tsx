import Link from "next/link";
import { ArrowRight, Brain, PackageCheck, TrendingUp, WalletCards } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-7xl">
        <div className="hero">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-2xl font-black text-slate-950">IA</div>
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-white/70">Copiloto Comercial IA</p>
              <h1 className="max-w-5xl text-4xl font-black leading-tight md:text-6xl">
                La inteligencia que convierte sus datos en decisiones comerciales.
              </h1>
              <p className="mt-5 max-w-4xl text-lg text-white/85">
                Detecte clientes que caen, ventas perdidas, cartera crítica, productos agotados y compras urgentes antes de que afecten la utilidad.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-black text-slate-950">
                Ingresar a la demo <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-3 rounded-2xl border border-white/40 px-6 py-4 font-black text-white">
                Volver al panel <ArrowRight size={18} />
              </Link>
            </div>
            </div>
          </div>
        </div>

        <div className="landing-grid mt-8">
          <div className="card">
            <TrendingUp className="text-blue-700" />
            <h2 className="mt-4 text-2xl font-black">Venda con foco</h2>
            <p className="mt-3 text-slate-600">Metas por vendedor, cumplimiento por días hábiles, clientes que caen y oportunidades de recuperación.</p>
          </div>
          <div className="card">
            <PackageCheck className="text-teal-700" />
            <h2 className="mt-4 text-2xl font-black">Compre con precisión</h2>
            <p className="mt-3 text-slate-600">Alertas por agotados, stock de seguridad, punto de pedido, lead time y compras sugeridas por IA.</p>
          </div>
          <div className="card">
            <WalletCards className="text-orange-700" />
            <h2 className="mt-4 text-2xl font-black">Recupere cartera</h2>
            <p className="mt-3 text-slate-600">Semáforo de cartera, acciones críticas, bloqueos sugeridos y alertas urgentes al comercial responsable.</p>
          </div>
        </div>

        <div className="card mt-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Diseñado para empresas que ya tienen software, pero necesitan inteligencia.</h2>
              <p className="mt-2 text-slate-600">Suba reportes de ventas, cartera, inventario, compras, clientes y metas. El Copiloto depura, cruza y genera decisiones.</p>
            </div>
            <Brain className="text-blue-700" size={42} />
          </div>
        </div>
      </section>
    </main>
  );
}