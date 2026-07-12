export function Hero({ title, subtitle, logo = "IA" }: { title: string; subtitle: string; logo?: string }) {
  return (
    <section className="hero mb-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-lg font-black text-slate-950 shadow-lg">{logo}</div>
        <div>
          <h1 className="text-3xl font-black md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-4xl text-sm font-medium text-white/85 md:text-base">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}