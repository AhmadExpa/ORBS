import Link from "next/link";
import { LockKeyhole, ServerCog, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LoginModePanel } from "@/components/auth/login-mode-panel";

function resolveRedirect(searchParams) {
  const value = searchParams?.redirect_url || searchParams?.redirectUrl || "/portal";
  const redirectTo = Array.isArray(value) ? value[0] : value;

  return typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/portal";
}

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = resolveRedirect(resolvedSearchParams);
  const signupUrl = `/signup?redirect_url=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_46%,#eef2f6_100%)] px-0 py-0 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl overflow-hidden border-0 bg-white shadow-none sm:min-h-[calc(100vh-3rem)] sm:rounded-lg sm:border sm:border-slate-200 sm:shadow-[0_36px_110px_-72px_rgba(15,23,42,0.55)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,#111827_0%,#020617_100%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <Link href="/" aria-label="ElevenOrbits home">
              <BrandLogo className="h-12 w-[230px]" imageClassName="brightness-0 invert" priority />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Secure Customer Access</p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em]">
                Return to your managed order without losing context.
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/64">
                Sign in to review settings, confirm billing, and complete card payment inside the ElevenOrbits portal.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { icon: LockKeyhole, label: "Protected checkout", value: "Account access is required before configuration and payment." },
                { icon: ServerCog, label: "Managed delivery", value: "Provisioning notes and selected settings remain tied to your order." },
                { icon: ShieldCheck, label: "Billing continuity", value: "Successful card payments activate the order and open the portal." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-white/58">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center px-4 py-6 sm:p-8 lg:p-12">
          <div className="w-full min-w-0 max-w-md">
            <Link href="/" className="mb-6 inline-flex max-w-full lg:hidden" aria-label="ElevenOrbits home">
              <BrandLogo className="h-10 w-[190px] max-w-full sm:h-11 sm:w-[210px]" priority />
            </Link>
            <LoginModePanel redirectTo={redirectTo} signupUrl={signupUrl} />
          </div>
        </section>
      </div>
    </div>
  );
}
