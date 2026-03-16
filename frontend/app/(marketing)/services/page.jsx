import Link from "next/link";
import {
  Bot,
  Cpu,
  Database,
  PhoneCall,
  Server,
  ShieldCheck,
  Wrench,
  Workflow,
} from "lucide-react";
import { serviceCategories } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { OrbMascot } from "@/components/shared/orb-mascot";

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
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.2)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Services"
              title="Managed service lines for infrastructure, AI, workflows, and support."
              description="Customers browse services here, review managed plan details, and move into the order flow for fixed-price offerings."
              className="max-w-none"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["AI Guidance", "Support Ready", "Managed Delivery", "Clear Onboarding"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:justify-self-end">
            <OrbMascot
              size="md"
              eyebrow="Meet Orbs"
              title="The site guide for AI, support, and FAQs."
              description="Orbs is the ElevenOrbits character used across AI guidance, support surfaces, and customer-help sections."
            />
          </div>
        </div>
      </section>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
