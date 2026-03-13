import Link from "next/link";
import { siteConfig } from "@/lib/constants/site";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo className="h-11 w-40" />
          <div>
            <p className="font-semibold text-slate-900">ElevenOrbits</p>
            <p>Managed infrastructure, AI systems, and workflow automation.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/#services">Services</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#contact">Contact</Link>
          <a href={`mailto:${siteConfig.generalEmail}`}>{siteConfig.generalEmail}</a>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}
