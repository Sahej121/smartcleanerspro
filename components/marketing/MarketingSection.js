export function Section({ eyebrow, title, description, children }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="mb-10 max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  );
}
