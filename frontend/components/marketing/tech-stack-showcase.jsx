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
import { featuredPartnerLogos, techStackGroups, techStackHighlights } from "@/lib/marketing-content";
import { cn } from "@/lib/ui";

const iconMap = {
  brain: BrainCircuit,
  cloud: Cloud,
  headset: Headphones,
  monitor: Monitor,
  phone: PhoneCall,
  shield: ShieldCheck,
};

function LogoMark({ partner, featured = false }) {
  const label = partner.wordmark || partner.name;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-[0_16px_38px_-34px_rgba(15,23,42,0.8)]",
        featured ? "h-16 w-full" : "h-14 w-28",
      )}
    >
      {partner.logo ? (
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          loading="lazy"
          decoding="async"
          className={cn("max-h-8 max-w-full object-contain", featured && "max-h-9")}
        />
      ) : (
        <span className={cn("text-center font-semibold tracking-tight text-slate-950", featured ? "text-base" : "text-sm")}>{label}</span>
      )}
    </div>
  );
}

function PartnerTile({ partner }) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.45)]">
      <LogoMark partner={partner} />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-slate-950">{partner.name}</p>
        {partner.descriptor ? <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{partner.descriptor}</p> : null}
      </div>
    </div>
  );
}

export function TechStackShowcase({ compact = false }) {
  return (
    <section id="tech-stack" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.1),transparent_28%),radial-gradient(circle_at_90%_16%,rgba(255,122,26,0.1),transparent_28%)]" />
      <div className={cn("relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8", compact ? "py-16 lg:py-18" : "py-18 lg:py-20")}>
        <div className="grid gap-10 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Technology Partners</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 md:text-6xl">
              The stack behind managed delivery.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
              ElevenOrbits uses a practical partner ecosystem for security, cloud continuity, endpoint management, service desk operations, AI enablement, and communications.
            </p>

            <div className="mt-7 grid gap-3">
              {techStackHighlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white/82 p-4 shadow-[0_18px_48px_-44px_rgba(15,23,42,0.45)]">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.value}</p>
                </div>
              ))}
            </div>

            {!compact ? null : (
              <Link href="/tech-stack" className="mt-8 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                View full partner stack
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-[0_24px_70px_-56px_rgba(15,23,42,0.5)]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredPartnerLogos.map((partner) => (
                  <div key={partner.name} className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
                    <LogoMark partner={partner} featured />
                    <p className="mt-2 truncate text-center text-xs font-semibold text-slate-500">{partner.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {techStackGroups.map((group) => {
                const Icon = iconMap[group.icon] || CheckCircle2;

                return (
                  <div key={group.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_62px_-54px_rgba(15,23,42,0.55)]">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_16px_36px_-24px_rgba(15,23,42,0.75)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{group.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{group.subtitle}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {group.partners.map((partner) => (
                        <PartnerTile key={`${group.slug}-${partner.name}`} partner={partner} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-5">
          <p className="max-w-3xl text-sm leading-7 text-slate-500">
            Partner availability may evolve over time. The operating standard stays consistent: choose reliable tools, integrate them carefully, and keep accountability with the ElevenOrbits service process.
          </p>
        </div>
      </div>
    </section>
  );
}
