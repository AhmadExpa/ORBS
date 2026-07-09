import Link from "next/link";
import { legalPages } from "@/lib/legal-content";
import { companyLinks, featuredPartnerLogos } from "@/lib/marketing-content";
import { siteConfig } from "@/lib/constants/site";
import { serviceVerticals } from "@/lib/shared";
import { BrandLogo } from "./brand-logo";

const footerInvertedLogoNames = new Set(["OpenAI", "Kimi"]);

export function SiteFooter() {
  return (
    <footer id="site-footer" className="relative overflow-hidden border-t border-slate-800 bg-[#020817] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_90%_12%,rgba(249,115,22,0.12),transparent_30%)]" />
      <div className="relative mx-auto w-full max-w-[1520px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-end">
          <div>
            <Link href="/" className="inline-flex w-fit">
              <BrandLogo className="h-12 w-[230px]" imageClassName="brightness-0 invert" />
            </Link>
            <h2 className="mt-8 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Managed technology operations built with proven partners.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
              Infrastructure, cybersecurity, AI enablement, workflow automation, UCaaS, payment review, and support operations managed through one accountable service model.
            </p>
          </div>
          <div className="border-l border-slate-700/70 pl-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Ready for managed delivery</p>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Start with a service plan, choose the right operational stack, and keep billing, support, and renewals connected after launch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/services" className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                Explore Services
              </Link>
              <Link href="/tech-stack" className="rounded-md border border-cyan-300/40 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/10">
                View Tech Stack
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-y border-slate-800 py-5">
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Partner ecosystem</p>
            <div className="eo-scrollbar-none flex flex-nowrap items-center gap-4 overflow-x-auto lg:justify-start">
              {featuredPartnerLogos.map((partner) => (
                <div key={partner.name} className="flex h-9 min-w-fit shrink-0 items-center justify-center">
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      loading="eager"
                      decoding="async"
                      width={96}
                      height={24}
                      className={`h-6 w-auto max-w-[96px] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.18)] ${footerInvertedLogoNames.has(partner.name) ? "brightness-0 invert" : ""}`}
                    />
                  ) : (
                    <span className="text-center text-sm font-semibold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.45fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Services</p>
            <div className="mt-5 grid gap-3">
              {serviceVerticals.map((vertical) => (
                <Link key={vertical.slug} href={`/${vertical.slug}`} className="text-sm font-medium text-slate-400 transition hover:text-white">
                  {vertical.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Company</p>
            <div className="mt-5 grid gap-3">
              {companyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-400 transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 text-sm leading-7 text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Address</p>
              <address className="mt-3 not-italic">
                {siteConfig.companyAddressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legal</p>
            <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Link href="/legal" className="text-sm font-medium text-slate-300 transition hover:text-white">
                Legal Center
              </Link>
              {legalPages.map((page) => (
                <Link key={page.slug} href={`/legal/${page.slug}`} className="text-sm font-medium text-slate-400 transition hover:text-white">
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ElevenOrbits. All rights reserved.</p>
          <p>Built with proven partners. Delivered with ElevenOrbits expertise.</p>
        </div>
      </div>
    </footer>
  );
}
