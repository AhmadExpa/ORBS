import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { legalLastUpdated, legalPages } from "@/lib/legal-content";
import { siteConfig } from "@/lib/constants/site";
import { ServiceLogoCluster, ServiceVisualPanel } from "@/components/marketing/service-branding";

const legalServiceSlugs = ["vps", "vds", "workflows", "cybersecurity", "object-storage", "development-support"];

export const metadata = {
  title: "Legal",
  description: "ElevenOrbits legal policies, terms, privacy details, marketing rules, security notices, refund rules, and operational service requirements.",
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalCenterPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Legal Center</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Policies for ElevenOrbits customers, visitors, and managed service users.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              Review the current terms, privacy practices, marketing rules, cookie information, refund rules, security expectations, service policies, and acceptable use requirements before using the website, portal, or managed services.
            </p>
            <p className="mt-5 text-sm font-medium text-slate-500">Last updated {legalLastUpdated}</p>
            <ServiceLogoCluster categorySlugs={legalServiceSlugs} max={6} showLabels className="mt-7" />
          </div>
          <ServiceVisualPanel
            title="Policy coverage for managed operations"
            description="The legal center covers ordering, portal access, service delivery, billing, acceptable use, privacy, and operational support."
            categorySlugs={legalServiceSlugs}
          />
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-[1280px] gap-5 px-6 py-12 md:grid-cols-2 xl:grid-cols-3">
          {legalPages.map((page) => (
            <Link
              key={page.slug}
              href={`/legal/${page.slug}`}
              className="group rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_54px_-42px_rgba(15,23,42,0.42)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{page.navLabel}</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{page.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{page.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-slate-950">
                Read policy
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-slate-50">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Legal and policy questions can be sent to{" "}
            <a className="font-semibold text-sky-700" href={`mailto:${siteConfig.generalEmail}`}>
              {siteConfig.generalEmail}
            </a>
            . Billing review questions can be sent to{" "}
            <a className="font-semibold text-sky-700" href={`mailto:${siteConfig.billingEmail}`}>
              {siteConfig.billingEmail}
            </a>
            . Company address: <span className="font-semibold text-slate-900">{siteConfig.companyAddress}</span>.
          </p>
        </div>
      </section>
    </main>
  );
}
