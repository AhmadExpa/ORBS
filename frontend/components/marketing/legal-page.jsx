import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { legalLastUpdated, legalPages } from "@/lib/legal-content";
import { cn } from "@/lib/ui";

export function LegalPageShell({ page }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-14 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-16">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <Link href="/legal" className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Legal
            </Link>
            <nav className="mt-5 grid gap-2">
              {legalPages.map((item) => (
                <Link
                  key={item.slug}
                  href={`/legal/${item.slug}`}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-semibold transition",
                    item.slug === page.slug
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>

          <article>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Last updated {legalLastUpdated}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{page.description}</p>

            <div className="mt-10 space-y-10 border-t border-slate-200 pt-10">
              {page.sections.map((section) => (
                <section key={section.heading} className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{section.heading}</h2>
                  <div className="space-y-4 text-sm leading-7 text-slate-600">
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.list?.length ? (
                      <ul className="grid gap-2">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
              <Link
                href="/legal"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                Legal center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Contact ElevenOrbits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
