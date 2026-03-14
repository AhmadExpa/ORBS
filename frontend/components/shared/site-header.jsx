"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/lib/ui";
import { BrandLogo } from "./brand-logo";

export function SiteHeader() {
  const { user } = useUser();
  const greetingName = user?.firstName || user?.fullName || user?.username || "there";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-14 md:h-16" priority />
        </Link>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
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
