export const serviceIntakeVersion = 1;

const textLikeTypes = new Set(["text", "textarea", "url", "email"]);

const workloadOptions = [
  { value: "website", label: "Website / CMS", icon: "globe" },
  { value: "app", label: "Application", icon: "server" },
  { value: "database", label: "Database", icon: "database" },
  { value: "call_center", label: "Call center", icon: "phone-call" },
  { value: "automation", label: "Automation", icon: "workflow" },
  { value: "ai", label: "AI workload", icon: "bot" },
  { value: "backup", label: "Backup / archive", icon: "hard-drive" },
  { value: "other", label: "Other", icon: "settings" },
];

const serverBaseSections = [
  {
    id: "server-basics",
    title: "Server basics",
    description: "Core provisioning details for the managed server.",
    icon: "server",
    fields: [
      { key: "hostname", label: "Preferred hostname", type: "text", required: true, placeholder: "app01.example.com", icon: "server" },
      { key: "workload", label: "Primary workload", type: "select", required: true, options: workloadOptions, icon: "package" },
      { key: "publicDomain", label: "Domain or app URL", type: "text", placeholder: "example.com", icon: "globe" },
      { key: "expectedUsers", label: "Expected users or traffic", type: "text", placeholder: "50 staff users / 20k visits per month", icon: "users" },
    ],
  },
  {
    id: "server-operations",
    title: "Operations and access",
    description: "Access, firewall, backup, and migration notes.",
    icon: "shield",
    fields: [
      { key: "accessMethod", label: "Preferred access method", type: "select", required: true, options: [
        { value: "new_credentials", label: "Create new credentials", icon: "key" },
        { value: "existing_migration", label: "Migration from existing server", icon: "upload-cloud" },
        { value: "admin_contact", label: "Coordinate with admin contact", icon: "user" },
      ], icon: "key" },
      { key: "firewallPorts", label: "Required public ports", type: "text", placeholder: "80, 443, 22, 5060", icon: "shield" },
      { key: "backupNeed", label: "Backup requirement", type: "select", options: [
        { value: "standard", label: "Standard backups", icon: "hard-drive" },
        { value: "high_frequency", label: "High-frequency backups", icon: "refresh" },
        { value: "not_needed", label: "Not needed", icon: "x" },
      ], icon: "hard-drive" },
      { key: "migrationWindow", label: "Migration or launch window", type: "textarea", placeholder: "Preferred maintenance window, downtime limits, or launch date.", icon: "calendar" },
    ],
  },
];

const appHostingSections = [
  {
    id: "app-basics",
    title: "Application handoff",
    description: "Domain, users, and access expectations for the hosted app.",
    icon: "cloud",
    fields: [
      { key: "domain", label: "Domain or subdomain", type: "text", required: true, placeholder: "app.example.com", icon: "globe" },
      { key: "adminContact", label: "Admin contact", type: "email", required: true, placeholder: "admin@example.com", icon: "mail" },
      { key: "userCount", label: "Expected user count", type: "number", required: true, min: 1, suffix: "users", icon: "users" },
      { key: "useCase", label: "Main use case", type: "textarea", required: true, placeholder: "How this hosted app will be used by your team.", icon: "file-text" },
    ],
  },
  {
    id: "app-integrations",
    title: "Data and integrations",
    description: "Optional integration, import, and access policy details.",
    icon: "workflow",
    fields: [
      { key: "integrations", label: "Integrations needed", type: "textarea", placeholder: "SMTP, SSO, CRM, storage, webhooks, or API connections.", icon: "workflow" },
      { key: "migrationImport", label: "Migration or import needs", type: "textarea", placeholder: "Existing files, users, agents, prompts, or workspace data to import.", icon: "upload-cloud" },
      { key: "accessPolicy", label: "Access policy", type: "select", options: [
        { value: "private_team", label: "Private team access", icon: "lock" },
        { value: "public_app", label: "Public app endpoint", icon: "globe" },
        { value: "mixed", label: "Mixed public/private", icon: "shield" },
      ], icon: "lock" },
    ],
  },
];

