import Link from "next/link";
import { legalPages } from "@/lib/legal-content";
import { companyLinks } from "@/lib/marketing-content";
import { serviceVerticals } from "@/lib/shared";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Link href="/" className="inline-flex w-fit shrink-0">
            <BrandLogo className="h-12 w-[230px]" imageClassName="brightness-0 invert" />
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
        <div className="mt-10 grid gap-8 border-t border-slate-800 pt-8 lg:grid-cols-[0.85fr_1.1fr_0.7fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Public Product Pages</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              ElevenOrbits.com is the main company hub. Each product sector has a dedicated public page for details, search visibility, and routing into the portal.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {serviceVerticals.map((vertical) => (
              <Link
                key={vertical.slug}
                href={`/${vertical.slug}`}
                className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
              >
                {vertical.name}
              </Link>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Company</p>
            <div className="mt-4 grid gap-2">
              {companyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-400 transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legal</p>
            <div className="mt-4 grid gap-2">
              <Link href="/legal" className="text-sm font-semibold text-slate-300 transition hover:text-white">
                Legal Center
              </Link>
              {legalPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/legal/${page.slug}`}
                  className="text-sm font-semibold text-slate-400 transition hover:text-white"
                >
                  {page.title}
                </Link>
              ))}
            </div>
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
