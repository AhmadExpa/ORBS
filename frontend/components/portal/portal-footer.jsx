import Link from "next/link";
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

export function PortalFooter() {
  const legalLinks = [{ href: "/legal", label: "Legal center" }, ...legalPages.slice(0, 3).map((page) => ({ href: `/legal/${page.slug}`, label: page.title }))];

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto w-full max-w-[1680px] px-6 py-8 md:px-8">
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
