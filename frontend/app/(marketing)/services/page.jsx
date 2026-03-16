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
      <SectionHeading
        eyebrow="Services"
        title="Managed service lines for infrastructure, AI, workflows, and support."
        description="Customers browse services here, review managed plan details, and move into the order flow for fixed-price offerings."
      />
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
