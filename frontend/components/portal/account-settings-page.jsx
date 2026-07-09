"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Topbar } from "@/components/shared/topbar";
import { AccountForm } from "@/components/portal/account-form";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, cn } from "@/lib/ui";
import { LogoSpinner } from "@/components/shared/logo-spinner";

const tabs = [
  {
    id: "general",
    label: "Account overview",
    description: "Profile, email, and account status",
    icon: UserRound,
  },
  {
    id: "business",
    label: "Business details",
    description: "Company profile and billing address",
    icon: Building2,
  },
];

function fieldValue(value) {
  return value ? String(value) : "Not provided";
}

function AccountFact({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function GeneralAccountPanel({ onEditBusiness }) {
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-profile"],
    path: "/profile/me",
  });
  const user = profileQuery.data?.user;

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner size={56} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your primary ElevenOrbits account record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AccountFact label="Name" value={fieldValue(user?.name)} />
          <AccountFact label="Email" value={fieldValue(user?.email)} />
          <AccountFact label="Status" value={<StatusBadge status={user?.accountStatus || "active"} />} />
          <AccountFact label="Company" value={fieldValue(user?.company)} />
          <AccountFact label="Phone" value={fieldValue(user?.phone)} />
          <AccountFact label="Customer ID" value={fieldValue(user?._id)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Record</CardTitle>
            <CardDescription>Business details used for invoices, support, and provisioning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">{fieldValue(user?.company || user?.name)}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{fieldValue(user?.address)}</p>
              </div>
            </div>
            <Button type="button" onClick={onEditBusiness}>
              Edit Business Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Account access is handled through your ElevenOrbits sign-in session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <span className="min-w-0 break-words text-sm font-semibold text-slate-950">{fieldValue(user?.email)}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">Portal session active</span>
              </div>
            </div>
            <Link href="/portal/support" className="inline-flex">
              <Button variant="ghost">Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AccountSettingsPage() {
  const [tab, setTab] = useState("general");

  return (
    <div>
      <Topbar title="Account" subtitle="Manage your sign-in details, security, and business profile." />
      <div className="mx-auto w-full max-w-[1680px] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside>
            <nav className="space-y-2">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                      active ? "border-brand-200 bg-brand-50" : "border-line bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-sm font-semibold", active ? "text-brand-700" : "text-slate-900")}>{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {tab === "general" ? (
              <GeneralAccountPanel onEditBusiness={() => setTab("business")} />
            ) : (
              <AccountForm embedded />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
