"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Cpu, Phone, Server, Shield, Sparkles } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { Topbar } from "@/components/shared/topbar";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";

const SERVER_CATEGORY_SLUGS = new Set(["vps", "vds"]);
const AI_CATEGORY_SLUGS = new Set(["ai-servers", "workflows", "ai-solutions"]);
const OPERATIONS_CATEGORY_SLUGS = new Set(["vicidial", "development-support"]);
const SECURITY_CATEGORY_SLUGS = new Set(["cybersecurity"]);

function getCategorySlug(subscription) {
  return subscription?.productPlanId?.categoryId?.slug || "";
}

function getCategoryName(subscription) {
  return subscription?.productPlanId?.categoryId?.name || "Managed Service";
}

function hasAssignedCredentials(subscription) {
  const access = subscription?.serviceAccess || {};
  return Boolean(access.username || access.password || access.ipAddress);
}

function getCurrentSubscriptions(subscriptions) {
  return subscriptions.filter((subscription) => !["cancelled", "expired"].includes(subscription.status));
}

function getServiceSection(subscription) {
  const slug = getCategorySlug(subscription);

  if (SERVER_CATEGORY_SLUGS.has(slug)) {
    return "servers";
  }

  if (AI_CATEGORY_SLUGS.has(slug)) {
    return "ai";
  }

  if (OPERATIONS_CATEGORY_SLUGS.has(slug)) {
    return "operations";
  }

  if (SECURITY_CATEGORY_SLUGS.has(slug)) {
    return "security";
  }

  return "general";
}

function getSectionBreakdown(subscriptions) {
  return [
    { id: "servers", label: "Servers", count: subscriptions.filter((item) => getServiceSection(item) === "servers").length },
    { id: "ai", label: "AI & Automation", count: subscriptions.filter((item) => getServiceSection(item) === "ai").length },
    { id: "operations", label: "Operations", count: subscriptions.filter((item) => getServiceSection(item) === "operations").length },
    { id: "security", label: "Security", count: subscriptions.filter((item) => getServiceSection(item) === "security").length },
  ].filter((item) => item.count);
}

function getTechHighlights(subscription, limit = 4) {
  return (subscription?.productPlanId?.techStack || []).slice(0, limit);
}

function getSharedDetails(subscription, limit = 4) {
  return (subscription?.sharedDetails || []).filter((item) => item.label && item.value).slice(0, limit);
}

function getSharedDetailValue(subscription, patterns) {
  const normalizedPatterns = patterns.map((item) => item.toLowerCase());
  const detail = (subscription?.sharedDetails || []).find((item) => {
    const label = String(item?.label || "").toLowerCase();
    return normalizedPatterns.some((pattern) => label.includes(pattern));
  });

  return detail?.value || "";
}

function getServerUsageType(subscription) {
  return (
    getSharedDetailValue(subscription, ["usage", "purpose", "server type", "workload"]) ||
    getCategoryName(subscription)
  );
}

