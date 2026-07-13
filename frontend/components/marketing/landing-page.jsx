"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  PhoneCall,
  ShieldCheck,
  Wallet,
  Search,
  Cpu,
  HardDrive,
  CheckCircle2,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { getSignupPath } from "@/lib/shared";
import { cn } from "@/lib/ui";
import { TechStackShowcase } from "./tech-stack-showcase";

const tabsConfig = [
  { id: "compute", label: "Compute & VPS", icon: Cpu },
  { id: "ai", label: "AI & Model Servers", icon: BrainCircuit },
  { id: "voip", label: "VICIdial & VoIP", icon: PhoneCall },
  { id: "storage", label: "Storage & CDN", icon: HardDrive },
  { id: "security", label: "Cybersecurity", icon: ShieldCheck },
];

const mockSearchSuggestions = [
  "Managed VDS",
  "RTX 4090 GPU",
  "VICIdial Starter",
  "Nextcloud Storage",
];

const faqItems = [
  {
    question: "How does the 3-day trial option work?",
    answer: "For eligible services (including VPS, VICIdial, and self-hosted apps), customers can check the 'Request 3-Day Trial' box inside the portal configurator. A pending invoice is created, and your setup is provisioned. If canceled before 3 days, no charges apply.",
  },
  {
    question: "What is your network SLA and backing?",
    answer: "All core computing lanes (managed VPS/VDS) are backed by a 99.9% uptime Service Level Agreement. We partner with tier-1 data center facilities globally to route traffic with less than 35ms edge latency.",
  },
  {
    question: "Do you offer full root/SSH access to managed servers?",
    answer: "By default, servers are delivered with access credentials assigned in your portal. For fully managed plans, our team manages updates, firewall hardening, and daemon status, but customized admin access levels can be delegated upon request.",
  },
  {
    question: "How does portal wallet billing function?",
    answer: "ElevenOrbits operates on a prepay wallet model. You can top up your balance via credit card or bank details. Active subscriptions deduct balance monthly. If your wallet goes below zero, the saved card is automatically used as fallback.",
  },
];

