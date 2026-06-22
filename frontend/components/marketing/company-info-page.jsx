import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function CompanyInfoPage({ page }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{page.description}</p>
          </div>
          <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operating View</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{page.summary}</p>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-6 py-10 md:grid-cols-3">
          {page.metrics.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="grid gap-8">
            {page.sections.map((section) => (
              <article key={section.heading} className="grid gap-5 border-b border-slate-200 pb-8 last:border-0 last:pb-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
                </div>
                <div>
                  <p className="text-sm leading-7 text-slate-600">{section.body}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {section.points.map((point) => (
                      <div key={point} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                        <p className="text-sm leading-6 text-slate-700">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/services" className="inline-flex items-center gap-2 rounded-lg border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black">
              Explore services
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950">
              Contact the team
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
