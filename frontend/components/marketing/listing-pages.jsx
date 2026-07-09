import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ServiceLogoCluster } from "./service-branding";

const coreServiceSlugs = ["vps", "workflows", "vicidial", "cybersecurity", "cdn", "hermes-ai-hosting"];

const recommendationSlugs = {
  "Managed Servers": ["vps", "vds"],
  "Cybersecurity Services": ["cybersecurity"],
  "Workflow Automation": ["workflows"],
  "VoIP and Vicidial Services": ["vicidial"],
  "Development Support": ["development-support"],
  "AI Services": ["ai-servers", "ai-solutions", "workflows"],
  "Managed CDN": ["cdn"],
  "Object Storage": ["object-storage"],
  "Self-Hosted App Services": ["hermes-ai-hosting", "openclaw-hosting", "nextcloud-hosting"],
};

const resourceSlugs = {
  "managed-vps-buyers-guide": ["vps", "vds"],
  "private-ai-deployment-checklist": ["ai-servers", "ai-solutions", "hermes-ai-hosting"],
  "workflow-automation-readiness": ["workflows"],
  "vicidial-operations-checklist": ["vicidial"],
  "server-security-hardening-baseline": ["cybersecurity", "vps"],
  "billing-renewal-guide": ["vps", "development-support"],
};

function slugsForRecommendations(items = []) {
  return [...new Set(items.flatMap((item) => recommendationSlugs[item] || []))];
}

export function IndustryIndex({ industries }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Industries</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Managed operations for teams that depend on hosted systems.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            ElevenOrbits supports industries where infrastructure, support, billing, security, and automation need to stay coordinated after launch.
          </p>
          <ServiceLogoCluster categorySlugs={coreServiceSlugs} max={6} showLabels className="mt-7" />
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-[1280px] gap-5 px-6 py-12 md:grid-cols-2 xl:grid-cols-3">
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="group rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_54px_-42px_rgba(15,23,42,0.42)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{industry.eyebrow}</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{industry.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{industry.description}</p>
              <ServiceLogoCluster categorySlugs={slugsForRecommendations(industry.recommended)} max={4} className="mt-5" />
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-slate-950">
                Read details
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function IndustryDetail({ industry }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link href="/industries" className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Industries
          </Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{industry.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{industry.description}</p>
          <ServiceLogoCluster categorySlugs={slugsForRecommendations(industry.recommended)} max={6} showLabels className="mt-7" />
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Why It Fits</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{industry.fit}</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Common Challenges</h2>
              <div className="mt-5 grid gap-3">
                {industry.challenges.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Expected Outcomes</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {industry.outcomes.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended Services</p>
            <div className="mt-4 grid gap-2">
              {industry.recommended.map((item) => (
                <span key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{item}</span>
              ))}
            </div>
            <ServiceLogoCluster categorySlugs={slugsForRecommendations(industry.recommended)} max={5} className="mt-5" />
            <Link href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
              Compare services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function ResourceIndex({ resources }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Resources</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Practical guides for managed infrastructure, AI, automation, security, VoIP, and billing.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            Use these guides to prepare better service requests, reduce back-and-forth, and make operational decisions before entering the portal.
          </p>
          <ServiceLogoCluster categorySlugs={coreServiceSlugs} max={6} showLabels className="mt-7" />
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-[1280px] gap-5 px-6 py-12 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Link key={resource.slug} href={`/resources/${resource.slug}`} className="group rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_54px_-42px_rgba(15,23,42,0.42)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{resource.eyebrow}</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{resource.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{resource.description}</p>
              <ServiceLogoCluster categorySlugs={resourceSlugs[resource.slug] || coreServiceSlugs} max={4} className="mt-5" />
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-slate-950">
                Open guide
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ResourceDetail({ resource }) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link href="/resources" className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Resources
          </Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{resource.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{resource.description}</p>
          <ServiceLogoCluster categorySlugs={resourceSlugs[resource.slug] || coreServiceSlugs} max={6} showLabels className="mt-7" />
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Guide Summary</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{resource.intro}</p>
            <ServiceLogoCluster categorySlugs={resourceSlugs[resource.slug] || coreServiceSlugs} max={5} className="mt-5" />
          </aside>
          <div className="space-y-8">
            {resource.sections.map((section) => (
              <section key={section.heading} className="border-b border-slate-200 pb-8 last:border-0 last:pb-0">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
                <div className="mt-5 grid gap-3">
                  {section.points.map((item) => (
                    <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
