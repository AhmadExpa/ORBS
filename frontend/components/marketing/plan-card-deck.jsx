"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Cpu, HardDrive, Network, ShieldCheck } from "lucide-react";
import { formatCurrency, getPurchasePath } from "@/lib/shared";
import { Button, cn } from "@/lib/ui";
import { ServiceLogo, TechLogoPills, getBrandForName, getCategoryBrand } from "./service-branding";

function planPrice(plan) {
  if (plan.contactSalesOnly) {
    return plan.displayPriceLabel || "Custom";
  }

  return `${formatCurrency(plan.monthlyPrice)}`;
}

function discountLabel(plan) {
  if (Number(plan.yearlyDiscountPercent) > 0) {
    return `${plan.yearlyDiscountPercent}% yearly`;
  }

  return plan.billingCycles?.includes("monthly") ? "Monthly" : "Fixed";
}

function renewalNote(plan) {
  if (plan.contactSalesOnly) {
    return "Scoped by the ElevenOrbits team before launch.";
  }

  if (Number(plan.yearlyPrice) > 0 && plan.billingCycles?.includes("yearly")) {
    return `Yearly billing available at ${formatCurrency(plan.yearlyPrice)}/yr.`;
  }

  return "Renews monthly. Cancel anytime.";
}

function featureIcon(feature) {
  const normalized = String(feature || "").toLowerCase();

  if (/\b(vcpu|core|cpu|gpu)\b/.test(normalized)) {
    return Cpu;
  }
  if (/\b(ram|memory|disk|ssd|nvme|storage|bucket|backup)\b/.test(normalized)) {
    return HardDrive;
  }
  if (/\b(bandwidth|network|domain|cdn|sip|call|rdp)\b/.test(normalized)) {
    return Network;
  }

  return ShieldCheck;
}

function primaryFeatures(plan) {
  const preferred = (plan.features || []).filter((feature) => !/^managed operations coverage$/i.test(feature));
  return preferred.slice(0, 5);
}

function planBrand(plan) {
  const matched = getBrandForName(plan.name);
  return matched.logo ? matched : getCategoryBrand(plan.categorySlug);
}

function PlanCard({ plan, featured = false }) {
  const price = planPrice(plan);
  const features = primaryFeatures(plan);

  return (
    <article
      className={cn(
        "relative flex min-h-[470px] flex-col rounded-[22px] border bg-[#19191c] p-6 text-white shadow-[0_28px_80px_-56px_rgba(2,6,23,0.95)]",
        featured ? "border-violet-500 ring-1 ring-violet-500" : "border-white/10",
      )}
    >
      {featured ? (
        <div className="absolute -left-px -right-px -top-11 rounded-t-[22px] bg-violet-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-tight text-white">
          Most Popular
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-5">
            <ServiceLogo brand={planBrand(plan)} imageClassName="h-9 w-9" className="[&>span:first-child]:h-12 [&>span:first-child]:w-12 [&>span:first-child]:rounded-xl [&>span:first-child]:bg-white" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">{plan.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">{discountLabel(plan)}</span>
      </div>

      <div className="mt-5">
        {plan.yearlyPrice && plan.yearlyPrice > 0 && !plan.contactSalesOnly ? (
          <p className="text-sm font-medium text-slate-500 line-through">{formatCurrency(Math.ceil(plan.yearlyPrice / 12))}</p>
        ) : null}
        <p className="mt-1 text-4xl font-black tracking-tight text-white">
          {price}
          {!plan.contactSalesOnly ? <span className="ml-1 text-base font-semibold text-white">/mo</span> : null}
        </p>
      </div>

      <Link href={getPurchasePath(plan)} className="mt-7 block">
        <Button
          variant={featured ? "ghost" : "outline"}
          className={cn(
            "min-h-12 w-full rounded-lg text-base font-bold",
            featured
              ? "border-white bg-white text-slate-950 hover:bg-slate-100"
              : "border-white/80 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-950",
          )}
        >
          {plan.contactSalesOnly ? "Contact Sales" : "Choose Plan"}
        </Button>
      </Link>

      <p className="mt-4 min-h-10 text-xs font-medium leading-5 text-slate-300">{renewalNote(plan)}</p>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ul className="grid gap-4">
          {features.map((feature) => {
            const Icon = featureIcon(feature);

            return (
              <li key={feature} className="flex items-start gap-3 text-sm font-medium leading-5 text-slate-100">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{feature}</span>
              </li>
            );
          })}
        </ul>
        {plan.techStack?.length ? <TechLogoPills items={plan.techStack} limit={4} className="mt-6 [&_span]:border-white/10 [&_span]:bg-white/[0.06] [&_span]:text-white" /> : null}
      </div>
    </article>
  );
}

function planGroups(categorySlug, categoryName, plans) {
  if (categorySlug !== "vps") {
    return [{ key: categorySlug, title: categoryName || "Plans", description: "Choose the plan that matches the workload.", plans }];
  }

  const windows = plans.filter((plan) => plan.serviceType === "managed_windows_vps" || /windows/i.test(plan.name));
  const linux = plans.filter((plan) => !windows.includes(plan));
  const groups = [];

  if (linux.length) {
    groups.push({
      key: "linux-vps",
      title: "Linux VPS",
      description: "Managed Linux VPS plans for websites, APIs, panels, and application workloads.",
      plans: linux,
    });
  }

  if (windows.length) {
    groups.push({
      key: "windows-vps",
      title: "Windows VPS",
      description: "Managed Windows Server VPS plans with Remote Desktop access and business workload support.",
      plans: windows,
    });
  }

  return groups;
}

function scrollTrack(ref, direction) {
  ref.current?.scrollBy({
    left: direction * Math.min(ref.current.clientWidth, 380),
    behavior: "smooth",
  });
}

function PlanGroup({ group }) {
  const trackRef = useRef(null);
  const carousel = group.plans.length > 3;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">{group.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{group.description}</p>
        </div>
        {carousel ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-label={`Previous ${group.title} plans`}
              onClick={() => scrollTrack(trackRef, -1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-label={`Next ${group.title} plans`}
              onClick={() => scrollTrack(trackRef, 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        className={cn(
          "eo-scrollbar-none",
          carousel
            ? "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
            : "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {group.plans.map((plan, index) => (
          <div key={plan.slug} className={carousel ? "w-[86vw] min-w-[280px] max-w-[380px] snap-start sm:w-[360px] sm:min-w-[360px]" : undefined}>
            <PlanCard plan={plan} featured={index === 1 && group.plans.length > 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlanCardDeck({ categorySlug, categoryName, plans = [], className }) {
  if (!plans.length) {
    return null;
  }

  return (
    <div className={cn("space-y-10", className)}>
      {planGroups(categorySlug, categoryName, plans).map((group) => (
        <PlanGroup key={group.key} group={group} />
      ))}
    </div>
  );
}
