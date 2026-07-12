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
import { techStackGroups, techStackHighlights } from "@/lib/marketing-content";
import { cn } from "@/lib/ui";
import { getBrandForName } from "./service-branding";

const iconMap = {
  brain: BrainCircuit,
  cloud: Cloud,
  headset: Headphones,
  monitor: Monitor,
  phone: PhoneCall,
  shield: ShieldCheck,
};

const compactGroupSlugs = new Set(["cybersecurity", "cloud-continuity", "ai-enablement", "ucaas"]);

const stackMetrics = [
  { label: "Operating lanes", value: "6" },
  { label: "Core partners", value: "30+" },
  { label: "Service model", value: "Owned" },
];

const operatingModel = [
  "Select proven platforms for each service lane.",
  "Connect tools into provisioning, tickets, billing, renewals, and custom workflows.",
  "Keep accountability with ElevenOrbits while the partner mix evolves.",
];

function LogoMark({ partner }) {
  const label = partner.wordmark || partner.name;
  const brand = partner.logo ? { name: partner.name, logo: partner.logo } : getBrandForName(label);
  const logo = partner.logo || brand.logo;

  return (
    <div className="flex h-full w-full shrink-0 items-center justify-center px-4">
      {logo ? (
        <img src={logo} alt={`${label} logo`} loading="lazy" decoding="async" className="max-h-10 max-w-full object-contain" />
      ) : (
        <span className="max-w-full truncate text-center text-sm font-semibold text-slate-700">{label}</span>
      )}
    </div>
  );
}

function CarouselPartnerCard({ partner }) {
  return (
    <article
      aria-label={partner.name}
      className="flex h-16 w-40 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_38px_-34px_rgba(15,23,42,0.55)]"
    >
      <LogoMark partner={partner} />
    </article>
  );
}

function CarouselLane({ group, index, compact = false }) {
  const Icon = iconMap[group.icon] || CheckCircle2;
  const lanePartners = group.partners.length < 4 ? [...group.partners, ...group.partners] : group.partners;
  const duration = compact ? 24 + index * 3 : 30 + group.partners.length * 2 + index * 2;

  return (
    <div id={group.slug} className="min-w-0 scroll-mt-28 border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-[0_16px_36px_-24px_rgba(15,23,42,0.75)]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{group.title}</p>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">{group.subtitle}</p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
          {group.partners.length} integrations
        </span>
      </div>

      <div className="tech-stack-marquee max-w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 shadow-[0_22px_60px_-54px_rgba(15,23,42,0.55)]">
        <div
          className="tech-stack-marquee-track"
          style={{
            "--marquee-duration": `${duration}s`,
            "--marquee-direction": index % 2 === 0 ? "normal" : "reverse",
          }}
        >
          {[0, 1].map((setIndex) => (
            <div className="tech-stack-marquee-set" aria-hidden={setIndex === 1 ? "true" : undefined} key={`${group.slug}-${setIndex}`}>
              {lanePartners.map((partner, partnerIndex) => (
                <CarouselPartnerCard key={`${group.slug}-${setIndex}-${partner.name}-${partnerIndex}`} partner={partner} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TechStackShowcase({ compact = false }) {
  const visibleGroups = compact ? techStackGroups.filter((group) => compactGroupSlugs.has(group.slug)) : techStackGroups;

  return (
    <section id="tech-stack" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 eo-media-grid opacity-45" />
      <div className={cn("relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8", compact ? "py-14 lg:py-16" : "py-16 lg:py-20")}>
        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)]",
            compact
              ? "gap-6 lg:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)] lg:items-start"
              : "gap-10 lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)] lg:items-stretch",
          )}
        >
          <div
            className={cn(
              "eo-reveal-up min-w-0",
              compact
                ? "rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_22px_70px_-58px_rgba(15,23,42,0.7)]"
                : "flex h-full flex-col border-y border-slate-200 py-7 lg:min-h-[760px] lg:py-8",
            )}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Technology Partners</p>
              <h2 className={cn("mt-5 max-w-3xl font-semibold leading-[1.02] tracking-tight text-slate-950", compact ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl")}>
                The stack behind managed delivery.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                ElevenOrbits uses a practical partner ecosystem for security, cloud continuity, endpoint management, service desk operations, custom AI enablement, and communications.
              </p>
            </div>

            <div className={cn("grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_48px_-44px_rgba(15,23,42,0.45)]", compact ? "mt-6" : "mt-8")}>
              {stackMetrics.map((metric) => (
                <div key={metric.label} className={cn("border-r border-slate-200 last:border-r-0", compact ? "px-3 py-4" : "px-4 py-5")}>
                  <p className={cn("font-semibold tracking-tight text-slate-950", compact ? "text-xl" : "text-2xl")}>{metric.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className={cn("grid", compact ? "mt-6 gap-3" : "mt-7 gap-4")}>
              {techStackHighlights.map((item) => (
                <div key={item.label} className={cn("border-t border-slate-200", compact ? "pt-3" : "pt-4")}>
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.value}</p>
                </div>
              ))}
            </div>

            {!compact ? (
              <div className="mt-7 rounded-lg bg-slate-950 p-5 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.72)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Operating model</p>
                <p className="mt-3 text-xl font-semibold tracking-tight">Partners are selected for delivery, not decoration.</p>
                <div className="mt-5 grid gap-3">
                  {operatingModel.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={compact ? "mt-6" : "mt-auto pt-8"}>
              <div className="border-t border-slate-200 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Coverage map</p>
                <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "mt-4")}>
                  {techStackGroups.map((group) => (
                    <span key={group.slug} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {group.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cn("flex flex-wrap gap-3", compact ? "mt-5" : "mt-7")}>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Explore services
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-slate-400">
                  Talk to us
                </Link>
              </div>

              {compact ? (
                <Link href="/tech-stack" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
                  View full partner stack
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
                  Partner availability may evolve over time. The operating standard stays consistent: choose reliable tools, integrate them carefully, and keep accountability with the ElevenOrbits service process.
                </p>
              )}
            </div>
          </div>

          <div className={cn("grid min-w-0 content-start", compact ? "gap-4" : "gap-7")}>
            {visibleGroups.map((group, index) => (
              <div key={group.slug} className="eo-reveal-soft" style={{ "--eo-delay": `${Math.min(index * 55, 260)}ms` }}>
                <CarouselLane group={group} index={index} compact={compact} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
