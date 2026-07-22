import { siteConfig } from "@/lib/constants/site";

export const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/process", label: "Process" },
  { href: "/tech-stack", label: "Tech Stack" },
  { href: "/industries", label: "Industries" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export const companyPages = {
  about: {
    slug: "about",
    href: "/about",
    eyebrow: "About ElevenOrbits",
    title: "A managed operations company for infrastructure, AI systems, automation, support, and billing control.",
    description:
      "ElevenOrbits gives businesses a practical operating layer for services that normally become scattered across hosting accounts, payment tools, tickets, spreadsheets, and vendor inboxes.",
    summary:
      "The company is built around one idea: serious systems should have clear ownership after the sale. Customers should know where billing lives, who handles provisioning, where support history is recorded, and how changes move from request to completion.",
    sections: [
      {
        heading: "What We Manage",
        body: "ElevenOrbits manages hosted infrastructure, VPS and VDS environments, AI compute, workflow automation, Vicidial support, cybersecurity coverage, and customer support workflows. The portal connects those services to invoices, wallet funding, payment review, and recurring renewals.",
        points: [
          "Managed servers for production websites, business systems, and private applications.",
          "AI infrastructure, private model support, API access, and workflow automation.",
          "Vicidial, VoIP, and development support for operational teams.",
          "Billing, payment activity, support tickets, and service lifecycle records.",
        ],
      },
      {
        heading: "How We Work",
        body: "Every order is treated as a managed delivery request, not a raw checkout event. The customer selects a plan, leaves configuration notes, completes the payment flow, and the ElevenOrbits team handles review, provisioning, handoff, and support continuity.",
        points: [
          "Plans and add-ons are visible before checkout.",
          "Provisioning details remain attached to the account and subscription.",
          "Support conversations stay connected to the customer record.",
          "Renewals can use wallet balance and saved payment methods.",
        ],
      },
      {
        heading: "Who It Serves",
        body: "The service model is designed for teams that need dependable technical operations but do not want to manage separate vendors for hosting, automation, billing, AI deployment, and support coordination.",
        points: [
          "Founders and operators who need reliable hosted systems.",
          "Agencies managing client infrastructure and service continuity.",
          "Call centers running Vicidial or related VoIP operations.",
          "Teams adopting AI workflows without a full internal platform group.",
        ],
      },
    ],
    metrics: [
      { label: "Service Lanes", value: "6", detail: "Servers, AI, automation, VoIP, security, and support." },
      { label: "Portal Model", value: "1", detail: "Orders, billing, renewals, and support in one customer flow." },
      { label: "Operating Focus", value: "24/7", detail: "Managed service thinking around production systems." },
    ],
  },
  process: {
    slug: "process",
    href: "/process",
    eyebrow: "Delivery Process",
    title: "From service selection to handoff, ElevenOrbits keeps delivery structured and accountable.",
    description:
      "The process page explains how customers move from public service pages into configuration, checkout, provisioning, access delivery, support, billing, and renewal operations.",
    summary:
      "Most technical services fail at the transitions: sales to setup, setup to support, support to billing, and billing to renewal. ElevenOrbits keeps those transitions inside one managed process.",
    sections: [
      {
        heading: "1. Service Fit",
        body: "The public site explains service families, plan categories, and operational outcomes. Customers can compare managed servers, AI services, workflow automation, Vicidial support, cybersecurity, and development support before entering the portal.",
        points: [
          "Public pages explain the service category and use cases.",
          "Plans show pricing, features, and supported billing cycles.",
          "Contact-sales services route to the correct department before checkout.",
        ],
      },
      {
        heading: "2. Configuration",
        body: "The portal captures the choices needed for fulfillment: plan, billing cycle, region, storage, operating image, add-ons, and final deployment notes. This reduces back-and-forth after payment.",
        points: [
          "Configuration choices are tied to the order record.",
          "Deployment notes guide the provisioning team.",
          "Pricing summary updates before order creation.",
        ],
      },
      {
        heading: "3. Payment and Review",
        body: "Orders and wallet funding run through structured card billing flows. Card payments connect to invoices, wallet balances, and subscription status.",
        points: [
          "Card payments and wallet top-ups are confirmed through the payment provider.",
          "Wallet balance can support future renewals.",
          "Invoices and payment activity remain visible to the customer.",
        ],
      },
      {
        heading: "4. Provisioning and Handoff",
        body: "After review, the team provisions the service, records access details, adds operational notes, and connects the active service to ongoing support and billing records.",
        points: [
          "Credentials and service details are assigned after setup.",
          "Subscriptions show status and renewal information.",
          "Support tickets can reference the affected service directly.",
        ],
      },
      {
        heading: "5. Ongoing Operations",
        body: "The customer journey continues after launch. Support, renewals, billing, service notes, and account changes remain inside the portal instead of splitting across unrelated channels.",
        points: [
          "Support requests remain attached to customer history.",
          "Renewals can use wallet balance first, then payment fallback.",
          "Service updates and admin actions are tracked operationally.",
        ],
      },
    ],
    metrics: [
      { label: "Core Flow", value: "5", detail: "Fit, configure, pay, provision, operate." },
      { label: "Records", value: "Unified", detail: "Orders, payments, support, and subscriptions stay connected." },
      { label: "Handoff", value: "Managed", detail: "Access and operational notes are assigned after provisioning." },
    ],
  },
};

export const industryPages = [
  {
    slug: "saas-software-teams",
    title: "SaaS and Software Teams",
    eyebrow: "Industry",
    description:
      "Managed infrastructure and support for software teams that need hosted applications, predictable renewals, secure handoff, and reliable operational support.",
    fit: "Software teams need infrastructure that does not distract from product delivery. ElevenOrbits helps keep hosting, support, billing, and change coordination in one managed flow.",
    challenges: [
      "Production applications need monitoring, hardening, backups, and clear ownership.",
      "Small teams often lack dedicated operations coverage.",
      "Billing and support context gets lost when vendors are spread across tools.",
    ],
    outcomes: [
      "Managed VPS or VDS environments for product workloads.",
      "Support tickets connected to services and account history.",
      "Optional security and automation support as the product grows.",
      "Renewal and wallet handling through the customer portal.",
    ],
    recommended: ["Managed Servers", "Cybersecurity Services", "Workflow Automation"],
  },
  {
    slug: "call-centers-bpo",
    title: "Call Centers and BPO Operations",
    eyebrow: "Industry",
    description:
      "Vicidial, VoIP, server, support, and workflow assistance for call-center teams that depend on stable dialer and routing operations.",
    fit: "Call centers need reliable dialer systems and support pathways because downtime directly affects agents, campaigns, and revenue. ElevenOrbits supports the technical layer behind those operations.",
    challenges: [
      "Dialer problems affect agent productivity immediately.",
      "SIP, routing, queue, and server issues often overlap.",
      "Operations teams need recurring support rather than one-time fixes.",
    ],
    outcomes: [
      "Vicidial and Asterisk operational support.",
      "Managed server coverage for call-center infrastructure.",
      "Support workflow for recurring dialer and routing issues.",
      "Automation options for follow-up, reporting, and internal workflows.",
    ],
    recommended: ["VoIP and Vicidial Services", "Managed Servers", "Workflow Automation"],
  },
  {
    slug: "agencies-web-operations",
    title: "Agencies and Web Operations",
    eyebrow: "Industry",
    description:
      "Managed hosting, maintenance support, billing clarity, and structured service handling for agencies responsible for client websites and applications.",
    fit: "Agencies need reliable execution after launch. ElevenOrbits helps keep client environments managed while the agency focuses on delivery, communication, and growth.",
    challenges: [
      "Client sites often have inconsistent hosting setups.",
      "Support requests can arrive without context or service history.",
      "Renewals and payment confirmation can interrupt delivery work.",
    ],
    outcomes: [
      "Managed VPS and VDS options for client workloads.",
      "Support records attached to each customer account.",
      "Wallet and invoice flows for recurring service continuity.",
      "Security and maintenance add-ons for higher-value client retainers.",
    ],
    recommended: ["Managed Servers", "Development Support", "Cybersecurity Services"],
  },
  {
    slug: "ecommerce-service-businesses",
    title: "Ecommerce and Service Businesses",
    eyebrow: "Industry",
    description:
      "Managed hosting, security, uptime support, and workflow automation for businesses that depend on online transactions, forms, and customer operations.",
    fit: "Service businesses and ecommerce teams need the website, billing, support, and automation layer to keep working. ElevenOrbits provides managed operations around those systems.",
    challenges: [
      "Website and checkout downtime can stop revenue.",
      "Security updates and access control are easy to delay.",
      "Unstructured workflows create delays in support and fulfillment.",
    ],
    outcomes: [
      "Managed hosting for storefronts, portals, and business systems.",
      "Security hardening and monitoring support.",
      "Workflow automation for forms, notifications, and internal routing.",
      "Support and billing records managed in one portal.",
    ],
    recommended: ["Managed Servers", "Cybersecurity Services", "Workflow Automation"],
  },
  {
    slug: "ai-product-teams",
    title: "AI Product Teams",
    eyebrow: "Industry",
    description:
      "AI servers, private model deployment support, API operations, and automation guidance for teams turning AI ideas into managed systems.",
    fit: "AI product teams need more than model access. They need infrastructure, cost control, workflow integration, and a support path after deployment.",
    challenges: [
      "AI infrastructure can be costly and difficult to operate.",
      "Prototype workflows often lack monitoring and lifecycle ownership.",
      "Teams need practical integration with existing business systems.",
    ],
    outcomes: [
      "AI-ready infrastructure and managed server options.",
      "Workflow automation connected to APIs, forms, and business tools.",
      "Support for private model and managed API deployment paths.",
      "Operational handoff and support after launch.",
    ],
    recommended: ["AI Services", "Workflow Automation", "Managed Servers"],
  },
  {
    slug: "security-sensitive-teams",
    title: "Security-Sensitive Teams",
    eyebrow: "Industry",
    description:
      "Hardening, monitoring, patch coordination, access review, and incident readiness for businesses that need stronger operational security.",
    fit: "Security-sensitive teams need repeatable controls, not vague promises. ElevenOrbits helps define and operate the security baseline around hosted services.",
    challenges: [
      "Unpatched servers and weak access control create avoidable risk.",
      "Security findings need operational follow-through.",
      "Incident response requires records, ownership, and escalation paths.",
    ],
    outcomes: [
      "Server hardening and firewall review.",
      "Patch governance and access-control coordination.",
      "Security alert triage and incident support workflows.",
      "Executive summaries and higher-touch coverage on premium plans.",
    ],
    recommended: ["Cybersecurity Services", "Managed Servers", "Development Support"],
  },
];

export const resourcePages = [
  {
    slug: "managed-vps-buyers-guide",
    title: "Managed VPS Buyers Guide",
    eyebrow: "Guide",
    description:
      "A practical guide to choosing a managed VPS plan, including storage, region, operating image, billing cycle, support, and operational expectations.",
    intro:
      "A managed VPS should be evaluated by more than CPU and RAM. The real value is the operating support around it: provisioning, hardening, monitoring, backups, tickets, billing, and renewals.",
    sections: [
      {
        heading: "What to Compare",
        points: [
          "Base compute, storage type, region, and operating system image.",
          "Included management, monitoring, maintenance, and support scope.",
          "Backup expectations, security hardening, and access handoff.",
          "Renewal handling, wallet balance, invoices, and payment fallback.",
        ],
      },
      {
        heading: "When VPS Is Enough",
        points: [
          "Business websites, internal tools, small SaaS applications, and moderate traffic workloads.",
          "Teams that need a production server without dedicated infrastructure isolation.",
          "Projects where managed support matters more than raw dedicated resources.",
        ],
      },
      {
        heading: "When to Move to VDS",
        points: [
          "Workloads needing stronger isolation, steadier performance, or dedicated resource allocation.",
          "Business systems where noisy-neighbor risk should be reduced.",
          "Applications with more demanding storage, database, or traffic patterns.",
        ],
      },
    ],
  },
  {
    slug: "private-ai-deployment-checklist",
    title: "Private AI Deployment Checklist",
    eyebrow: "Checklist",
    description:
      "A readiness checklist for teams evaluating private AI infrastructure, model hosting, API access, workflow automation, and operational support.",
    intro:
      "Private AI deployments need clear requirements before hardware or API choices make sense. Start with workload shape, security needs, integration targets, and support expectations.",
    sections: [
      {
        heading: "Define the Workload",
        points: [
          "Clarify whether the system needs inference, training, fine-tuning, retrieval, agents, or workflow automation.",
          "Estimate request volume, latency expectations, model size, and concurrency.",
          "Identify whether data needs to stay private, regional, encrypted, or isolated.",
        ],
      },
      {
        heading: "Plan the Operating Layer",
        points: [
          "Decide who owns monitoring, prompt changes, failures, API keys, access, and cost review.",
          "Document how the AI system connects to CRMs, support desks, forms, databases, or internal APIs.",
          "Define how model or workflow changes move from request to production.",
        ],
      },
      {
        heading: "Prepare for Support",
        points: [
          "Create escalation paths for failed jobs, incorrect outputs, integration errors, and usage spikes.",
          "Keep deployment notes, credentials, billing, and support context in one customer record.",
          "Review data restrictions before sending sensitive information into any AI workflow.",
        ],
      },
    ],
  },
  {
    slug: "workflow-automation-readiness",
    title: "Workflow Automation Readiness Guide",
    eyebrow: "Guide",
    description:
      "How to prepare business processes for automation with n8n, APIs, webhooks, AI steps, human review, and support handoff.",
    intro:
      "Automation works best when the workflow is already understood. Before building, define triggers, decision points, exceptions, ownership, and success criteria.",
    sections: [
      {
        heading: "Map the Existing Process",
        points: [
          "List each trigger, input, approval, system, output, and exception.",
          "Identify which steps are rules-based and which require human judgment.",
          "Find data quality issues before automating bad handoffs.",
        ],
      },
      {
        heading: "Choose Integration Points",
        points: [
          "Confirm API access, webhooks, credentials, rate limits, and vendor restrictions.",
          "Decide whether AI should summarize, classify, draft, route, or enrich data.",
          "Keep sensitive credentials and regulated data out of unsafe channels.",
        ],
      },
      {
        heading: "Operate After Launch",
        points: [
          "Track failures, retries, alerts, and manual override paths.",
          "Assign ownership for changes when forms, APIs, teams, or business rules change.",
          "Document the workflow so support can understand what broke and why.",
        ],
      },
    ],
  },
  {
    slug: "vicidial-operations-checklist",
    title: "Vicidial Operations Checklist",
    eyebrow: "Checklist",
    description:
      "Operational checks for Vicidial and VoIP teams covering dialer health, SIP routing, queues, server resources, campaigns, and support readiness.",
    intro:
      "Call-center systems need recurring operational review because dialer, SIP, server, and campaign issues often overlap. A checklist keeps support focused.",
    sections: [
      {
        heading: "Daily Signals",
        points: [
          "Review agent login issues, call drops, carrier errors, queue delays, and campaign behavior.",
          "Check server resource pressure, disk usage, service status, and recent changes.",
          "Track whether issues affect one user, one campaign, one carrier, or the entire dialer.",
        ],
      },
      {
        heading: "Routing and Carrier Context",
        points: [
          "Keep SIP credentials, carrier contacts, trunk details, and route notes current.",
          "Document recent carrier, DID, queue, campaign, or firewall changes.",
          "Separate application behavior from upstream routing or carrier problems.",
        ],
      },
      {
        heading: "Support Readiness",
        points: [
          "Submit timestamps, caller IDs, campaign names, examples, and affected agents with support tickets.",
          "Keep access details and escalation contacts available for urgent troubleshooting.",
          "Review recurring issues for automation, configuration changes, or plan upgrades.",
        ],
      },
    ],
  },
  {
    slug: "server-security-hardening-baseline",
    title: "Server Security Hardening Baseline",
    eyebrow: "Baseline",
    description:
      "A practical baseline for server hardening, access control, patching, firewall rules, backups, monitoring, and incident readiness.",
    intro:
      "Security is not one control. It is a maintained baseline: access, patching, firewall, monitoring, backups, logging, and response ownership.",
    sections: [
      {
        heading: "Access Control",
        points: [
          "Use named access where possible and limit shared credentials.",
          "Remove unused users, keys, panels, ports, and old vendor access.",
          "Store credentials through approved secure channels and rotate after handoff events.",
        ],
      },
      {
        heading: "System Baseline",
        points: [
          "Keep operating system packages, panels, web servers, runtimes, and applications patched.",
          "Restrict firewall rules to required services and known administrative paths.",
          "Enable logging and monitor signals that indicate abuse, compromise, or resource exhaustion.",
        ],
      },
      {
        heading: "Recovery Planning",
        points: [
          "Define backup scope, retention, restore owner, and restore testing expectations.",
          "Keep DNS, registrar, application, database, and cloud access recoverable.",
          "Create an escalation path before an incident forces emergency decisions.",
        ],
      },
    ],
  },
  {
    slug: "billing-renewal-guide",
    title: "Billing and Renewal Guide",
    eyebrow: "Guide",
    description:
      "How ElevenOrbits billing, wallet balance, card payments, saved card fallback, invoices, renewals, and payment activity fit together.",
    intro:
      "The customer portal keeps billing and service continuity tied together. Wallet balance, invoices, subscriptions, saved cards, and renewal status all support ongoing service operations.",
    sections: [
      {
        heading: "Wallet and Renewals",
        points: [
          "Wallet balance can pay a new order invoice in full and can also be applied to recurring service charges.",
          "If wallet balance does not cover the full due amount, a saved card or another payment route may be needed.",
          "Customers should keep billing information and payment methods current before renewal dates.",
        ],
      },
      {
        heading: "Card Payments",
        points: [
          "Card payments are confirmed through the configured payment provider.",
          "New-order payments are collected in advance, reviewed before provisioning, and refunded through the original source when a request cannot be approved.",
          "Wallet top-ups and order payments appear in portal payment activity.",
          "Customers should keep saved card details current for renewal fallback billing.",
        ],
      },
      {
        heading: "Invoices and Support",
        points: [
          "Invoices record service charges and payment state.",
          "Billing questions should include invoice number, account email, date, amount, and payment reference.",
          `Billing support is available through the portal or ${siteConfig.billingEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "vps-migration-planning-guide",
    title: "VPS Migration Planning Guide",
    eyebrow: "Guide",
    description:
      "A practical migration guide for moving websites, applications, databases, DNS, email-adjacent services, and backups into a managed VPS environment.",
    intro:
      "A migration succeeds when the old environment, new server, data movement, DNS timing, access handoff, and rollback plan are understood before the cutover window opens.",
    relatedSlugs: ["managed-vps-buyers-guide", "server-security-hardening-baseline", "billing-renewal-guide", "workflow-automation-readiness"],
    sections: [
      {
        heading: "Inventory the Current Stack",
        points: [
          "List domains, DNS zones, application paths, databases, cron jobs, SSL certificates, and third-party integrations.",
          "Confirm what must move, what can be retired, and what should stay with the current provider.",
          "Capture panel access, SSH/SFTP access, database credentials, and registrar access before scheduling migration.",
        ],
      },
      {
        heading: "Prepare the Target VPS",
        points: [
          "Choose the operating image, web server stack, database version, PHP or runtime versions, and firewall baseline.",
          "Provision backups and monitoring before production traffic is moved.",
          "Stage the application on the new VPS and validate paths, permissions, services, and environment variables.",
        ],
      },
      {
        heading: "Plan Cutover and Rollback",
        points: [
          "Lower DNS TTL before migration when possible and document the final switch timing.",
          "Keep the old environment available until traffic, forms, payments, logins, and background jobs are verified.",
          "Define a rollback decision point before the migration window begins.",
        ],
      },
    ],
  },
  {
    slug: "delegate-access-handoff-guide",
    title: "Delegate Access Handoff Guide",
    eyebrow: "Guide",
    description:
      "How to prepare account access, delegate permissions, admin visibility, service credentials, and operational notes without routing secrets through ad hoc email.",
    intro:
      "Delegate access works best when each person has the right role, customer context, and service notes. The goal is controlled handoff without asking for unnecessary recipient emails during checkout.",
    relatedSlugs: ["billing-renewal-guide", "server-security-hardening-baseline", "managed-vps-buyers-guide", "vps-migration-planning-guide"],
    sections: [
      {
        heading: "Separate Account and Service Access",
        points: [
          "Keep billing ownership, service administration, and technical handoff as separate responsibilities.",
          "Use delegate access for people who need to review or act on customer services without owning the full account.",
          "Avoid sending credentials to random recipient emails when the portal can hold the operational record.",
        ],
      },
      {
        heading: "Prepare the Delegate Role",
        points: [
          "Confirm the delegate's business role, service scope, and whether they need billing, support, or technical visibility.",
          "Document what the delegate should be allowed to see before provisioning begins.",
          "Review delegate access after staff changes, completed migrations, or major support incidents.",
        ],
      },
      {
        heading: "Keep Handoff Auditable",
        points: [
          "Record service notes, IP details, credential status, and provisioning changes inside the managed customer record.",
          "Use support tickets for follow-up instead of scattering operational context across inboxes.",
          "Rotate credentials after emergency access, vendor changes, or completed temporary work.",
        ],
      },
    ],
  },
];

export const techStackGroups = [
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    subtitle: "Threat defense, monitoring, identity safeguards, and endpoint protection.",
    icon: "shield",
    partners: [
      { name: "RocketCyber", descriptor: "Security operations platform" },
      { name: "Datto EDR", logo: "https://cdn.simpleicons.org/datto/199ED9", descriptor: "Endpoint detection" },
      { name: "Datto MDR", logo: "https://cdn.simpleicons.org/datto/199ED9", descriptor: "Managed detection" },
      { name: "Kaseya SaaS Protection", wordmark: "Kaseya", descriptor: "SaaS protection" },
      { name: "Managed SOC", descriptor: "Security operations" },
      { name: "Kaseya Dark Web Monitoring", wordmark: "Kaseya", descriptor: "Dark web monitoring" },
    ],
  },
  {
    slug: "cloud-continuity",
    title: "Cloud & Continuity",
    subtitle: "Cloud infrastructure, backup, continuity planning, and resilient workload delivery.",
    icon: "cloud",
    partners: [
      { name: "Managed CDN", logo: "/partners/managed-cdn.svg", descriptor: "Edge delivery and image optimization" },
      { name: "O7 Bucket", logo: "/partners/object-storage.svg", descriptor: "S3-compatible bucket storage" },
      { name: "Nextcloud", logo: "/partners/nextcloud.svg", descriptor: "Private cloud collaboration" },
      { name: "Microsoft Azure", logo: "/partners/azure.svg", descriptor: "Cloud infrastructure" },
      { name: "Veeam", logo: "/partners/veeam.svg", descriptor: "Backup and recovery" },
      { name: "Kaseya", descriptor: "Business continuity tooling" },
      { name: "HP", logo: "/partners/hp.svg", descriptor: "Hardware ecosystem" },
      { name: "Velocity", descriptor: "Continuity services" },
    ],
  },
  {
    slug: "endpoint-management",
    title: "Endpoint Management",
    subtitle: "Device lifecycle, patching, inventory, backup, and operational endpoint baselines.",
    icon: "monitor",
    partners: [
      { name: "Datto", logo: "https://cdn.simpleicons.org/datto/199ED9", descriptor: "Endpoint management" },
      { name: "Kaseya", descriptor: "RMM operations" },
      { name: "Microsoft Intune", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", descriptor: "Device management" },
      { name: "Autotask", descriptor: "Service operations" },
    ],
  },
  {
    slug: "managed-it",
    title: "Managed IT & Helpdesk",
    subtitle: "Ticketing, documentation, service desk workflows, and support escalation.",
    icon: "headset",
    partners: [
      { name: "Datto", logo: "https://cdn.simpleicons.org/datto/199ED9", descriptor: "Service desk tooling" },
      { name: "IT Glue", descriptor: "Documentation" },
      { name: "Autotask", descriptor: "Ticketing and PSA" },
    ],
  },
  {
    slug: "ai-enablement",
    title: "AI Enablement",
    subtitle: "Custom-integrated AI workflows, browser automation, assistants, and model services.",
    icon: "brain",
    partners: [
      { name: "Hermes AI", logo: "/partners/hermes-ai.svg", descriptor: "Self-hosted agent hosting" },
      { name: "OpenClaw", logo: "/partners/openclaw.svg", descriptor: "Always-on assistant hosting" },
      { name: "Custom Workflows", descriptor: "Custom-integrated automations" },
      { name: "n8n", logo: "/partners/n8n.svg", descriptor: "Workflow orchestration" },
      { name: "Zapier", logo: "/partners/zapier.svg", descriptor: "App automation" },
      { name: "Make", logo: "https://cdn.simpleicons.org/make/6D00CC", descriptor: "Visual workflow automation" },
      { name: "Selenium", logo: "https://cdn.simpleicons.org/selenium/43B02A", descriptor: "Browser automation" },
      { name: "Playwright", descriptor: "Browser automation" },
      { name: "Claude", logo: "/partners/claude.svg", descriptor: "Assistant and model platform" },
      { name: "OpenAI", logo: "/partners/openai.svg", descriptor: "Model platform" },
      { name: "DeepSeek", logo: "/partners/deepseek.svg", descriptor: "Model integration" },
      { name: "Kimi", logo: "/partners/kimi.svg", descriptor: "Moonshot AI integration" },
      { name: "Qwen", logo: "https://cdn.simpleicons.org/qwen/000000", descriptor: "Chinese model integration" },
    ],
  },
  {
    slug: "ucaas",
    title: "UCaaS",
    subtitle: "Business calling, collaboration, meetings, and communications continuity.",
    icon: "phone",
    partners: [
      { name: "Nextiva", logo: "/partners/nextiva.svg", descriptor: "Business communications" },
      { name: "Zoom Phone", logo: "/partners/zoom-phone.svg", descriptor: "Cloud phone and meetings" },
      { name: "Google Voice", logo: "/partners/google-voice.svg", descriptor: "Google calling for teams" },
      { name: "Microsoft Teams", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", descriptor: "Collaboration and meetings" },
      { name: "Twilio", logo: "/partners/twilio.svg", descriptor: "Programmable voice and messaging" },
      { name: "Telnyx", logo: "/partners/telnyx.png", descriptor: "Carrier voice and SMS APIs" },
      { name: "VICIdial", logo: "/partners/vicidial.svg", descriptor: "Contact center dialer" },
      { name: "3CX", logo: "/partners/3cx.svg", descriptor: "Business phone system" },
      { name: "Zoiper", logo: "/partners/zoiper.svg", descriptor: "SIP softphone" },
      { name: "FreePBX", logo: "/partners/freepbx.svg", descriptor: "PBX administration" },
      { name: "Broadvoice", logo: "/partners/broadvoice.svg", descriptor: "Cloud business phone" },
    ],
  },
];

export const techStackHighlights = [
  { label: "Best of breed", value: "Category leaders vetted for business operations." },
  { label: "Integrated delivery", value: "Selected to work together across security, cloud, support, AI, and communications." },
  { label: "Future-proof", value: "Reviewed continuously as vendors, APIs, and service quality evolve." },
];

export const featuredTechPartners = [
  "Microsoft Azure",
  "Datto",
  "Veeam",
  "HP",
  "n8n",
  "Hermes AI",
  "OpenClaw",
  "Nextcloud",
  "VICIdial",
  "3CX",
  "Zoiper",
  "FreePBX",
  "Zapier",
  "OpenAI",
  "Claude",
  "DeepSeek",
  "Kimi",
  "Nextiva",
  "Zoom Phone",
  "Google Voice",
  "Microsoft Teams",
];

export const featuredPartnerLogos = [
  { name: "Microsoft Azure", logo: "/partners/azure.svg" },
  { name: "Datto", logo: "/partners/datto.svg" },
  { name: "Veeam", logo: "/partners/veeam.svg" },
  { name: "HP", logo: "/partners/hp.svg" },
  { name: "n8n", logo: "/partners/n8n.svg" },
  { name: "Hermes AI", logo: "/partners/hermes-ai.svg" },
  { name: "OpenClaw", logo: "/partners/openclaw.svg" },
  { name: "Nextcloud", logo: "/partners/nextcloud.svg" },
  { name: "VICIdial", logo: "/partners/vicidial.svg" },
  { name: "3CX", logo: "/partners/3cx.svg" },
  { name: "Zoiper", logo: "/partners/zoiper.svg" },
  { name: "FreePBX", logo: "/partners/freepbx.svg" },
  { name: "Zapier", logo: "/partners/zapier.svg" },
  { name: "OpenAI", logo: "/partners/openai.svg" },
  { name: "Claude", logo: "/partners/claude.svg" },
  { name: "DeepSeek", logo: "/partners/deepseek.svg" },
  { name: "Kimi", logo: "/partners/kimi.svg" },
  { name: "Nextiva", logo: "/partners/nextiva.svg" },
  { name: "Zoom Phone", logo: "/partners/zoom-phone.svg" },
  { name: "Google Voice", logo: "/partners/google-voice.svg" },
  { name: "Microsoft Teams", logo: "/partners/microsoft.svg" },
];

export function getCompanyPage(slug) {
  return companyPages[slug] || null;
}

export function getIndustryPage(slug) {
  return industryPages.find((page) => page.slug === slug) || null;
}

export function getResourcePage(slug) {
  return resourcePages.find((page) => page.slug === slug) || null;
}
