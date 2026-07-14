import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Cloud,
  Cpu,
  Database,
  Network,
  PhoneCall,
  Server,
  ShieldCheck,
  Wrench,
  Workflow,
} from "lucide-react";
import { serviceCategories, serviceVerticals } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { ServiceLogo, ServiceLogoCluster, ServiceVisualPanel, getCategoryBrand } from "@/components/marketing/service-branding";

export const metadata = {
  title: "Services",
  description:
    "Explore ElevenOrbits managed servers, AI services, VoIP and Vicidial management, CDN, O7 Bucket storage, self-hosted apps, cybersecurity, workflow automation, and managed IT support.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "ElevenOrbits Services",
    description:
    "Managed servers, AI services, VoIP, CDN, O7 Bucket storage, self-hosted apps, cybersecurity, workflow automation, and technical support from ElevenOrbits.",
    url: `${siteConfig.publicUrl}/services`,
    siteName: siteConfig.name,
    type: "website",
  },
};

const serviceIconMap = {
  vps: Server,
  vds: Database,
  "ai-servers": Cpu,
  vicidial: PhoneCall,
  workflows: Workflow,
  "ai-solutions": Bot,
  "development-support": Wrench,
  cybersecurity: ShieldCheck,
  cdn: Network,
  "object-storage": Cloud,
  "hermes-ai-hosting": Bot,
  "openclaw-hosting": Bot,
  "nextcloud-hosting": Cloud,
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section className="eo-premium-card eo-reveal-up rounded-lg border border-slate-200 bg-white p-8 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.2)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Services"
              title="Managed products and service lines for infrastructure, AI, VoIP, CDN, storage, self-hosted apps, cybersecurity, workflows, and support."
              description="Use this hub to choose the right ElevenOrbits product lane, then open detailed plans, pricing, and order paths."
              className="max-w-none"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["Managed Servers", "AI Services", "VoIP Operations", "CDN & Storage", "Self-Hosted Apps", "Cybersecurity", "IT Support"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <ServiceVisualPanel
            title="All service lines in one managed catalog"
            description="Customers can compare hosting, AI, call-center, storage, security, and app hosting services before entering the portal."
            categorySlugs={serviceCategories.map((category) => category.slug)}
            className="eo-float-slow lg:justify-self-end"
          />
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-[0_34px_110px_-82px_rgba(15,23,42,0.9)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">Managed Service Context</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">ElevenOrbits manages the service for you.</h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              The catalog is intentionally different from raw self-serve provider pricing. We source through trusted, authentic sellers and technology partners, then include setup ownership, portal records, support routing, billing continuity, and renewal handling.
            </p>
            <Link href="/tech-stack" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100">
              Review Tech Stack
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3 lg:p-7">
            {[
              ["Authentic sourcing", "Partners and providers are visible through the ElevenOrbits technology stack.", BadgeCheck],
              ["Managed ownership", "Provisioning, access handoff, service records, and support follow-up stay with us.", ShieldCheck],
              ["Premium explained", "Pricing can be higher than unmanaged offers because the service includes operations, not only access.", Server],
            ].map(([title, body, Icon]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <Icon className="h-5 w-5 text-orange-300" />
                <h3 className="mt-4 text-sm font-extrabold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product Sectors</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Start with the business outcome.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Each sector page explains the scope, technology stack, delivery model, and order path before a customer opens a portal account.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceVerticals.filter((vertical) => vertical.slug !== "workflow-automation").map((vertical, index) => {
            const Icon = serviceIconMap[vertical.categorySlugs[0]] || Server;

            return (
              <Link
                key={vertical.slug}
                href={`/${vertical.slug}`}
                className="eo-premium-card eo-reveal-soft group rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_58px_-46px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-panel"
                style={{ "--eo-delay": `${Math.min(index * 45, 240)}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{vertical.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.015em] text-slate-950">{vertical.name}</h3>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-950/[0.06]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{vertical.seoDescription}</p>
                <ServiceLogoCluster categorySlugs={vertical.categorySlugs} max={4} className="mt-5" />
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Explore sector
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Plan Detail Pages</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Compare specific managed services.</h2>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {serviceCategories.map((category, index) => {
          const brand = getCategoryBrand(category.slug);

          return (
            <Card
              key={category.slug}
              className="eo-premium-card eo-reveal-soft rounded-lg transition hover:-translate-y-1 hover:shadow-panel"
              style={{ "--eo-delay": `${Math.min(index * 35, 260)}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <ServiceLogo brand={brand} imageClassName="h-8 w-9" className="[&>span:first-child]:h-12 [&>span:first-child]:w-12 [&>span:first-child]:rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Plans, pricing, and configuration</p>
                <Link href={`/services/${category.slug}`}>
                  <Button variant="ghost">Open</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
