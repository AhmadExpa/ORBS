import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  CreditCard,
  Headphones,
  LifeBuoy,
  Mail,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { ServiceLogoCluster } from "@/components/marketing/service-branding";
import { siteConfig } from "@/lib/constants/site";
import { getLoginPath, getSignupPath } from "@/lib/shared";

const contactServiceSlugs = ["vps", "vds", "cdn", "object-storage", "workflows", "vicidial", "cybersecurity", "hermes-ai-hosting"];

const routingCards = [
  {
    key: "sales",
    title: "New services and sales",
    description: "Use this for managed cloud, AI services, call-center operations, cybersecurity, and contact-sales plans.",
    email: siteConfig.salesEmail,
    icon: Headphones,
  },
  {
    key: "support",
    title: "Active service support",
    description: "Use this for existing services, operational issues, access handoff, provisioning notes, and ticket follow-up.",
    email: siteConfig.supportEmail,
    icon: LifeBuoy,
  },
  {
    key: "billing",
    title: "Billing and payments",
    description: "Use this for invoices, wallet top-ups, saved-card questions, renewal records, and payment confirmation.",
    email: siteConfig.billingEmail,
    icon: CreditCard,
  },
  {
    key: "security",
    title: "Security and incidents",
    description: "Use this for cybersecurity service questions, access review, hardening, or incident-response coordination.",
    email: siteConfig.securityEmail,
    icon: ShieldCheck,
  },
];

const contactFacts = [
  { label: "Primary routing", value: siteConfig.generalEmail, icon: Mail },
  { label: "Customer portal", value: "Orders, invoices, tickets", icon: MessageSquare },
  { label: "Billing model", value: "Wallet-first renewals", icon: Wallet },
  { label: "Operating coverage", value: "Managed service follow-up", icon: Clock3 },
];

const portalActions = [
  {
    title: "Create an account",
    description: "Start orders, trial requests, invoices, payments, and contract flow from the customer portal.",
    href: getSignupPath(),
    label: "Open account",
  },
  {
    title: "Existing customer",
    description: "Use portal access for services, billing, support tickets, credentials, and contract records.",
    href: getLoginPath(),
    label: "Log in",
  },
];

function ContactFact({ fact }) {
  const Icon = fact.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 shadow-[0_22px_70px_-62px_rgba(15,23,42,0.8)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] ring-1 ring-orange-100">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{fact.label}</span>
          <span className="mt-1 block truncate text-sm font-extrabold text-slate-950">{fact.value}</span>
        </span>
      </div>
    </div>
  );
}

function RoutingCard({ route }) {
  const Icon = route.icon;

  return (
    <article className="group relative flex min-h-[292px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-[0_30px_95px_-80px_rgba(15,23,42,0.9)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_42px_120px_-80px_rgba(15,23,42,0.95)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff7a1a] via-slate-950 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          {route.key}
        </span>
      </div>
      <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-950">{route.title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{route.description}</p>
      <div className="mt-auto border-t border-slate-200 pt-4">
        <a href={`mailto:${route.email}`} className="group/link inline-flex max-w-full items-center gap-2 text-sm font-extrabold text-[#0069a6] transition hover:text-[#004d7a]">
          <span className="truncate">{route.email}</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition group-hover/link:translate-x-0.5" />
        </a>
      </div>
    </article>
  );
}

function DepartmentRow({ department }) {
  return (
    <div className="grid gap-4 border-t border-slate-200 py-5 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)_minmax(220px,0.8fr)] md:items-center">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff7a1a]">{department.key}</p>
        <h3 className="mt-2 text-lg font-extrabold text-slate-950">{department.title}</h3>
      </div>
      <p className="text-sm leading-7 text-slate-600">{department.description}</p>
      <div className="flex min-w-0 md:justify-end">
        <a href={`mailto:${department.email}`} className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-[#0069a6] transition hover:border-slate-300 hover:bg-white hover:text-[#004d7a]">
          {department.email}
        </a>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="overflow-x-clip bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9fb]">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-orange-50/90 via-white/40 to-transparent" />
        <div className="relative mx-auto grid max-w-[1520px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.78fr)] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-orange-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" />
              Sales, support, billing, and security routing
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[58px] lg:leading-[1.04]">
              Contact the team that will own the follow-up.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-650 sm:text-lg">
              Send one structured request with the service, department, and context attached. ElevenOrbits routes it to the right team for managed hosting, AI services, VoIP, cybersecurity, billing, or portal support.
            </p>

            <ServiceLogoCluster categorySlugs={contactServiceSlugs} max={8} showLabels className="mt-8 gap-3" />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {contactFacts.map((fact) => (
                <ContactFact key={fact.label} fact={fact} />
              ))}
            </div>
          </div>

          <ContactForm className="relative z-10" />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Direct Routing</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Use the right inbox when the owner is already clear.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The contact form is best for structured intake. Direct email is useful when your team already knows the correct department.
              </p>
            </div>
            <a href={`mailto:${siteConfig.generalEmail}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50">
              General inbox
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {routingCards.map((route) => (
              <RoutingCard key={route.key} route={route} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_36px_110px_-82px_rgba(15,23,42,0.95)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange-300">Portal Access</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Customers get more than an inbox.</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Orders, invoices, wallet activity, saved cards, contracts, tickets, service notes, and credentials belong inside the portal once an account exists.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={getSignupPath()} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#ff7a1a] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#e66a12]">
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href={getLoginPath()} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/15">
                Log in
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {portalActions.map((action) => (
              <Link key={action.title} href={action.href} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_95px_-80px_rgba(15,23,42,0.9)]">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] ring-1 ring-orange-100">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#ff7a1a]" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-slate-950">{action.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
                <span className="mt-5 inline-flex text-sm font-extrabold text-[#0069a6]">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-86px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#ff7a1a]">Department Directory</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">Every inbox has a defined owner.</h2>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <PhoneCall className="h-4 w-4 text-[#ff7a1a]" />
                Email routing is the primary public contact path.
              </div>
            </div>

            <div className="pt-6">
              {siteConfig.departmentContacts.map((department) => (
                <DepartmentRow key={department.key} department={department} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
