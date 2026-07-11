"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Building2,
  ChevronDown,
  Cloud,
  DollarSign,
  Headset,
  LogIn,
  Menu,
  PhoneCall,
  Server,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import { Button, cn } from "@/lib/ui";
import { getLoginPath, getSignupPath, serviceFamilies, serviceVerticals } from "@/lib/shared";
import { ServiceLogoCluster } from "@/components/marketing/service-branding";
import { BrandLogo } from "./brand-logo";

const landingNavItems = [
  { href: "/industries", label: "Industries" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

const familyIcons = {
  "Managed Cloud": Server,
  "Call Centers": PhoneCall,
  "AI Services": Bot,
  Cybersecurity: ShieldCheck,
};

const utilityLinks = [
  { href: "/pricing", label: "Pricing", description: "Compare monthly plans and service lanes.", icon: DollarSign },
  { href: "/industries", label: "Industries", description: "Find the right operating model by business type.", icon: Building2 },
  { href: "/resources", label: "Resources", description: "Guides for servers, AI, automation, security, and billing.", icon: BookOpen },
  { href: "/tech-stack", label: "Tech Stack", description: "Review the platforms behind delivery.", icon: Cloud },
  { href: "/contact", label: "Contact", description: "Route sales, support, billing, and security questions.", icon: Headset },
];

export function SiteHeader() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const greetingName = user?.firstName || user?.fullName || user?.username || "there";
  const elevated = hasScrolled || mobileMenuOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateScrolled = () => setHasScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setMobileServicesOpen(true);
  }

  function toggleMobileMenu() {
    setServicesMenuOpen(false);
    setMobileMenuOpen((current) => {
      const next = !current;
      if (next) {
        setMobileServicesOpen(true);
      }
      return next;
    });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300",
        elevated
          ? "border-slate-200/80 bg-white/94 shadow-[0_18px_46px_-42px_rgba(15,23,42,0.45)]"
          : "border-transparent bg-white/72 shadow-none",
      )}
    >
      <div className={cn("mx-auto flex w-full max-w-[1520px] items-center gap-5 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8", elevated ? "py-3" : "py-4")}>
        <Link href="/" className="flex shrink-0 items-center" aria-label="ElevenOrbits home">
          <BrandLogo className="h-11 w-[196px] md:h-12 md:w-[230px]" imageClassName="w-full" priority />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setServicesMenuOpen(true)}
            onMouseLeave={() => setServicesMenuOpen(false)}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 py-2 transition hover:text-slate-950",
                servicesMenuOpen && "text-slate-950",
              )}
              aria-expanded={servicesMenuOpen}
              onClick={() => setServicesMenuOpen((open) => !open)}
            >
              Services
              <ChevronDown className={cn("h-4 w-4 transition", servicesMenuOpen && "rotate-180")} />
            </button>
            {servicesMenuOpen ? (
              <div className="absolute left-1/2 top-full z-50 mt-4 w-[min(1120px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_36px_100px_-58px_rgba(15,23,42,0.45)]">
                <div className="grid gap-px bg-slate-200 lg:grid-cols-[1.15fr_0.95fr_0.9fr]">
                  <div className="bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Service families</p>
                    <div className="mt-5 grid gap-3">
                      {serviceFamilies.map((family) => {
                        const Icon = familyIcons[family.name] || Workflow;
                        return (
                          <Link
                            key={family.name}
                            href={`/${family.pageSlug || "services"}`}
                            className="group rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50"
                            onClick={() => setServicesMenuOpen(false)}
                          >
                            <div className="flex items-start gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-base font-semibold text-slate-950">
                                  {family.name}
                                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                                </span>
                                <span className="mt-1 block text-sm leading-6 text-slate-600">{family.description}</span>
                                <ServiceLogoCluster categorySlugs={family.categorySlugs} max={4} className="mt-3" />
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Product pages</p>
                    <div className="mt-5 grid gap-2">
                      {serviceVerticals.map((vertical) => (
                        <Link
                          key={vertical.slug}
                          href={`/${vertical.slug}`}
                          className="group rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                          onClick={() => setServicesMenuOpen(false)}
                        >
                          <span className="block text-sm font-semibold text-slate-950">{vertical.name}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{vertical.eyebrow}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Fast paths</p>
                    <div className="mt-5 grid gap-3">
                      {utilityLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex gap-3 rounded-lg p-2.5 transition hover:bg-white"
                            onClick={() => setServicesMenuOpen(false)}
                          >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 group-hover:text-slate-950" />
                            <span>
                              <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-950">Ready to configure?</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">Create an account, choose a plan, and send the requirements needed for provisioning.</p>
                      <Link href={getSignupPath()} className="mt-4 inline-flex" onClick={() => setServicesMenuOpen(false)}>
                        <Button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 hover:bg-black">Get Started</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
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
            aria-controls="site-mobile-menu"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mounted && mobileMenuOpen
        ? createPortal(
            <div
              id="site-mobile-menu"
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950 text-white lg:hidden"
            >
              <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" aria-label="ElevenOrbits home" onClick={closeMobileMenu}>
                <BrandLogo className="h-10 w-[188px]" imageClassName="brightness-0 invert" priority />
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white"
                aria-label="Close menu"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-10 flex-1">
              <div>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 rounded-md py-3 text-left text-4xl font-semibold tracking-[-0.05em]"
                  aria-expanded={mobileServicesOpen}
                  onClick={() => setMobileServicesOpen((open) => !open)}
                >
                  Services
                  <ChevronDown className={cn("h-7 w-7 shrink-0 text-white/45 transition", mobileServicesOpen && "rotate-180")} />
                </button>

                {mobileServicesOpen ? (
                  <div className="mt-4 grid gap-4">
                    {serviceFamilies.map((family) => {
                      const Icon = familyIcons[family.name] || Workflow;
                      return (
                        <Link
                          key={family.name}
                          href={`/${family.pageSlug || "services"}`}
                          className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                          onClick={closeMobileMenu}
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-2xl font-semibold tracking-[-0.03em]">{family.name}</span>
                              <span className="mt-2 block text-sm leading-6 text-white/60">{family.description}</span>
                              <ServiceLogoCluster categorySlugs={family.categorySlugs} max={4} className="mt-4 [&_img]:brightness-0 [&_img]:invert" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">Product Pages</p>
                      <div className="mt-3 grid gap-1.5">
                        {serviceVerticals.map((vertical) => (
                          <Link
                            key={vertical.slug}
                            href={`/${vertical.slug}`}
                            className="flex items-center justify-between rounded-md py-2.5 text-base font-semibold text-white"
                            onClick={closeMobileMenu}
                          >
                            {vertical.name}
                            <ArrowRight className="h-4 w-4 text-white/35" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-9 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Navigate</p>
                <div className="mt-4 grid gap-1">
                  {[{ href: "/services", label: "All Services" }, ...landingNavItems, { href: "/tech-stack", label: "Tech Stack" }].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-md py-3 text-3xl font-semibold tracking-[-0.04em] text-white"
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                      <ArrowRight className="h-6 w-6 text-white/35" />
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="mt-8 grid gap-3 border-t border-white/10 pt-6">
              <SignedOut>
                <Link
                  href={getSignupPath()}
                  className="rounded-md bg-white px-4 py-3 text-center text-base font-semibold text-slate-950"
                  onClick={closeMobileMenu}
                >
                  Get Started
                </Link>
                <Link
                  href={getLoginPath()}
                  className="rounded-md border border-white/15 px-4 py-3 text-center text-base font-semibold text-white"
                  onClick={closeMobileMenu}
                >
                  Log In
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/portal"
                  className="rounded-md bg-white px-4 py-3 text-center text-base font-semibold text-slate-950"
                  onClick={closeMobileMenu}
                >
                  Open Portal
                </Link>
              </SignedIn>
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
