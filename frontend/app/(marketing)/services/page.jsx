import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Cpu,
  Database,
  PhoneCall,
  Server,
  ShieldCheck,
  Wrench,
  Workflow,
} from "lucide-react";
import { serviceCategories, serviceVerticals } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";

export const metadata = {
  title: "Services",
  description:
    "Explore ElevenOrbits managed servers, AI services, VoIP and Vicidial management, cybersecurity, workflow automation, and managed IT support.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "ElevenOrbits Services",
    description:
      "Managed servers, AI services, VoIP, cybersecurity, workflow automation, and technical support from ElevenOrbits.",
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
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.2)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Services"
              title="Managed products and service lines for infrastructure, AI, VoIP, cybersecurity, workflows, and support."
              description="Use this hub to choose the right ElevenOrbits product lane, then open detailed plans, pricing, and order paths."
              className="max-w-none"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["Managed Servers", "AI Services", "VoIP Operations", "Cybersecurity", "Workflow Automation", "IT Support"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 lg:justify-self-end">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Account-First Ordering</p>
                <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  Sign up before configuration and payment.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Paid plans continue into a protected portal flow where settings are chosen before card checkout.
                </p>
              </div>
            </div>
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
            These pages are built for search, answer engines, and real users who need to understand each product before opening a portal account.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceVerticals.map((vertical) => {
            const Icon = serviceIconMap[vertical.categorySlugs[0]] || Server;

            return (
              <Link
                key={vertical.slug}
                href={`/${vertical.slug}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_58px_-46px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-panel"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{vertical.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.015em] text-slate-950">{vertical.name}</h3>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-700 ring-1 ring-slate-950/[0.06]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{vertical.seoDescription}</p>
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
        {serviceCategories.map((category) => {
          const Icon = serviceIconMap[category.slug] || Server;

          return (
            <Card key={category.slug} className="transition hover:-translate-y-1 hover:shadow-panel">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm font-medium text-sky-700">Managed by ElevenOrbits Team</p>
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
