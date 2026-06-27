export function Topbar({ title, subtitle, actions }) {
  return (
    <div
      className="sticky z-30 border-b border-line bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85 md:px-8"
      style={{ top: "var(--eo-topbar-top, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">ElevenOrbits</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[26px]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 md:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
