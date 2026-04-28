export function Section({ eyebrow, title, description, children, className = "", TitleTag = "h2" }) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-20 md:py-32 ${className}`}>
      <div className="mb-16 max-w-3xl">
        {eyebrow ? (
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-emerald-600/80">
            {eyebrow}
          </p>
        ) : null}
        <TitleTag className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl mb-6">
          {title}
        </TitleTag>
        {description ? (
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
            {description}
          </p>
        ) : null}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}

export function MetricCard({ label, value, note, icon }) {
  return (
    <div className="glass-card-matte p-8 rounded-[2.5rem] border border-emerald-100/50 hover:border-emerald-500/30 transition-all duration-500 group">
      <div className="flex items-center gap-4 mb-6">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
        )}
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-600 transition-colors">
          {label}
        </p>
      </div>
      <p className="text-5xl font-black text-slate-900 tracking-tight mb-3">
        {value}
      </p>
      <p className="text-slate-500 font-medium leading-relaxed">
        {note}
      </p>
    </div>
  );
}
