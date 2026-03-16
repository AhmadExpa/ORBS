"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/lib/ui";
import { BrandLogo } from "./brand-logo";

const landingNavItems = [
  { href: "/#overview", label: "Overview" },
  { href: "/#services", label: "Services" },
  { href: "/#managed", label: "Managed" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact Us" },
];

export function SiteHeader() {
  const { user } = useUser();
  const greetingName = user?.firstName || user?.fullName || user?.username || "there";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-12 w-[220px] md:h-14 md:w-[260px]" imageClassName="w-full" priority />
        </Link>
        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-7 rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-sm font-medium text-slate-600 shadow-sm">
            {landingNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <SignedOut>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <p className="hidden text-sm font-medium text-slate-600 md:block">Hi, {greetingName}</p>
            <Link href="/portal">
              <Button variant="ghost">Portal</Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
