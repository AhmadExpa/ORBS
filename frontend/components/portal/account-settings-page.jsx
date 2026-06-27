"use client";

import { useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { Building2, UserRound } from "lucide-react";
import { Topbar } from "@/components/shared/topbar";
import { AccountForm } from "@/components/portal/account-form";
import { cn } from "@/lib/ui";

const tabs = [
  {
    id: "general",
    label: "General information",
    description: "Email, password, and sign-in security",
    icon: UserRound,
  },
  {
    id: "business",
    label: "Business details",
    description: "Company profile and billing address",
    icon: Building2,
  },
];

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border border-line rounded-xl shadow-card",
    headerTitle: "text-slate-900",
    headerSubtitle: "text-slate-500",
    formButtonPrimary: "bg-accent-600 hover:bg-accent-700 text-white normal-case",
    profileSectionPrimaryButton: "text-brand-700",
    badge: "bg-brand-50 text-brand-700",
  },
};

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
              <UserProfile routing="hash" appearance={clerkAppearance} />
            ) : (
              <AccountForm embedded />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
