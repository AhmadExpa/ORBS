import { AdminLoginForm } from "@/components/admin/login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Activity, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";

export default function StandaloneAdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#f6f5f2] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]">
        <section className="relative hidden overflow-hidden bg-[#0f1115] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="relative">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <BrandLogo className="h-9" imageClassName="brightness-0 invert" priority />
            </div>
            <div className="mt-16 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Admin Portal</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.02em] text-white">
                Operations access for ElevenOrbits staff.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">
                Review customers, contracts, billing, subscriptions, support tickets, and audit activity from one controlled workspace.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3">
            {[
              { icon: ShieldCheck, label: "Staff-only authentication", value: "Admin and support-agent roles" },
              { icon: Activity, label: "Audit visibility", value: "Every sensitive action is tracked" },
              { icon: UsersRound, label: "Customer operations", value: "Contracts, tickets, subscriptions, and billing" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs text-white/45">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-center lg:hidden">
              <BrandLogo className="h-10" priority />
            </div>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <LockKeyhole className="h-4 w-4 shrink-0" />
              Authorized staff access only.
            </div>
            <AdminLoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
