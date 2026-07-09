import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { siteConfig } from "@/lib/constants/site";
import { getLoginPath, getSignupPath } from "@/lib/shared";
import { ServiceLogoCluster, ServiceVisualPanel } from "@/components/marketing/service-branding";

const contactServiceSlugs = ["vps", "cdn", "object-storage", "workflows", "vicidial", "cybersecurity", "hermes-ai-hosting"];

const departmentServiceSlugs = {
  general: ["vps", "workflows", "vicidial"],
  sales: ["vps", "vds", "cdn", "object-storage", "hermes-ai-hosting", "openclaw-hosting", "nextcloud-hosting"],
  support: ["development-support", "vps", "vicidial"],
  billing: ["vps", "vds", "object-storage"],
  security: ["cybersecurity", "vps", "cdn"],
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.24)] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Department Directory"
            title="Reach the right ElevenOrbits team without routing every request through one inbox."
            description="Use the directory below for service-specific questions, sales conversations, billing, support, and operational requests."
            className="max-w-none"
          />
          <ServiceLogoCluster categorySlugs={contactServiceSlugs} max={7} showLabels className="mt-7" />
        </div>
        <ServiceVisualPanel
          title="Service-aware routing"
          description="Contact routes map back to the same service catalog used across pricing, public pages, and the portal."
          categorySlugs={contactServiceSlugs}
        />
      </section>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>General Inbox</CardTitle>
            <CardDescription>Use this if you are not sure which department should own the conversation yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <a className="text-base font-semibold text-sky-700" href={`mailto:${siteConfig.generalEmail}`}>
              {siteConfig.generalEmail}
            </a>
            <ServiceLogoCluster categorySlugs={departmentServiceSlugs.general} max={3} className="mt-5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Address</CardTitle>
            <CardDescription>Use this address for company records and formal correspondence.</CardDescription>
          </CardHeader>
          <CardContent>
            <address className="text-base font-semibold not-italic leading-7 text-slate-950">
              {siteConfig.companyAddressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <ServiceLogoCluster categorySlugs={["vps", "cybersecurity", "development-support"]} max={3} className="mt-5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portal Access</CardTitle>
            <CardDescription>Create an account to manage subscriptions, invoices, payments, and tickets.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Link href={getSignupPath()}>
              <Button>Sign Up</Button>
            </Link>
            <Link href={getLoginPath()}>
              <Button variant="ghost">Log In</Button>
            </Link>
            <ServiceLogoCluster categorySlugs={["vps", "workflows"]} max={2} className="sm:ml-auto" />
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {siteConfig.departmentContacts.map((department) => (
          <Card key={department.key}>
            <CardHeader>
              <CardTitle>{department.title}</CardTitle>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a className="text-base font-semibold text-sky-700" href={`mailto:${department.email}`}>
                {department.email}
              </a>
              <ServiceLogoCluster categorySlugs={departmentServiceSlugs[department.key] || contactServiceSlugs} max={5} className="mt-5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