export const serviceIntakeConfigs = {
  vps: {
    categorySlug: "vps",
    title: "Managed VPS requirements",
    description: "Tell us what this VPS needs to run and how it should be handed off.",
    logo: "/partners/managed-vps.svg",
    sections: serverBaseSections,
  },
  vds: {
    categorySlug: "vds",
    title: "Managed VDS requirements",
    description: "Tell us what this dedicated virtual environment needs to run.",
    logo: "/partners/managed-vds.svg",
    sections: serverBaseSections,
  },
  vicidial: {
    categorySlug: "vicidial",
    title: "VoIP and Vicidial requirements",
    description: "Capture the call-center, SIP, RVM, routing, and compliance context needed for delivery.",
    logo: "/partners/vicidial.svg",
    sections: [
      {
        id: "call-flow",
        title: "Call-center operation",
        description: "Define the calling model and campaign scope.",
        icon: "phone-call",
        fields: [
          { key: "callGoals", label: "Call direction and workload", type: "multiselect", required: true, options: [
            { value: "inbound", label: "Inbound", icon: "phone-incoming" },
            { value: "outbound", label: "Outbound", icon: "phone-outgoing" },
            { value: "blended", label: "Blended", icon: "repeat" },
            { value: "rvm", label: "RVM", icon: "voicemail" },
          ], icon: "phone-call" },
          { key: "currentSetup", label: "Current setup", type: "select", required: true, options: [
            { value: "new_setup", label: "New setup", icon: "plus" },
            { value: "existing_vicidial", label: "Existing Vicidial", logo: "/partners/vicidial.svg" },
            { value: "other_platform", label: "Other dialer / PBX", icon: "phone" },
          ], icon: "settings" },
          { key: "agentCount", label: "Expected active agents", type: "number", required: true, min: 1, suffix: "agents", icon: "headphones" },
          { key: "campaignCount", label: "Campaigns or queues", type: "number", min: 0, suffix: "campaigns", icon: "list-checks" },
          { key: "primaryRegion", label: "Primary country and timezone", type: "text", required: true, placeholder: "US Eastern, UK, Pakistan, etc.", icon: "globe" },
        ],
      },
      {
        id: "sip-routing",
        title: "SIP, numbers, and routing",
        description: "Carrier, DID, IVR, routing, and recording requirements.",
        icon: "route",
        fields: [
          { key: "sipCarrierStatus", label: "SIP carrier status", type: "select", required: true, options: [
            { value: "have_carrier", label: "We already have SIP/trunks", icon: "check" },
            { value: "need_carrier_guidance", label: "Need carrier guidance", logo: "/partners/twilio.svg" },
            { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
          ], icon: "route" },
          { key: "didNumbers", label: "DID numbers or caller IDs", type: "textarea", placeholder: "Existing DIDs, desired area codes, toll-free numbers, or caller ID rules.", icon: "hash" },
          { key: "inboundRouting", label: "Inbound routing / IVR", type: "textarea", placeholder: "Queues, menus, office hours, overflow, voicemail, and escalation routing.", icon: "git-branch" },
          { key: "outboundDialing", label: "Outbound dialing mode", type: "select", options: [
            { value: "manual", label: "Manual / preview", icon: "mouse-pointer" },
            { value: "progressive", label: "Progressive", icon: "step-forward" },
            { value: "predictive", label: "Predictive", icon: "gauge" },
            { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
          ], icon: "phone-outgoing" },
          { key: "rvmUseCase", label: "RVM use case", type: "textarea", placeholder: "Audience, message volume, opt-out handling, and campaign timing.", icon: "voicemail" },
        ],
      },
      {
        id: "compliance-integrations",
        title: "Compliance and integrations",
        description: "Recording, CRM, reporting, and migration details.",
        icon: "shield",
        fields: [
          { key: "recordingNeed", label: "Call recording", type: "select", options: [
            { value: "all_calls", label: "Record all calls", icon: "radio" },
            { value: "selective", label: "Selective recording", icon: "sliders" },
            { value: "not_needed", label: "Not needed", icon: "x" },
          ], icon: "radio" },
          { key: "crmIntegration", label: "CRM or webhook integration", type: "textarea", placeholder: "CRM, ticketing, webhook, API, or lead source integrations.", icon: "workflow" },
          { key: "complianceNotes", label: "Compliance notes", type: "textarea", placeholder: "TCPA, DNC, consent, opt-out, recording disclosure, or region-specific rules.", icon: "shield" },
          { key: "reportingNeeds", label: "Reporting needs", type: "textarea", placeholder: "Agent stats, campaign reports, QA exports, call recordings, or dashboard needs.", icon: "bar-chart" },
          { key: "migrationWindow", label: "Migration or rollout window", type: "textarea", placeholder: "Preferred go-live date, downtime limits, and known issues.", icon: "calendar" },
        ],
      },
    ],
  },
  "ai-servers": {
    categorySlug: "ai-servers",
    title: "AI server requirements",
    description: "Define the AI workload, model, usage, and data sensitivity.",
    logo: "/partners/ai-server.svg",
    sections: [
      {
        id: "ai-workload",
        title: "Workload",
        description: "Core model and compute requirements.",
        icon: "bot",
        fields: [
          { key: "workloadType", label: "Workload type", type: "select", required: true, options: [
            { value: "inference", label: "Inference/API serving", icon: "bot" },
            { value: "training", label: "Training/fine-tuning", icon: "brain" },
            { value: "rag", label: "RAG/search", icon: "database" },
            { value: "experimentation", label: "Experimentation", icon: "flask" },
          ], icon: "bot" },
          { key: "modelProvider", label: "Model/provider", type: "text", required: true, placeholder: "Llama, DeepSeek, Qwen, OpenAI-compatible, custom model", icon: "brain" },
          { key: "expectedUsage", label: "Expected usage", type: "text", required: true, placeholder: "Requests/day, users, tokens, or batch schedule", icon: "activity" },
          { key: "dataSensitivity", label: "Data sensitivity", type: "select", required: true, options: [
            { value: "public", label: "Public/non-sensitive", icon: "globe" },
            { value: "internal", label: "Internal business data", icon: "briefcase" },
            { value: "regulated", label: "Sensitive/regulated", icon: "lock" },
          ], icon: "lock" },
        ],
      },
      {
        id: "ai-deployment",
        title: "Deployment details",
        description: "Optional framework, keys, and rollout notes.",
        icon: "cloud",
        fields: [
          { key: "framework", label: "Framework/runtime", type: "text", placeholder: "vLLM, Ollama, Docker, Python, CUDA stack", icon: "terminal" },
          { key: "apiKeyHandoff", label: "API key handoff", type: "select", options: [
            { value: "customer_provides", label: "Customer provides keys", icon: "key" },
            { value: "elevenorbits_managed", label: "ElevenOrbits managed keys", icon: "shield" },
            { value: "not_needed", label: "No external keys", icon: "x" },
          ], icon: "key" },
          { key: "rolloutNotes", label: "Rollout notes", type: "textarea", placeholder: "Deployment deadline, test plan, access needs, or integration notes.", icon: "file-text" },
        ],
      },
    ],
  },
  workflows: {
    categorySlug: "workflows",
    title: "Workflow automation requirements",
    description: "Define the automation goal, systems, trigger, and handoff expectations.",
    logo: "/partners/n8n.svg",
    sections: [
      {
        id: "workflow-basics",
        title: "Automation scope",
        description: "The business process and systems involved.",
        icon: "workflow",
        fields: [
          { key: "automationGoal", label: "Automation goal", type: "textarea", required: true, placeholder: "What should happen automatically?", icon: "workflow" },
          { key: "sourceApps", label: "Source apps", type: "text", required: true, placeholder: "CRM, form, email, database, webhook", icon: "upload-cloud" },
          { key: "destinationApps", label: "Destination apps", type: "text", required: true, placeholder: "Ticketing, CRM, Slack, email, database", icon: "download-cloud" },
          { key: "triggerType", label: "Trigger type", type: "select", required: true, options: [
            { value: "webhook", label: "Webhook/API", icon: "webhook" },
            { value: "schedule", label: "Schedule", icon: "calendar" },
            { value: "manual", label: "Manual approval", icon: "mouse-pointer" },
            { value: "app_event", label: "App event", icon: "zap" },
          ], icon: "zap" },
        ],
      },
      {
        id: "workflow-controls",
        title: "Controls",
        description: "Credentials, approvals, and error handling.",
        icon: "shield",
        fields: [
          { key: "credentialsOwner", label: "Credentials owner", type: "select", options: [
            { value: "customer", label: "Customer provides credentials", icon: "key" },
            { value: "elevenorbits", label: "ElevenOrbits manages credentials", icon: "shield" },
            { value: "mixed", label: "Mixed", icon: "users" },
          ], icon: "key" },
          { key: "approvalSteps", label: "Approval steps", type: "textarea", placeholder: "Any human review, manager approval, or exception handling.", icon: "check-square" },
          { key: "errorHandling", label: "Error handling", type: "textarea", placeholder: "Who should be alerted and what should happen when automation fails?", icon: "alert-triangle" },
        ],
      },
    ],
  },
  "ai-solutions": {
    categorySlug: "ai-solutions",
    title: "AI solution requirements",
    description: "Define the AI product, users, data, and operational expectations.",
    logo: "/partners/openai.svg",
    sections: [
      {
        id: "solution-basics",
        title: "Solution scope",
        description: "What the AI solution needs to do.",
        icon: "brain",
        fields: [
          { key: "solutionGoal", label: "Solution goal", type: "textarea", required: true, placeholder: "Describe the AI outcome or assistant behavior.", icon: "brain" },
          { key: "targetUsers", label: "Target users", type: "text", required: true, placeholder: "Internal staff, customers, support agents, sales team", icon: "users" },
          { key: "modelPreference", label: "Model/provider preference", type: "text", required: true, placeholder: "OpenAI, Claude, DeepSeek, private model, not sure", icon: "bot" },
          { key: "dataSensitivity", label: "Data sensitivity", type: "select", required: true, options: [
            { value: "public", label: "Public/non-sensitive", icon: "globe" },
            { value: "internal", label: "Internal business data", icon: "briefcase" },
            { value: "regulated", label: "Sensitive/regulated", icon: "lock" },
          ], icon: "lock" },
        ],
      },
      {
        id: "solution-integrations",
        title: "Integrations",
        description: "Tools, data sources, and rollout context.",
        icon: "workflow",
        fields: [
          { key: "dataSources", label: "Data sources", type: "textarea", placeholder: "Docs, databases, websites, spreadsheets, CRM, tickets, APIs.", icon: "database" },
          { key: "integrations", label: "Integrations", type: "textarea", placeholder: "Apps, APIs, webhooks, user portal, or internal systems.", icon: "workflow" },
          { key: "successCriteria", label: "Success criteria", type: "textarea", placeholder: "How should we know the AI solution is working?", icon: "check-circle" },
        ],
      },
    ],
  },
  "development-support": {
    categorySlug: "development-support",
    title: "Development support requirements",
    description: "Tell us what kind of technical execution or support you need.",
    logo: "/partners/dev-support.svg",
    sections: [
      {
        id: "support-scope",
        title: "Support scope",
        description: "Goal, stack, urgency, and access context.",
        icon: "life-buoy",
        fields: [
          { key: "supportGoal", label: "Support goal", type: "textarea", required: true, placeholder: "What do you need help with?", icon: "life-buoy" },
          { key: "stackContext", label: "Stack or repo context", type: "text", required: true, placeholder: "Next.js, Laravel, WordPress, Node, Python, etc.", icon: "code" },
          { key: "urgency", label: "Urgency", type: "select", required: true, options: [
            { value: "standard", label: "Standard", icon: "clock" },
            { value: "soon", label: "Soon", icon: "timer" },
            { value: "urgent", label: "Urgent production issue", icon: "alert-triangle" },
          ], icon: "timer" },
          { key: "accessMethod", label: "Access method", type: "select", options: [
            { value: "github", label: "GitHub/Git", icon: "git-branch" },
            { value: "ticket", label: "Ticket/request only", icon: "life-buoy" },
            { value: "screen_share", label: "Screen share", icon: "monitor" },
            { value: "other", label: "Other", icon: "settings" },
          ], icon: "key" },
        ],
      },
      {
        id: "support-process",
        title: "Process",
        description: "Deployment, PM tools, and schedule preferences.",
        icon: "calendar",
        fields: [
          { key: "deploymentProcess", label: "Deployment process", type: "textarea", placeholder: "How changes are tested, approved, and deployed.", icon: "upload-cloud" },
          { key: "projectTool", label: "Ticketing or PM tool", type: "text", placeholder: "Jira, GitHub Issues, Trello, email, etc.", icon: "clipboard-list" },
          { key: "preferredSchedule", label: "Preferred schedule", type: "textarea", placeholder: "Working hours, maintenance windows, meeting cadence.", icon: "calendar" },
        ],
      },
    ],
  },
  cybersecurity: {
    categorySlug: "cybersecurity",
    title: "Cybersecurity requirements",
    description: "Capture the assets, risk, timing, and compliance context.",
    logo: "/partners/cybersecurity.svg",
    sections: [
      {
        id: "security-basics",
        title: "Security scope",
        description: "Assets and desired outcome.",
        icon: "shield",
        fields: [
          { key: "assetType", label: "Asset type", type: "select", required: true, options: [
            { value: "server", label: "Server/infrastructure", icon: "server" },
            { value: "website", label: "Website/app", icon: "globe" },
            { value: "endpoint", label: "Endpoints/devices", icon: "monitor" },
            { value: "network", label: "Network", icon: "network" },
          ], icon: "shield" },
          { key: "securityGoal", label: "Current risk or need", type: "textarea", required: true, placeholder: "Hardening, monitoring, incident concern, audit prep, etc.", icon: "alert-triangle" },
          { key: "targetSystems", label: "Target systems", type: "textarea", required: true, placeholder: "Domains, IPs, apps, servers, endpoints, or cloud accounts.", icon: "target" },
          { key: "scanWindow", label: "Preferred scan/change window", type: "text", placeholder: "After hours, weekend, timezone, or flexible.", icon: "calendar" },
        ],
      },
      {
        id: "security-context",
        title: "Compliance and tools",
        description: "Optional current controls and compliance context.",
        icon: "lock",
        fields: [
          { key: "compliance", label: "Compliance requirement", type: "text", placeholder: "PCI, HIPAA, SOC 2, GDPR, internal policy, none.", icon: "file-check" },
          { key: "currentTools", label: "Current tools", type: "textarea", placeholder: "WAF, EDR, SIEM, backups, monitoring, firewall, scanner.", icon: "wrench" },
          { key: "incidentConcern", label: "Incident concerns", type: "textarea", placeholder: "Suspicious activity, malware, exposed ports, abuse reports, etc.", icon: "alert-triangle" },
        ],
      },
    ],
  },
  cdn: {
    categorySlug: "cdn",
    title: "CDN requirements",
    description: "Define the origin, domain, content, and cache behavior.",
    logo: "/partners/managed-cdn.svg",
    sections: [
      {
        id: "cdn-basics",
        title: "CDN setup",
        description: "Origin and delivery targets.",
        icon: "cloud",
        fields: [
          { key: "originDomain", label: "Origin domain or URL", type: "text", required: true, placeholder: "origin.example.com", icon: "server" },
          { key: "targetDomain", label: "CDN/custom domain", type: "text", required: true, placeholder: "cdn.example.com", icon: "globe" },
          { key: "contentType", label: "Content type", type: "select", required: true, options: [
            { value: "website_assets", label: "Website assets", icon: "image" },
            { value: "images_video", label: "Images/video", icon: "image" },
            { value: "downloads", label: "Downloads/files", icon: "download-cloud" },
            { value: "app_api", label: "App/API", icon: "code" },
          ], icon: "image" },
          { key: "cachingGoal", label: "Caching goal", type: "textarea", required: true, placeholder: "What should be cached and what should stay dynamic?", icon: "gauge" },
        ],
      },
      {
        id: "cdn-rules",
        title: "Rules and protection",
        description: "SSL, bypass paths, and protection notes.",
        icon: "shield",
        fields: [
          { key: "sslStatus", label: "SSL status", type: "select", options: [
            { value: "existing", label: "Existing certificate", icon: "lock" },
            { value: "need_setup", label: "Need SSL setup", icon: "key" },
            { value: "not_sure", label: "Not sure", icon: "help-circle" },
          ], icon: "lock" },
          { key: "bypassPaths", label: "Cache bypass paths", type: "textarea", placeholder: "/admin, /cart, /api, authenticated pages, etc.", icon: "route" },
          { key: "protectionNotes", label: "WAF / DDoS notes", type: "textarea", placeholder: "Threat concerns, bot traffic, firewall rules, country blocks.", icon: "shield" },
        ],
      },
    ],
  },
  "object-storage": {
    categorySlug: "object-storage",
    title: "O7 Bucket requirements",
    description: "Define capacity, S3 API access, gated access, CORS, and custom domain needs.",
    logo: "/partners/object-storage.svg",
    sections: [
      {
        id: "bucket-basics",
        title: "Bucket basics",
        description: "Use case, capacity, and access style.",
        icon: "database",
        fields: [
          { key: "bucketUseCase", label: "Bucket use case", type: "select", required: true, options: [
            { value: "app_storage", label: "Application storage", icon: "package" },
            { value: "media_assets", label: "Media/assets", icon: "image" },
            { value: "backups", label: "Backups", icon: "hard-drive" },
            { value: "datasets", label: "AI/data sets", icon: "database" },
            { value: "archive", label: "Archive", icon: "archive" },
          ], icon: "database" },
          { key: "estimatedGb", label: "Estimated monthly capacity", type: "number", required: true, min: 1, suffix: "GB", icon: "hard-drive" },
          { key: "accessStyle", label: "Access style", type: "multiselect", required: true, options: [
            { value: "s3_api", label: "S3 API", icon: "code" },
            { value: "gated_private", label: "Gated/private", icon: "lock" },
            { value: "public_custom_domain", label: "Public/custom domain", icon: "globe" },
          ], icon: "key" },
          { key: "customDomain", label: "Custom domain", type: "text", placeholder: "files.example.com", icon: "globe" },
        ],
      },
      {
        id: "bucket-access",
        title: "CORS and credentials",
        description: "Developer access and browser policy details.",
        icon: "code",
        fields: [
          { key: "corsOrigins", label: "CORS origins", type: "textarea", placeholder: "https://app.example.com, https://admin.example.com", icon: "globe" },
          { key: "allowedMethods", label: "Allowed API methods", type: "multiselect", options: [
            { value: "get", label: "GET", icon: "download-cloud" },
            { value: "put", label: "PUT", icon: "upload-cloud" },
            { value: "post", label: "POST", icon: "plus" },
            { value: "delete", label: "DELETE", icon: "trash" },
            { value: "list", label: "LIST", icon: "list" },
          ], icon: "code" },
          { key: "lifecycleNotes", label: "Lifecycle or retention notes", type: "textarea", placeholder: "Retention, archival, backup, or cleanup rules.", icon: "calendar" },
        ],
      },
    ],
  },
  "hermes-ai-hosting": {
    categorySlug: "hermes-ai-hosting",
    title: "Hermes AI hosting requirements",
    description: "Tell us how the Hermes agent should be hosted and handed off.",
    logo: "/partners/hermes-ai.svg",
    sections: appHostingSections,
  },
  "openclaw-hosting": {
    categorySlug: "openclaw-hosting",
    title: "OpenClaw hosting requirements",
    description: "Tell us how the OpenClaw assistant should be hosted and integrated.",
    logo: "/partners/openclaw.svg",
    sections: appHostingSections,
  },
  "nextcloud-hosting": {
    categorySlug: "nextcloud-hosting",
    title: "Nextcloud hosting requirements",
    description: "Tell us how the private collaboration cloud should be hosted and handed off.",
    logo: "/partners/nextcloud.svg",
    sections: appHostingSections,
  },
};

export function getServiceIntakeConfig(categorySlug) {
  return serviceIntakeConfigs[String(categorySlug || "")] || null;
}

export function getServiceIntakeFields(categorySlug) {
  const config = getServiceIntakeConfig(categorySlug);
  return (config?.sections || []).flatMap((section) =>
    (section.fields || []).map((field) => ({
      ...field,
      sectionId: section.id,
      sectionTitle: section.title,
    })),
  );
}

function isEmptyValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value === undefined || value === null) {
    return true;
  }
  return String(value).trim() === "";
}

