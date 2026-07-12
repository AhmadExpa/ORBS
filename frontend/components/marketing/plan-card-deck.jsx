"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Cpu, HardDrive, Network, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { formatCurrency, getAvailableBillingCycles, getBillingCycleDiscountPercent, getPurchasePath } from "@/lib/shared";
import { cn } from "@/lib/ui";
import { ServiceLogo, TechLogoPills, getBrandForName, getCategoryBrand } from "./service-branding";

const CARDS_PER_PAGE = 3;

function planPrice(plan) {
  if (plan.contactSalesOnly) return plan.displayPriceLabel || "Custom";
  return `${formatCurrency(plan.monthlyPrice)}`;
}

function discountLabel(plan) {
  if (plan.contactSalesOnly) return "Scoped";
  const cycles = getAvailableBillingCycles(plan);
  if (cycles.includes("six_month") && cycles.includes("yearly")) {
    return `${getBillingCycleDiscountPercent(plan, "six_month")}% / ${getBillingCycleDiscountPercent(plan, "yearly")}% terms`;
  }
  return cycles.includes("monthly") ? "Monthly" : "Fixed";
}

function renewalNote(plan) {
  if (plan.contactSalesOnly) return "Scoped by the ElevenOrbits team before launch.";
  const cycles = getAvailableBillingCycles(plan);
  if (cycles.includes("six_month") && cycles.includes("yearly")) {
    return `Monthly, 6-month, and yearly contracts available. Yearly saves ${getBillingCycleDiscountPercent(plan, "yearly")}%.`;
  }
  return "Renews monthly. Cancel anytime.";
}

function featureIcon(feature) {
  const n = String(feature || "").toLowerCase();
  if (/\b(vcpu|core|cpu|gpu)\b/.test(n)) return Cpu;
  if (/\b(ram|memory|disk|ssd|nvme|storage|bucket|backup)\b/.test(n)) return HardDrive;
  if (/\b(bandwidth|network|domain|cdn|sip|call|rdp)\b/.test(n)) return Network;
  return ShieldCheck;
}

function primaryFeatures(plan) {
  return (plan.features || [])
    .filter((f) => !/^managed operations coverage$/i.test(f))
    .slice(0, 5);
}

function planBrand(plan) {
  const name = String(plan.name || "").toLowerCase();
  const serviceType = String(plan.serviceType || "").toLowerCase();

  if (/windows/.test(name) || serviceType === "managed_windows_vps") {
    return { name: "Windows", logo: "/partners/microsoft.svg" };
  }
  if (/linux|ubuntu|almalinux|debian/.test(name) || serviceType === "managed_linux_vps") {
    return { name: "Linux", logo: "/partners/ubuntu.svg" };
  }
  if (["vps", "vds"].includes(plan.categorySlug)) {
    return { name: "Linux", logo: "/partners/ubuntu.svg" };
  }

  const matched = getBrandForName(plan.name);
  return matched.logo ? matched : getCategoryBrand(plan.categorySlug);
}

