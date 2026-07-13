import Link from "next/link";
import { ArrowLeft, KeyRound, LifeBuoy, LockKeyhole, Server } from "lucide-react";
import { AgentLoginForm } from "@/components/auth/login-mode-panel";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function AgentLoginPage() {
  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_36px_120px_-70px_rgba(0,0,0,0.8)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#07111f] p-10 lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),transparent_36%),linear-gradient(180deg,#0f1b2d_0%,#020617_100%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <Link href="/" aria-label="ElevenOrbits home">
              <BrandLogo className="h-12 w-[230px]" imageClassName="brightness-0 invert" priority />
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/70">Agent Workspace</p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em]">
                Scoped service access without customer billing controls.
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/64">
                Sign in with the agent username assigned by the account owner to view selected services, credentials, and support tickets.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                { icon: Server, label: "Assigned services only", value: "Agents see only the subscriptions selected by the customer." },
                { icon: KeyRound, label: "Credential review", value: "Provisioned login, password, IP, and handoff notes stay scoped." },
                { icon: LifeBuoy, label: "Support context", value: "Tickets stay tied to the service record the agent is allowed to manage." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-400/15 text-sky-200">
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

        <section className="flex min-w-0 items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_48%,#eef6fb_100%)] px-4 py-8 text-slate-950 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex lg:hidden" aria-label="ElevenOrbits home">
              <BrandLogo className="h-10 w-[190px]" priority />
            </Link>
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              <LockKeyhole className="h-4 w-4" />
              Agent login is separate from customer account login.
            </div>
            <AgentLoginForm variant="standalone" />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-slate-600 transition hover:text-slate-950">
                <ArrowLeft className="h-3.5 w-3.5" />
                Customer login
              </Link>
              <Link href="/contact" className="font-semibold text-slate-950 transition hover:text-slate-700">
                Need access?
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
