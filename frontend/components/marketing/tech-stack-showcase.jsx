import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Headphones,
  Monitor,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { featuredTechPartners, techStackGroups, techStackHighlights } from "@/lib/marketing-content";
import { cn } from "@/lib/ui";

const iconMap = {
  brain: BrainCircuit,
  cloud: Cloud,
  headset: Headphones,
  monitor: Monitor,
  phone: PhoneCall,
  shield: ShieldCheck,
};

const fallbackTone = {
  blue: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  slate: "border-slate-400/30 bg-slate-400/10 text-slate-100",
  teal: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-100",
};

function PartnerLogo({ partner }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
      {partner.logo ? (
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          loading="lazy"
          decoding="async"
          className={cn("max-h-6 max-w-7 object-contain", partner.invert && "brightness-0 invert")}
        />
      ) : (
        <span
          className={cn(
            "flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-[0.65rem] font-bold tracking-[0.04em]",
            fallbackTone[partner.tone] || "border-orange-400/35 bg-orange-400/10 text-orange-100",
          )}
        >
          {partner.initials}
        </span>
      )}
    </span>
  );
}

export function TechStackShowcase({ compact = false }) {
  return (
    <section id="tech-stack" className="relative overflow-hidden bg-[#04101f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(249,115,22,0.22),transparent_28%),linear-gradient(135deg,#020617_0%,#061a2f_46%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,rgba(14,165,233,0.08))]" />
      <div className="relative mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300">Tech Stack</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.96] tracking-tight md:text-6xl">
              Proven partners.
              <span className="block text-orange-300">Integrated delivery.</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              A curated ecosystem powers cybersecurity, cloud continuity, endpoint management, helpdesk operations, AI enablement, and business communications.
            </p>
            <div className="mt-7 grid gap-3">
              {techStackHighlights.map((item) => (
                <div key={item.label} className="border-l border-orange-300/70 pl-4">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.value}</p>
                </div>
              ))}
            </div>
            {!compact ? null : (
              <Link href="/tech-stack" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white">
                View full stack
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
            {techStackGroups.map((group) => {
              const Icon = iconMap[group.icon] || CheckCircle2;

              return (
                <div key={group.slug} className="bg-[#061426]/92 p-5">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{group.title}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{group.subtitle}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {group.partners.map((partner) => (
                      <div key={`${group.slug}-${partner.name}`} className="flex min-h-12 items-center gap-3">
                        <PartnerLogo partner={partner} />
                        <p className="text-sm font-medium leading-5 text-slate-100">{partner.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Partners may evolve as the market changes. The operating principle does not: use reliable tools, integrate them carefully, and keep service quality accountable.
          </p>
          <div className="flex flex-wrap gap-2">
            {featuredTechPartners.map((partner) => (
              <span key={partner} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
