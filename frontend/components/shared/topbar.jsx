export function Topbar({ title, subtitle, actions }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/70 bg-white/78 px-6 py-5 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.45)] backdrop-blur-2xl md:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">ElevenOrbits</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-[28px]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 md:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
