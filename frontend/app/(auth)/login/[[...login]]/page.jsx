import Link from "next/link";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { ArrowRight, LockKeyhole, ServerCog, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LogoSpinner } from "@/components/shared/logo-spinner";

function resolveRedirect(searchParams) {
  const value = searchParams?.redirect_url || searchParams?.redirectUrl || "/portal";
  const redirectTo = Array.isArray(value) ? value[0] : value;

  return typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/portal";
}

const authAppearance = {
  elements: {
    rootBox: "w-full",
    card: "w-full border border-slate-200/90 bg-white shadow-[0_28px_80px_-54px_rgba(15,23,42,0.55)] rounded-lg",
    headerTitle: "text-slate-950 text-2xl font-semibold tracking-[-0.02em]",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButton:
      "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300",
    formButtonPrimary:
      "bg-slate-950 hover:bg-black text-white shadow-[0_16px_34px_-20px_rgba(15,23,42,0.9)]",
    formFieldInput:
      "rounded-md border-slate-200 focus:border-slate-400 focus:ring-slate-300",
    footer: "hidden",
    footerPages: "hidden",
  },
};

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = resolveRedirect(resolvedSearchParams);
  const signupUrl = `/signup?redirect_url=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_46%,#eef2f6_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_36px_110px_-72px_rgba(15,23,42,0.55)] lg:grid-cols-[0.95fr_1.05fr]">
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

        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex lg:hidden" aria-label="ElevenOrbits home">
              <BrandLogo className="h-11 w-[210px]" priority />
            </Link>
            <SignedOut>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer Portal</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Log in to continue.</h2>
              </div>
              <SignIn
                routing="path"
                path="/login"
                signUpUrl={signupUrl}
                forceRedirectUrl={redirectTo}
                fallbackRedirectUrl={redirectTo}
                signUpForceRedirectUrl={redirectTo}
                signUpFallbackRedirectUrl={redirectTo}
                appearance={authAppearance}
              />
              <p className="mt-5 text-center text-sm text-slate-600">
                Need an account?{" "}
                <Link href={signupUrl} className="inline-flex items-center gap-1 font-semibold text-slate-950 transition hover:text-slate-700">
                  Create one <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
            </SignedOut>
            <SignedIn>
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <LogoSpinner size={60} />
                <p className="mt-5 text-lg font-semibold tracking-tight text-slate-900">Signing you in…</p>
                <p className="mt-2 text-sm text-slate-500">Taking you to your ElevenOrbits portal.</p>
              </div>
            </SignedIn>
          </div>
        </section>
      </div>
    </div>
  );
}