function formatRenewalText(subscription) {
  return subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : "Pending activation";
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getRecommendation(planPool, currentSubscriptions) {
  if (!planPool.length) {
    return null;
  }

  const ownedSlugs = new Set(currentSubscriptions.map((subscription) => subscription?.productPlanId?.slug).filter(Boolean));
  const candidates = planPool.filter((plan) => !ownedSlugs.has(plan.slug));
  const source = candidates.length ? candidates : planPool;
  const seed = [
    ...currentSubscriptions.map((subscription) => subscription._id),
    ...source.map((plan) => plan.slug),
  ].join("|");

  return source[hashString(seed) % source.length];
}

function getRecommendationHref(plan) {
  if (!plan) {
    return "/services";
  }

  if (plan.contactSalesOnly) {
    return plan.categoryId?.slug ? `/services/${plan.categoryId.slug}` : "/services";
  }

  return `/portal/order/${plan.slug}`;
}

function getRecommendationLabel(plan) {
  if (!plan) {
    return "Browse Services";
  }

  return plan.contactSalesOnly ? "Contact Sales" : "Configure Service";
}

function SummaryCard({ subscriptions }) {
  const breakdown = getSectionBreakdown(subscriptions);
  const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;

  return (
    <Card className="overflow-hidden border-slate-900">
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Current Services</p>
            <CardTitle className="mt-3 text-2xl text-white">What you are actively running</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-slate-300">
              Your portal now separates current services by how they are used, so servers, automation, support, and security do not all look the same.
            </CardDescription>
          </div>
          <Sparkles className="h-8 w-8 shrink-0 text-sky-300" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-slate-950 p-6 text-white">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Services</p>
            <p className="mt-2 text-3xl font-semibold">{subscriptions.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active Now</p>
            <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Needs Follow-Up</p>
            <p className="mt-2 text-3xl font-semibold">{subscriptions.length - activeCount}</p>
          </div>
        </div>

        {breakdown.length ? (
          <div className="flex flex-wrap gap-3">
            {breakdown.map((item) => (
              <div key={item.id} className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200">
                {item.label}: <span className="font-semibold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        ) : null}

        {subscriptions.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {subscriptions.slice(0, 4).map((subscription) => (
              <div key={subscription._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{subscription.productPlanId?.name || "Managed Service"}</p>
                    <p className="mt-1 text-sm text-slate-400">{getCategoryName(subscription)}</p>
                  </div>
                  <StatusBadge status={subscription.status} />
                </div>
                <p className="mt-4 text-sm text-slate-300">Renewal: {formatRenewalText(subscription)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Your active services will appear here once a subscription is approved and provisioned.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation, isLoading }) {
  const priceLabel = recommendation
    ? recommendation.contactSalesOnly
      ? recommendation.displayPriceLabel
      : `${formatCurrency(recommendation.monthlyPrice)} / month`
    : "";

  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Random Recommendation</p>
        <CardTitle className="mt-3">A fresh service to consider</CardTitle>
        <CardDescription>
          One rotating suggestion from the service catalog, excluding plans you already use when possible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Selecting a recommendation...</p>
        ) : recommendation ? (
          <>
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">{recommendation.categoryId?.name || "Service"}</p>
              <p className="mt-3 text-xl font-semibold text-slate-950">{recommendation.name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(recommendation.techStack || []).slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Starting Price</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{priceLabel}</p>
                </div>
                <Link href={getRecommendationHref(recommendation)}>
                  <Button className="gap-2">
                    {getRecommendationLabel(recommendation)}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No recommendation is available right now.</p>
        )}
      </CardContent>
    </Card>
  );
}

function BrowseMoreCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Browse More Services</CardTitle>
        <CardDescription>Open the catalog when you want to add another VPS, VDS, AI service, support plan, or security package.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <p>Use the catalog to compare plans, pricing, and delivery models before placing the next order.</p>
        <Link href="/services">
          <Button>Browse More Services</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ToolsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
        <CardDescription>Jump from services into the billing and support actions you use most.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/portal/subscriptions">
          <Button className="w-full justify-center" variant="ghost">
            Subscriptions
          </Button>
        </Link>
        <Link href="/portal/payments">
          <Button className="w-full justify-center" variant="ghost">
            Wallet & Payments
          </Button>
        </Link>
        <Link href="/portal/invoices">
          <Button className="w-full justify-center" variant="ghost">
            Invoices
          </Button>
        </Link>
        <Link href="/portal/support">
          <Button className="w-full justify-center" variant="ghost">
            Support
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ServerUsageSection({ subscriptions }) {
  return (
    <Card className="overflow-hidden border-slate-900">
      <CardHeader className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="flex items-start gap-3">
          <Server className="mt-1 h-6 w-6 text-sky-300" />
          <div>
            <CardTitle className="text-white">Server Usage</CardTitle>
            <CardDescription className="text-slate-300">
              VPS and VDS subscriptions are shown as deployment units with access, usage type, and renewal timing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 bg-slate-950 p-6 lg:grid-cols-2">
        {subscriptions.map((subscription) => {
          const access = subscription.serviceAccess || {};
          const credentialsReady = hasAssignedCredentials(subscription);
          const detailBadges = getSharedDetails(subscription, 3);

          return (
            <div key={subscription._id} className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-5 text-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Server Usage Type</p>
                  <p className="mt-2 text-xl font-semibold">{getServerUsageType(subscription)}</p>
                  <p className="mt-1 text-sm text-slate-400">{subscription.productPlanId?.name || "Managed Server"}</p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Access</p>
                  <p className="mt-2 font-semibold">{credentialsReady ? "Credentials assigned" : "Pending assignment"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">IP Address</p>
                  <p className="mt-2 font-semibold">{access.ipAddress || "Waiting for provisioning"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Billing Cycle</p>
                  <p className="mt-2 font-semibold capitalize">{subscription.billingCycle}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Renewal</p>
                  <p className="mt-2 font-semibold">{formatRenewalText(subscription)}</p>
                </div>
              </div>

              {detailBadges.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {detailBadges.map((detail) => (
                    <span key={`${detail.label}-${detail.value}`} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                      {detail.label}: {detail.value}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">{getCategoryName(subscription)}</p>
                <Link href={`/portal/services/${subscription._id}`}>
                  <Button variant="ghost">Open Server</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AiAutomationSection({ subscriptions }) {
  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="bg-gradient-to-r from-sky-50 via-white to-emerald-50">
        <div className="flex items-start gap-3">
          <Cpu className="mt-1 h-6 w-6 text-sky-700" />
          <div>
            <CardTitle>AI & Automation Workloads</CardTitle>
            <CardDescription>
              AI servers, workflow automation, and AI solution subscriptions are shown as workload lanes with stack and delivery focus.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
        {subscriptions.map((subscription) => {
          const stack = getTechHighlights(subscription, 4);
          const details = getSharedDetails(subscription, 3);

          return (
            <div key={subscription._id} className="rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Workload Lane</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{subscription.productPlanId?.name || "AI Service"}</p>
                  <p className="mt-1 text-sm text-slate-500">{getCategoryName(subscription)}</p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-5 rounded-3xl border border-sky-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Primary Stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stack.length ? (
                    stack.map((item) => (
                      <span key={item} className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Stack details will appear after provisioning.</span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Delivery Model</p>
                  <p className="mt-2 font-semibold text-slate-950">{subscription.productPlanId?.planType || "standard"}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Renewal</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatRenewalText(subscription)}</p>
                </div>
              </div>

              {details.length ? (
                <div className="mt-4 space-y-2">
                  {details.map((detail) => (
                    <div key={`${detail.label}-${detail.value}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm">
                      <span className="text-slate-500">{detail.label}</span>
                      <span className="font-semibold text-slate-950">{detail.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <Link href={`/portal/services/${subscription._id}`}>
                  <Button variant="ghost">Open Workload</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function OperationsSection({ subscriptions }) {
  return (
    <Card className="overflow-hidden border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-50 via-white to-orange-50">
        <div className="flex items-start gap-3">
          <Phone className="mt-1 h-6 w-6 text-amber-700" />
          <div>
            <CardTitle>Operations & Support Coverage</CardTitle>
            <CardDescription>
              Vicidial and support subscriptions are shown as service coverage cards with coordination focus and handoff details.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
        {subscriptions.map((subscription) => {
          const details = getSharedDetails(subscription, 3);

          return (
            <div key={subscription._id} className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Coverage Focus</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{subscription.productPlanId?.name || "Operations Service"}</p>
                  <p className="mt-1 text-sm text-slate-500">{getCategoryName(subscription)}</p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Included Stack</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {getTechHighlights(subscription, 4).join(", ") || "Operational stack details will appear here."}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-amber-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Billing Cycle</p>
                  <p className="mt-2 font-semibold text-slate-950 capitalize">{subscription.billingCycle}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Renewal</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatRenewalText(subscription)}</p>
                </div>
              </div>

              {details.length ? (
                <div className="mt-4 space-y-2">
                  {details.map((detail) => (
                    <div key={`${detail.label}-${detail.value}`} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">{detail.label}:</span> {detail.value}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <Link href={`/portal/services/${subscription._id}`}>
                  <Button variant="ghost">Open Service Coverage</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SecuritySection({ subscriptions }) {
  return (
    <Card className="overflow-hidden border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 via-white to-teal-50">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 h-6 w-6 text-emerald-700" />
          <div>
            <CardTitle>Security Posture</CardTitle>
            <CardDescription>
              Security subscriptions are shown as protection scopes with stack highlights and customer-facing notes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
        {subscriptions.map((subscription) => {
          const stack = getTechHighlights(subscription, 4);
          const details = getSharedDetails(subscription, 3);

          return (
            <div key={subscription._id} className="rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Protection Scope</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{subscription.productPlanId?.name || "Security Service"}</p>
                  <p className="mt-1 text-sm text-slate-500">{getCategoryName(subscription)}</p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span key={item} className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-emerald-800">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Cycle</p>
                  <p className="mt-2 font-semibold text-slate-950 capitalize">{subscription.billingCycle}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Renewal</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatRenewalText(subscription)}</p>
                </div>
              </div>

              {details.length ? (
                <div className="mt-4 space-y-2">
                  {details.map((detail) => (
                    <div key={`${detail.label}-${detail.value}`} className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-sm">
                      <span className="text-slate-500">{detail.label}</span>
                      <span className="font-semibold text-slate-950">{detail.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <Link href={`/portal/services/${subscription._id}`}>
                  <Button variant="ghost">Open Security Plan</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function GeneralServicesSection({ subscriptions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other Services</CardTitle>
        <CardDescription>Additional subscriptions that do not fall into the main service groups still stay visible here.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {subscriptions.map((subscription) => (
          <div key={subscription._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-slate-950">{subscription.productPlanId?.name || "Managed Service"}</p>
                <p className="mt-1 text-sm text-slate-500">{getCategoryName(subscription)}</p>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {getSharedDetails(subscription, 3).map((detail) => (
                <p key={`${detail.label}-${detail.value}`}>
                  <span className="font-semibold text-slate-950">{detail.label}:</span> {detail.value}
                </p>
              ))}
              <p>Renewal: {formatRenewalText(subscription)}</p>
            </div>
            <div className="mt-5">
              <Link href={`/portal/services/${subscription._id}`}>
                <Button variant="ghost">Open Service</Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function PortalServicesPage() {
  const subscriptionsQuery = useCustomerQuery({
    queryKey: ["portal-services"],
    path: "/subscriptions",
  });
  const catalogQuery = useQuery({
    queryKey: ["portal-service-recommendation"],
    queryFn: () => apiFetch("/catalog/plans"),
  });

  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const currentSubscriptions = getCurrentSubscriptions(subscriptions);
  const recommendation = getRecommendation(catalogQuery.data?.plans || [], currentSubscriptions);

  const serverSubscriptions = currentSubscriptions.filter((subscription) => getServiceSection(subscription) === "servers");
  const aiSubscriptions = currentSubscriptions.filter((subscription) => getServiceSection(subscription) === "ai");
  const operationsSubscriptions = currentSubscriptions.filter((subscription) => getServiceSection(subscription) === "operations");
  const securitySubscriptions = currentSubscriptions.filter((subscription) => getServiceSection(subscription) === "security");
  const generalSubscriptions = currentSubscriptions.filter((subscription) => getServiceSection(subscription) === "general");

  return (
    <div>
      <Topbar
        title="Services"
        subtitle="See the services you are currently using, get one random recommendation, and jump into the wider catalog when you need more."
        actions={
          <Link href="/services">
            <Button>Browse More Services</Button>
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SummaryCard subscriptions={currentSubscriptions} />
          <div className="space-y-6">
            <RecommendationCard recommendation={recommendation} isLoading={catalogQuery.isLoading} />
            <BrowseMoreCard />
            <ToolsCard />
          </div>
        </div>

        {!currentSubscriptions.length && !subscriptionsQuery.isLoading ? (
          <Card>
            <CardContent className="p-8">
              <EmptyState
                title="No current services yet"
                description="Once your subscriptions are active, they will appear here in service-specific sections."
              />
            </CardContent>
          </Card>
        ) : null}

        {serverSubscriptions.length ? <ServerUsageSection subscriptions={serverSubscriptions} /> : null}
        {aiSubscriptions.length ? <AiAutomationSection subscriptions={aiSubscriptions} /> : null}
        {operationsSubscriptions.length ? <OperationsSection subscriptions={operationsSubscriptions} /> : null}
        {securitySubscriptions.length ? <SecuritySection subscriptions={securitySubscriptions} /> : null}
        {generalSubscriptions.length ? <GeneralServicesSection subscriptions={generalSubscriptions} /> : null}
      </div>
    </div>
  );
}