function normalizeAnswerValue(field, value) {
  if (isEmptyValue(value)) {
    return field.type === "multiselect" ? [] : "";
  }

  if (field.type === "multiselect") {
    const values = Array.isArray(value) ? value : [value];
    return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  if (field.type === "number") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : value;
  }

  if (textLikeTypes.has(field.type) || field.type === "select" || field.type === "segmented") {
    return String(value || "").trim();
  }

  return value;
}

function optionLabel(field, value) {
  return (field.options || []).find((option) => option.value === value)?.label || String(value || "");
}

export function formatServiceIntakeValue(field, value) {
  if (isEmptyValue(value)) {
    return "";
  }

  if (field.type === "multiselect") {
    return (Array.isArray(value) ? value : [value])
      .map((item) => optionLabel(field, item))
      .filter(Boolean)
      .join(", ");
  }

  if (field.type === "select" || field.type === "segmented") {
    return optionLabel(field, value);
  }

  if (field.type === "number") {
    return `${value}${field.suffix ? ` ${field.suffix}` : ""}`;
  }

  return String(value || "").trim();
}

export function validateServiceIntakeAnswers(categorySlug, rawAnswers = {}, { categoryName = "" } = {}) {
  const config = getServiceIntakeConfig(categorySlug);
  if (!config) {
    return {
      ok: true,
      errors: {},
      configuration: null,
    };
  }

  const answers = rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers) ? rawAnswers : {};
  const fields = getServiceIntakeFields(categorySlug);
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const errors = {};

  Object.entries(answers).forEach(([key, value]) => {
    if (!fieldsByKey.has(key) && !isEmptyValue(value)) {
      errors[key] = "This field is not valid for the selected service.";
    }
  });

  const normalizedAnswers = {};
  fields.forEach((field) => {
    const value = normalizeAnswerValue(field, answers[field.key]);
    normalizedAnswers[field.key] = value;

    if (field.required && isEmptyValue(value)) {
      errors[field.key] = `${field.label} is required.`;
      return;
    }

    if (isEmptyValue(value)) {
      return;
    }

    if (field.type === "number") {
      if (!Number.isFinite(Number(value))) {
        errors[field.key] = `${field.label} must be a number.`;
        return;
      }
      if (field.min !== undefined && Number(value) < Number(field.min)) {
        errors[field.key] = `${field.label} must be at least ${field.min}.`;
        return;
      }
      if (field.max !== undefined && Number(value) > Number(field.max)) {
        errors[field.key] = `${field.label} must be ${field.max} or less.`;
        return;
      }
    }

    if (["select", "segmented"].includes(field.type)) {
      const optionValues = new Set((field.options || []).map((option) => option.value));
      if (optionValues.size && !optionValues.has(value)) {
        errors[field.key] = `${field.label} has an invalid selection.`;
      }
    }

    if (field.type === "multiselect") {
      const optionValues = new Set((field.options || []).map((option) => option.value));
      const invalid = (Array.isArray(value) ? value : [value]).some((item) => !optionValues.has(item));
      if (optionValues.size && invalid) {
        errors[field.key] = `${field.label} includes an invalid selection.`;
      }
    }
  });

  const sections = (config.sections || [])
    .map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      fields: (section.fields || [])
        .map((field) => {
          const value = normalizedAnswers[field.key];
          const displayValue = formatServiceIntakeValue(field, value);
          if (!displayValue) {
            return null;
          }
          return {
            key: field.key,
            label: field.label,
            type: field.type,
            value,
            displayValue,
            required: Boolean(field.required),
          };
        })
        .filter(Boolean),
    }))
    .filter((section) => section.fields.length);

  const summary = sections.flatMap((section) =>
    section.fields.map((field) => ({
      label: field.label,
      value: field.displayValue,
      sectionId: section.id,
      sectionTitle: section.title,
      key: field.key,
    })),
  );

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    configuration: {
      version: serviceIntakeVersion,
      categorySlug: config.categorySlug,
      categoryName: categoryName || config.title,
      title: config.title,
      sections,
      answers: normalizedAnswers,
      summary,
    },
  };
}
