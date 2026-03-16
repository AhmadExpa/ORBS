import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-slate-800 bg-black shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
          >
            <Image
              src="/invoice.png"
              alt="ElevenOrbits mark"
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-2xl object-contain"
            />
          </Link>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400">ElevenOrbits</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Managed infrastructure handled with operational discipline.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              ElevenOrbits centralizes infrastructure delivery, AI systems, workflow execution, payment review, and support operations under one accountable team.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ElevenOrbits. All rights reserved.</p>
          <p>Managed infrastructure. AI systems. Workflow operations.</p>
        </div>
      </div>
    </footer>
  );
}
