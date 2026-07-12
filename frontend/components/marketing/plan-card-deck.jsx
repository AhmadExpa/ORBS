"use client";

import Link from "next/link";
import { Check, Cpu, HardDrive, Network, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { formatCurrency, getAvailableBillingCycles, getBillingCycleDiscountPercent, getPurchasePath } from "@/lib/shared";
import { cn } from "@/lib/ui";
import { ServiceLogo, TechLogoPills, getBrandForName, getCategoryBrand } from "./service-branding";

function planPrice(plan) {
  if (plan.contactSalesOnly) {
    return plan.displayPriceLabel || "Custom";
  }
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
  const matched = getBrandForName(plan.name);
  return matched.logo ? matched : getCategoryBrand(plan.categorySlug);
}

// Responsive column count based on plan count
function gridCols(count) {
  if (count === 1) return "max-w-sm mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  if (count === 5) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6";
}

function PlanCard({ plan, featured = false, totalCount = 1 }) {
  const price = planPrice(plan);
  const features = primaryFeatures(plan);
  const brand = planBrand(plan);

  // For large grids (5+ plans), use a more compact card
  const compact = totalCount >= 5;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300",
        featured
          ? "border-violet-500/60 bg-gradient-to-b from-[#1a1040] to-[#19191c] shadow-[0_0_60px_-12px_rgba(139,92,246,0.5)] ring-1 ring-violet-500/40 scale-[1.02] z-10"
          : "border-white/10 bg-[#19191c] hover:border-white/20 hover:shadow-[0_24px_60px_-20px_rgba(2,6,23,0.8)]",
        compact ? "p-5" : "p-6",
      )}
    >
      {/* Featured ribbon */}
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
          imageClassName={compact ? "h-7 w-7" : "h-8 w-8"}
          className={cn(
            "[&>span:first-child]:rounded-xl [&>span:first-child]:bg-white/10",
            compact ? "[&>span:first-child]:h-10 [&>span:first-child]:w-10" : "[&>span:first-child]:h-12 [&>span:first-child]:w-12",
          )}
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

      {/* Plan name */}
      <h3
        className={cn(
          "mt-4 font-bold tracking-tight text-white",
          compact ? "text-base" : "text-lg",
        )}
      >
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mt-4">
        {plan.yearlyPrice && plan.yearlyPrice > 0 && !plan.contactSalesOnly ? (
          <p className="text-xs font-medium text-white/30 line-through">
            {formatCurrency(Math.ceil(plan.yearlyPrice / 12))}/mo
          </p>
        ) : null}
        <p className={cn("font-black tracking-tight text-white", compact ? "text-3xl" : "text-4xl")}>
          {price}
          {!plan.contactSalesOnly ? (
            <span className={cn("font-semibold text-white/50", compact ? "text-sm ml-1" : "text-base ml-1")}>/mo</span>
          ) : null}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={getPurchasePath(plan)}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          compact ? "min-h-10 px-3 py-2.5 text-sm" : "min-h-12 px-4 py-3 text-base",
          featured
            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-purple-400"
            : "border border-white/20 bg-white/[0.06] text-white hover:border-white/40 hover:bg-white/10",
        )}
      >
        <Zap className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {plan.contactSalesOnly ? "Contact Sales" : "Choose Plan"}
      </Link>

      {/* Renewal note */}
      <p className={cn("mt-3 leading-5 text-white/40", compact ? "text-[10px]" : "text-xs")}>
        {renewalNote(plan)}
      </p>

      {/* Divider */}
      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Features */}
      <ul className="grid gap-3 flex-1">
        {features.map((feature) => {
          const Icon = featureIcon(feature);
          return (
            <li key={feature} className={cn("flex items-start gap-2.5 text-white/75", compact ? "text-xs" : "text-sm")}>
              <span className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-md bg-white/[0.06]", compact ? "h-4 w-4" : "h-5 w-5")}>
                <Check className={compact ? "h-2.5 w-2.5 text-emerald-400" : "h-3 w-3 text-emerald-400"} />
              </span>
              <span className="leading-5">{feature}</span>
            </li>
          );
        })}
      </ul>

      {/* Tech pills */}
      {plan.techStack?.length ? (
        <TechLogoPills
          items={plan.techStack}
          limit={compact ? 3 : 4}
          className="mt-5 [&_span]:border-white/10 [&_span]:bg-white/[0.06] [&_span]:text-white/60"
        />
      ) : null}

      {/* Subtle hover glow */}
      {!featured ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-b from-white/[0.03] to-transparent" />
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
  // Prefer the 2nd plan when there are 3+, otherwise the middle
  if (plans.length <= 1) return -1;
  if (plans.length === 2) return -1;
  if (plans.length === 3) return 1;
  // For larger grids, pick the second plan (index 1)
  return 1;
}

function PlanGroup({ group }) {
  const count = group.plans.length;
  const fi = featuredIndex(group.plans);

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold tracking-tight text-slate-950">{group.title}</h3>
        <p className="mt-3 text-base leading-7 text-slate-500">{group.description}</p>
      </div>

      {/* Plans grid — always a grid, never a carousel */}
      <div
        className={cn(
          "grid w-full gap-4",
          // Single plan — center it
          count === 1 && "max-w-sm mx-auto",
          // Two plans
          count === 2 && "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto",
          // Three plans — classic 3-col
          count === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          // Four plans
          count === 4 && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
          // Five plans
          count === 5 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
          // Six or more — wrap to 3-col with smaller cards
          count >= 6 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {group.plans.map((plan, index) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            featured={index === fi}
            totalCount={count}
          />
        ))}
      </div>

      {/* Bottom hint for large plan counts */}
      {count >= 4 ? (
        <p className="text-center text-sm text-slate-400">
          All plans include managed operations, provisioning handoff, and support coverage.
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
