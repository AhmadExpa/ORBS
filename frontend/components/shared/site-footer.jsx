import Link from "next/link";
import { Headset, LockKeyhole, Mail, UserCircle } from "lucide-react";
import { legalPages } from "@/lib/legal-content";
import { companyLinks, resourcePages } from "@/lib/marketing-content";
import { serviceVerticals } from "@/lib/shared";
import { BrandLogo } from "./brand-logo";

const footerColumns = [
  {
    title: "Services",
    links: serviceVerticals.map((vertical) => ({ href: `/${vertical.slug}`, label: vertical.name })),
  },
  {
    title: "Infrastructure",
    links: [
      { href: "/services/vps", label: "Linux VPS hosting" },
      { href: "/services/vps", label: "Windows VPS hosting" },
      { href: "/services/vds", label: "Managed VDS" },
      { href: "/services/cdn", label: "Managed CDN" },
      { href: "/services/object-storage", label: "O7 Bucket storage" },
      { href: "/services/nextcloud-hosting", label: "Nextcloud hosting" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources", label: "All guides" },
      ...resourcePages.slice(0, 7).map((resource) => ({ href: `/resources/${resource.slug}`, label: resource.title })),
    ],
  },
  {
    title: "Company",
    links: [
      ...companyLinks,
      { href: "/industries", label: "Industries" },
      { href: "/tech-stack", label: "Tech Stack" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/portal/support", label: "Portal support" },
      { href: "/legal/service-level-support-policy", label: "Service support policy" },
      { href: "/legal/security-policy", label: "Security policy" },
      { href: "/legal/acceptable-use-policy", label: "Acceptable use" },
    ],
  },
];

const paymentBadges = [
  { src: "/payments/visa.svg", alt: "Visa" },
  { src: "/payments/mastercard.svg", alt: "Mastercard" },
  { src: "/payments/amex.svg", alt: "American Express" },
  { src: "/payments/discover.svg", alt: "Discover" },
  { src: "/payments/jcb.svg", alt: "JCB" },
  { src: "/payments/diners.svg", alt: "Diners Club" },
];

const trustBadges = [
  { src: "/payments/privacy-protected.svg", alt: "Privacy protected" },
  { src: "/payments/secure-checkout.svg", alt: "Secure checkout" },
];

const quickLinks = [
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/portal/support", label: "Support", icon: Headset },
  { href: "/legal/security-policy", label: "Security", icon: LockKeyhole },
  { href: "/login", label: "Portal", icon: UserCircle },
];

export function SiteFooter() {
  return (
    <footer id="site-footer" className="border-t-4 border-violet-600 bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-[1520px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {footerColumns.map((column) => (
            <section key={column.title}>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-950">{column.title}</h2>
              <nav className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <Link key={`${column.title}-${link.href}-${link.label}`} href={link.href} className="text-sm font-medium leading-5 text-slate-700 transition hover:text-slate-950">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-end">
          <div>
            <Link href="/" className="inline-flex w-fit">
              <BrandLogo className="h-11 w-[210px]" />
            </Link>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
              Managed hosting, cybersecurity, AI enablement, workflow automation, VoIP operations, and support delivered through one accountable service model.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {paymentBadges.map((badge) => (
                <img
                  key={badge.src}
                  src={badge.src}
                  alt={`${badge.alt} payment badge`}
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={38}
                  className="h-10 w-auto rounded-md shadow-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {trustBadges.map((badge) => (
                <img key={badge.src} src={badge.src} alt={badge.alt} loading="lazy" decoding="async" width={176} height={56} className="h-10 w-auto rounded-md shadow-sm sm:h-11" />
              ))}
            </div>
            <div className="flex items-center gap-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-slate-200 pt-6 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} ElevenOrbits. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/legal" className="font-medium transition hover:text-slate-950">
              Legal Center
            </Link>
            {legalPages.slice(0, 5).map((page) => (
              <Link key={page.slug} href={`/legal/${page.slug}`} className="font-medium transition hover:text-slate-950">
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
