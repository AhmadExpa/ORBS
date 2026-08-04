"use client";

import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageCircle } from "lucide-react";
import { legalPages } from "@/lib/legal-content";
import { BrandLogo } from "@/components/shared/brand-logo";

const footerColumns = [
  {
    title: "Portal",
    links: [
      { href: "/portal", label: "Dashboard" },
      { href: "/portal/services", label: "Apps" },
      { href: "/portal/subscriptions", label: "Subscriptions" },
      { href: "/portal/support", label: "Support" },
    ],
  },
  {
    title: "Billing",
    links: [
      { href: "/portal/invoices", label: "Invoices" },
      { href: "/portal/payments", label: "Wallet & Payments" },
      { href: "/portal/contracts", label: "Service agreement" },
    ],
  },
];

export function PortalFooter({ isAgent = false }) {
  const legalLinks = [{ href: "/legal", label: "Legal center" }, ...legalPages.slice(0, 3).map((page) => ({ href: `/legal/${page.slug}`, label: page.title }))];

  function openSupportChat() {
    window.dispatchEvent(new Event("elevenorbits:open-support-chat"));
  }

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 md:px-8">
        {!isAgent ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#0f172a_60%,#172554_100%)] p-5 text-white shadow-[0_24px_60px_-34px_rgba(2,6,23,0.85)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky-200">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">Customer care</p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Need help with an order or managed service?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                    Start a verified support chat for quick guidance, or open the support desk when you need a tracked technical or billing conversation.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={openSupportChat}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start secure chat
                </button>
                <Link
                  href="/portal/support"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Open support desk
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <BrandLogo className="h-7 w-[140px]" />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Managed hosting, AI, and workflow automation — with billing, renewals, and support in one secure portal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
            {[...footerColumns, { title: "Legal", links: legalLinks }].map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{column.title}</p>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-700">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ElevenOrbits. All rights reserved.</p>
          <p>
            Need a hand?{" "}
            <Link href="/portal/support" className="font-semibold text-brand-700 hover:text-brand-600">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