export function LandingPage() {
  const [activeTab, setActiveTab] = useState("compute");
  const [searchQuery, setSearchQuery] = useState("");

  // Group plans for quick technical specs (AWS-style)
  const computeSpecs = [
    { name: "Basic Managed VPS", cores: "2 vCPU", ram: "4 GB DDR4", disk: "40 GB SSD", network: "2 TB @ 1 Gbps", price: "$20", period: "mo", trial: true },
    { name: "Pro Managed VPS", cores: "4 vCPU", ram: "8 GB DDR4", disk: "80 GB SSD", network: "4 TB @ 1 Gbps", price: "$40", period: "mo", trial: true },
    { name: "Elite Managed VPS", cores: "8 vCPU", ram: "16 GB DDR4", disk: "160 GB SSD", network: "8 TB @ 1 Gbps", price: "$80", period: "mo", trial: true },
    { name: "Balanced Managed VDS", cores: "Dedicated Cores", ram: "16 GB RAM", disk: "160 GB SSD", network: "10 TB @ 1 Gbps", price: "$100", period: "mo", trial: false },
  ];

  const aiSpecs = [
    { name: "AI Server Starter", gpu: "RTX 4090 (24GB VRAM)", cores: "8 vCPU", ram: "32 GB RAM", disk: "500 GB NVMe", model: "DeepSeek-R1 / Llama-3", price: "$150", period: "mo", trial: true },
    { name: "DeepSeek API Access", gpu: "Shared API Endpoints", cores: "Managed Lanes", ram: "Guardrails Incl.", disk: "Unlimited Calls", model: "DeepSeek-R1-671B", price: "$0.02", period: "1k tokens", trial: false },
    { name: "Private Model Planning", gpu: "Custom Architectures", cores: "Consultancy", ram: "SLA Guidance", disk: "Private Registry", model: "Custom LLMs", price: "Custom", period: "quote", trial: false },
  ];

  const voipSpecs = [
    { name: "Starter VICIdial", seats: "Up to 5 seats", trunks: "2 SIP Trunks", rate: "20 calls/min", setup: "48 hours", support: "1 Lane support", price: "$250", period: "mo", trial: true },
    { name: "Standard VICIdial", seats: "Up to 15 seats", trunks: "5 SIP Trunks", rate: "60 calls/min", setup: "24 hours", support: "Priority Lane", price: "$350", period: "mo", trial: true },
    { name: "Vicidial Multi-Server", seats: "30+ seats", trunks: "Unlimited", rate: "200+ calls/min", setup: "Custom", support: "Dedicated SLAs", price: "Custom", period: "quote", trial: false },
  ];

  const storageSpecs = [
    { name: "O7 Bucket Starter", space: "100 GB S3 Storage", api: "Full S3 API Compatibility", traffic: "1 TB Outbound Transfer", speed: "Edge Cached Distribution", price: "$10", period: "mo", trial: true },
    { name: "O7 Bucket Pro", space: "500 GB S3 Storage", api: "Full S3 API Compatibility", traffic: "5 TB Outbound Transfer", speed: "Global Edge CDN Included", price: "$30", period: "mo", trial: true },
    { name: "Custom Object Cluster", space: "10 TB+ Storage", api: "Dedicated Endpoints", traffic: "Unmetered Inbound", speed: "Private CDN & Custom SSL", price: "Custom", period: "quote", trial: false },
  ];

  const securitySpecs = [
    { name: "Cybersecurity Basic", scope: "Single Server Node", hardening: "OS Lockdown & Ports Hardening", scans: "Weekly Vulnerability Audits", log: "Syslog Shipping Ready", price: "$50", period: "mo", trial: true },
    { name: "Cybersecurity Premium", scope: "Up to 3 Server Nodes", hardening: "WAF & IDS/IPS Active Rules", scans: "Daily Security Audits", log: "Managed SIEM Dashboard", price: "$150", period: "mo", trial: false },
    { name: "Enterprise Compliance", scope: "Custom Infrastructure", hardening: "ISO 27001 Prep / CIS Baseline", scans: "Continuous Agent Monitoring", log: "24/7 Support Escalation", price: "Custom", period: "quote", trial: false },
  ];

  return (
    <div className="relative overflow-x-clip bg-[#f8f9fa] pb-16 text-slate-900">
      {/* Decorative Warm Accent Gradients using HubSpot Orange style color */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/50 via-orange-50/20 to-transparent opacity-80" />

      {/* SECTION 1: AWS-STYLE HERO SECTION */}
      <section id="hero" className="relative border-b border-slate-200/80 scroll-mt-24">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-70" />
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* Left Hero Details */}
            <div className="relative z-10 flex flex-col items-start">
              {/* Premium Release Badge (HubSpot Orange themed) */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/60 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-orange-800">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#ff7a1a] animate-pulse" />
                Now Available: Private DeepSeek-R1 GPU Server Configurations
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[54px] lg:leading-[1.1]">
                Build, Deploy, and Manage Enterprise Infrastructure.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-655 sm:text-lg">
                Deploy managed computing, scalable call center dialers, edge-cached object storage, and secure model layers. ElevenOrbits provides concrete SLAs, unified billing wallets, and responsive engineering teams.
              </p>

              {/* AWS-Style Search bar simulator (HubSpot Orange focus themed) */}
              <div className="mt-8 w-full max-w-xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery) {
                      window.location.href = `/signup?service=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="relative flex items-center rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-[#ff7a1a] focus-within:ring-2 focus-within:ring-orange-100"
                >
                  <Search className="ml-4 h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search compute, dialers, or AI systems..."
                    className="w-full border-0 bg-transparent px-3 py-3.5 text-sm text-slate-800 focus:outline-none focus:ring-0 placeholder:text-slate-450"
                  />
                  <button
                    type="submit"
                    className="mr-2 rounded-md bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-900"
                  >
                    Locate
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Popular searches:</span>
                  {mockSearchSuggestions.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Action Deck */}
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link
                  href={getSignupPath()}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#ff7a1a] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#e66a12] shadow-sm"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#explorer"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore Pricing specs
                </Link>
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="relative min-w-0 lg:-mr-8 xl:-mr-16">
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-orange-100/35 blur-3xl" />
              <Image
                src="/hero-server.png"
                alt="ElevenOrbits managed infrastructure dashboard with servers, AI automation, VoIP, storage, and cybersecurity services"
                width={1416}
                height={1044}
                priority
                sizes="(min-width: 1280px) 720px, (min-width: 1024px) 52vw, 100vw"
                className="relative z-10 h-auto w-full max-w-none drop-shadow-[0_28px_50px_rgba(15,23,42,0.10)]"
              />
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: HIGH-DENSITY CLOUD STATS */}
      <section className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Global Edge Latency", value: "< 35ms RTT", description: "BGP route optimization with anycast traffic distribution." },
              { label: "Operating SLA Assurance", value: "99.9% Uptime", description: "Backed by redundant VM storage arrays & priority hypervisors." },
              { label: "Trial Accessibility", value: "3-Day Free Trial", description: "Request instant provisioning on eligible compute and app lanes." },
              { label: "Compliant Security", value: "CIS Hardened", description: "Firewall lockdown, access auditing, and patch updates configured." },
            ].map((stat, i) => (
              <div key={i} className="min-w-0 border-l-2 border-slate-150 pl-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-955">{stat.value}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-550">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: TABBED AWS-STYLE PRODUCT EXPLORER (CONCRETE SPECS) */}
      <section id="explorer" className="relative scroll-mt-24 border-b border-slate-200/60">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-35" />
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7a1a]">Compute Catalog</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-955 sm:text-4xl">
              Concrete technical profiles. No marketing fluff.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-655">
              Review specific resources, storage volumes, network speeds, and prices. Select your starting config and activate trial options directly in the ElevenOrbits portal.
            </p>
          </div>

          {/* AWS-Style tab switcher (HubSpot Orange themed) */}
          <div className="mt-10 border-b border-slate-250">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition-all duration-200",
                      active
                        ? "border-[#ff7a1a] text-[#ff7a1a] bg-white rounded-t-lg"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab contents wrapper */}
          <div className="mt-6">
            
            {/* Compute Tab */}
            {activeTab === "compute" && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 animate-eo-menu-in">
                {computeSpecs.map((plan, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-250 bg-white p-6 shadow-sm hover:border-slate-350 transition duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                        {plan.trial && (
                          <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#ff7a1a]">Trial Available</span>
                        )}
                      </div>
                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Cores</span><span className="font-semibold text-slate-800">{plan.cores}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Memory</span><span className="font-semibold text-slate-800">{plan.ram}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">SSD Disk</span><span className="font-semibold text-slate-800">{plan.disk}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Transfer</span><span className="font-semibold text-slate-800">{plan.network}</span></div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-950">{plan.price}</span>
                        <span className="pb-1 text-xs text-slate-500">/{plan.period}</span>
                      </div>
                      <Link href={getSignupPath()} className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900">
                        Launch Instance
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Tab */}
            {activeTab === "ai" && (
              <div className="grid gap-6 md:grid-cols-3 animate-eo-menu-in">
                {aiSpecs.map((plan, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-250 bg-white p-6 shadow-sm hover:border-slate-350 transition duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                        {plan.trial && (
                          <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#ff7a1a]">Trial Available</span>
                        )}
                      </div>
                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">GPU Capacity</span><span className="font-semibold text-slate-850">{plan.gpu}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Host Cores</span><span className="font-semibold text-slate-800">{plan.cores}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Host RAM</span><span className="font-semibold text-slate-800">{plan.ram}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">System Disk</span><span className="font-semibold text-slate-800">{plan.disk}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Model Hub</span><span className="font-semibold text-[#ff7a1a]">{plan.model}</span></div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-950">{plan.price}</span>
                        <span className="pb-1 text-xs text-slate-500">/{plan.period}</span>
                      </div>
                      <Link href={getSignupPath()} className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900">
                        Request Scoping
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VoIP/Vicidial Tab */}
            {activeTab === "voip" && (
              <div className="grid gap-6 md:grid-cols-3 animate-eo-menu-in">
                {voipSpecs.map((plan, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-250 bg-white p-6 shadow-sm hover:border-slate-350 transition duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                        {plan.trial && (
                          <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#ff7a1a]">Trial Available</span>
                        )}
                      </div>
                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">User Seats</span><span className="font-semibold text-slate-850">{plan.seats}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">SIP Lanes</span><span className="font-semibold text-slate-800">{plan.trunks}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Dial Limit</span><span className="font-semibold text-slate-800">{plan.rate}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Provision Time</span><span className="font-semibold text-slate-800">{plan.setup}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Support Group</span><span className="font-semibold text-slate-800">{plan.support}</span></div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-950">{plan.price}</span>
                        <span className="pb-1 text-xs text-slate-500">/{plan.period}</span>
                      </div>
                      <Link href={getSignupPath()} className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900">
                        Launch Dialer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === "storage" && (
              <div className="grid gap-6 md:grid-cols-3 animate-eo-menu-in">
                {storageSpecs.map((plan, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-250 bg-white p-6 shadow-sm hover:border-slate-350 transition duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                        {plan.trial && (
                          <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#ff7a1a]">Trial Available</span>
                        )}
                      </div>
                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">S3 Space</span><span className="font-semibold text-slate-850">{plan.space}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">API Standard</span><span className="font-semibold text-slate-800">{plan.api}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Monthly Traffic</span><span className="font-semibold text-slate-800">{plan.traffic}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Distribution</span><span className="font-semibold text-slate-800">{plan.speed}</span></div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-950">{plan.price}</span>
                        <span className="pb-1 text-xs text-slate-500">/{plan.period}</span>
                      </div>
                      <Link href={getSignupPath()} className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900">
                        Provision S3 Bucket
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="grid gap-6 md:grid-cols-3 animate-eo-menu-in">
                {securitySpecs.map((plan, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-250 bg-white p-6 shadow-sm hover:border-slate-350 transition duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
                        {plan.trial && (
                          <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#ff7a1a]">Trial Available</span>
                        )}
                      </div>
                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Coverage Range</span><span className="font-semibold text-slate-850">{plan.scope}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Hardening Level</span><span className="font-semibold text-slate-800">{plan.hardening}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Audit Scans</span><span className="font-semibold text-slate-800">{plan.scans}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Log Forwarding</span><span className="font-semibold text-slate-800">{plan.log}</span></div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-950">{plan.price}</span>
                        <span className="pb-1 text-xs text-slate-500">/{plan.period}</span>
                      </div>
                      <Link href={getSignupPath()} className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900">
                        Enable Security Scan
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </section>

      {/* SECTION 4: REFERENCE WORKLOADS (AWS-STYLE SOLUTIONS) */}
      <section id="workloads" className="relative scroll-mt-24 border-b border-slate-200/60 bg-white">
        <div className="pointer-events-none absolute inset-0 marketing-grid-fine opacity-80" />
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7a1a]">Reference Deployments</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
              Engineered configurations for common enterprise workloads.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-655">
              Choose pre-architected templates built combining our servers, private storage buckets, security guidelines, and automation blocks.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Call Center Dialer Core",
                purpose: "Outbound telemarketing & VoIP queues",
                workflow: [
                  "Starter VICIdial dials via 2 pre-configured SIP lanes.",
                  "Audio logs are compressed hourly & shipped to S3 bucket.",
                  "Cybersecurity scan schedules block rogue port access weekly.",
                ],
                tag: "VoIP & Storage Integration",
              },
              {
                title: "Private LLM Inference Lane",
                purpose: "Internal AI agents and data privacy",
                workflow: [
                  "AI Server Starter runs DeepSeek model isolated on GPU VRAM.",
                  "Nextcloud app hosts corporate file logs for private context.",
                  "All access credentials stored inside the portal secure vault.",
                ],
                tag: "AI & Collaboration Stack",
              },
              {
                title: "Scalable Web Operations",
                purpose: "Corporate websites, APIs, and portals",
                workflow: [
                  "VDS Compute hosts primary database & backend server.",
                  "Object storage ships static assets with CDN cache active.",
                  "Daily backup rotations ensure instant VM snapshot rollback.",
                ],
                tag: "Compute & CDN Stack",
              },
            ].map((workload, idx) => (
              <div key={idx} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#f8f9fa] p-6 shadow-sm hover:shadow-md transition duration-200">
                <div>
                  <span className="rounded bg-orange-50 border border-orange-200/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#ff7a1a]">{workload.tag}</span>
                  <h3 className="mt-5 text-xl font-bold text-slate-955">{workload.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 font-medium">{workload.purpose}</p>

                  <div className="mt-6 space-y-3.5 border-t border-slate-200/60 pt-5">
                    {workload.workflow.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 font-bold text-slate-700">{sIdx + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-200/60 pt-5">
                  <Link href={getSignupPath()} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff7a1a] hover:text-[#e66a12]">
                    Deploy this configuration
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 5: PAY-AS-YOU-GO TRANSPARENCY (NO BLUFF BILLING) */}
      <section className="relative border-b border-slate-200/60 bg-slate-50/50">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            
            {/* Wallet Mechanics Left */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7a1a]">Transparent Billing</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-955">
                Wallet-based funding. Predictable hourly pricing.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-655">
                We take billing seriously. All servers run on pre-calculated monthly ceilings but compute balance scales. Deposit money, configure active limits, and track expenses in real-time.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] border border-orange-100">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-slate-950">Secure Portal Wallet</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-550">Top up credits via Credit Card. Payments are securely managed and auto-renew balance seamlessly.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a1a] border border-orange-100">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-slate-955">No-Hassle Cancellation</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-550">Cancel subscriptions at any time directly through the portal with transparent cancel feedback forms.</p>
                </div>
              </div>
            </div>

            {/* Spec visual card list right */}
            <div className="rounded-xl border border-slate-250 bg-white p-6 shadow-md">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-150 pb-3">Operational Safeguards</h3>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Automatic Backups", value: "Snapshot rotations captured daily with 7-day retention limit." },
                  { label: "Port Protections", value: "Default block on critical mail / database ports; whitelists configed." },
                  { label: "Support Hand-off", value: "Dedicated engineering lanes verify daemon configurations before setup hand-off." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-555 leading-relaxed">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: INTEGRATION PARTNERS (COMPACT TECH SHOWCASE) */}
      <TechStackShowcase compact />

      {/* SECTION 7: DIRECT AWS-STYLE FAQ */}
      <section id="faq" className="relative scroll-mt-24 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7a1a]">FAQ</p>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-955 sm:text-3xl">
                Technical queries, direct answers.
              </h2>
              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                Detailed information for cloud operations, trial constraints, billing mechanisms, and support parameters before registering your portal account.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {faqItems.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-[#f8f9fa] p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff7a1a]">Audit 0{idx + 1}</p>
                  <h3 className="mt-3 text-sm font-bold text-slate-955 leading-snug">{item.question}</h3>
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
