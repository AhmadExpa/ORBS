export function Topbar({ title, subtitle, actions }) {
  return (
    <div
      className="sticky z-30 border-b border-line bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6 sm:py-5 md:px-8"
      style={{ top: "var(--eo-topbar-top, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:justify-end [&>*]:w-full sm:[&>*]:w-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
