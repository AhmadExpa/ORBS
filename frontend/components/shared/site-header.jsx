"use client";

import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { LogIn, Menu, X } from "lucide-react";
import { Button } from "@/lib/ui";
import { getLoginPath, getSignupPath } from "@/lib/shared";
import { BrandLogo } from "./brand-logo";

const landingNavItems = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const greetingName = user?.firstName || user?.fullName || user?.username || "there";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 shadow-[0_18px_46px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1520px] items-center gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-11 w-[196px] md:h-12 md:w-[230px]" imageClassName="w-full" priority />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
          {landingNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="relative py-2 transition hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <SignedOut>
            <Link href={getLoginPath()} className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex">
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
            <Link href={getSignupPath()} className="hidden sm:block">
              <Button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 hover:bg-black">Get Started</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <p className="hidden text-sm font-medium text-slate-600 md:block">Hi, {greetingName}</p>
            <Link href="/portal">
              <Button variant="ghost" className="min-h-10 rounded-md px-4 py-2">Portal</Button>
            </Link>
            <UserButton />
          </SignedIn>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white/96 px-4 py-4 shadow-[0_18px_46px_-42px_rgba(15,23,42,0.45)] lg:hidden">
          <nav className="mx-auto grid max-w-[1520px] gap-1">
            {landingNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <SignedOut>
              <Link
                href={getLoginPath()}
                className="rounded-md px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href={getSignupPath()}
                className="rounded-md bg-slate-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-black sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </SignedOut>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