function PlanCard({ plan, featured = false }) {
  const price = planPrice(plan);
  const features = primaryFeatures(plan);
  const brand = planBrand(plan);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300",
        featured
          ? "border-violet-500/60 bg-gradient-to-b from-[#1a1040] to-[#19191c] shadow-[0_0_60px_-12px_rgba(139,92,246,0.5)] ring-1 ring-violet-500/40"
          : "border-white/10 bg-[#19191c] hover:border-white/20 hover:shadow-[0_24px_60px_-20px_rgba(2,6,23,0.8)]",
      )}
    >
      {featured ? (
        <div className="-mx-6 -mt-6 mb-5 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 px-4 py-2.5">
          <Sparkles className="h-3.5 w-3.5 text-white/90" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Most Popular</span>
          <Sparkles className="h-3.5 w-3.5 text-white/90" />
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <ServiceLogo
          brand={brand}
          imageClassName="h-8 w-8"
          className="[&>span:first-child]:h-12 [&>span:first-child]:w-12 [&>span:first-child]:rounded-xl [&>span:first-child]:bg-white/10"
        />
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            featured ? "bg-violet-500/20 text-violet-300" : "bg-amber-400/10 text-amber-400",
          )}
        >
          {discountLabel(plan)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold tracking-tight text-white">{plan.name}</h3>

      {/* Price */}
      <div className="mt-4">
        {plan.yearlyPrice && plan.yearlyPrice > 0 && !plan.contactSalesOnly ? (
          <p className="text-xs font-medium text-white/30 line-through">
            {formatCurrency(Math.ceil(plan.yearlyPrice / 12))}/mo
          </p>
        ) : null}
        <p className="text-4xl font-black tracking-tight text-white">
          {price}
          {!plan.contactSalesOnly ? (
            <span className="ml-1 text-base font-semibold text-white/50">/mo</span>
          ) : null}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={getPurchasePath(plan)}
        className={cn(
          "mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          featured
            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-purple-400"
            : "border border-white/20 bg-white/[0.06] text-white hover:border-white/40 hover:bg-white/10",
        )}
      >
        <Zap className="h-4 w-4" />
        {plan.contactSalesOnly ? "Contact Sales" : "Choose Plan"}
      </Link>

      <p className="mt-3 text-xs leading-5 text-white/40">{renewalNote(plan)}</p>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <ul className="grid flex-1 gap-3">
        {features.map((feature) => {
          const Icon = featureIcon(feature);
          return (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                <Check className="h-3 w-3 text-emerald-400" />
              </span>
              <span className="leading-5">{feature}</span>
            </li>
          );
        })}
      </ul>

      {plan.techStack?.length ? (
        <TechLogoPills
          items={plan.techStack}
          limit={4}
          className="mt-5 [&_span]:border-white/10 [&_span]:bg-white/[0.06] [&_span]:text-white/60"
        />
      ) : null}
    </article>
  );
}

function planGroups(categorySlug, categoryName, plans) {
  if (categorySlug !== "vps") {
    return [{ key: categorySlug, title: categoryName || "Plans", description: "Choose the plan that matches the workload.", plans }];
  }

  const windows = plans.filter((p) => p.serviceType === "managed_windows_vps" || /windows/i.test(p.name));
  const linux = plans.filter((p) => !windows.includes(p));
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

function featuredIndex(plans) {
  if (plans.length <= 2) return -1;
  return 1;
}

function PlanGroup({ group }) {
  const [page, setPage] = useState(0);
  const total = group.plans.length;
  const totalPages = Math.ceil(total / CARDS_PER_PAGE);
  const fi = featuredIndex(group.plans);

  const visiblePlans = group.plans.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <section className="space-y-6">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">{group.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{group.description}</p>
        </div>

        {totalPages > 1 ? (
          <div className="flex shrink-0 items-center gap-3">
            {/* Page dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === page
                      ? "h-2 w-6 bg-slate-950"
                      : "h-2 w-2 bg-slate-300 hover:bg-slate-400",
                  )}
                />
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous plans"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                  canPrev
                    ? "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                    : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next plans"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                  canNext
                    ? "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                    : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Card grid — always 3 columns, slides by page */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePlans.map((plan, localIndex) => {
          const globalIndex = page * CARDS_PER_PAGE + localIndex;
          return (
            <PlanCard
              key={plan.slug}
              plan={plan}
              featured={globalIndex === fi}
            />
          );
        })}
        {/* Ghost columns to keep 3-col grid stable when last page has < 3 */}
        {visiblePlans.length < CARDS_PER_PAGE
          ? Array.from({ length: CARDS_PER_PAGE - visiblePlans.length }).map((_, i) => (
              <div key={`ghost-${i}`} aria-hidden="true" />
            ))
          : null}
      </div>

      {/* Plan counter */}
      {totalPages > 1 ? (
        <p className="text-center text-xs text-slate-400">
          Showing {page * CARDS_PER_PAGE + 1}–{Math.min(page * CARDS_PER_PAGE + CARDS_PER_PAGE, total)} of {total} plans
        </p>
      ) : null}
    </section>
  );
}

export function PlanCardDeck({ categorySlug, categoryName, plans = [], className }) {
  if (!plans.length) return null;

  return (
    <div className={cn("space-y-16", className)}>
      {planGroups(categorySlug, categoryName, plans).map((group) => (
        <PlanGroup key={group.key} group={group} />
      ))}
    </div>
  );
}
