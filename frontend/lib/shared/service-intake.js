export const serviceIntakeVersion = 2;

const textLikeTypes = new Set(["text", "textarea", "url", "email"]);

const workloadOptions = [
  { value: "website", label: "Website / CMS", icon: "globe" },
  { value: "app", label: "Application", icon: "server" },
  { value: "database", label: "Database", icon: "database" },
  { value: "call_center", label: "Call center", icon: "phone-call" },
  { value: "automation", label: "Automation", logo: "/partners/n8n.svg" },
  { value: "ai", label: "AI workload", logo: "/partners/openai.svg" },
  { value: "backup", label: "Backup / archive", icon: "hard-drive" },
  { value: "other", label: "Other", icon: "settings" },
];

const capacityOptions = [
  { value: "small", label: "Small", description: "Light usage or early-stage workload.", icon: "users" },
  { value: "team", label: "Team", description: "Regular internal team usage.", icon: "users" },
  { value: "business", label: "Business", description: "Production usage with steady traffic.", icon: "activity" },
  { value: "high", label: "High capacity", description: "Heavy traffic, many users, or bursty demand.", icon: "gauge" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const scheduleOptions = [
  { value: "asap", label: "As soon as approved", icon: "timer" },
  { value: "business_hours", label: "Business hours", icon: "calendar" },
  { value: "after_hours", label: "After hours", icon: "calendar" },
  { value: "weekend", label: "Weekend window", icon: "calendar" },
  { value: "scheduled_later", label: "Schedule later", icon: "calendar" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const portProfileOptions = [
  { value: "web", label: "Web traffic", description: "HTTP/HTTPS public access.", icon: "globe" },
  { value: "ssh_admin", label: "SSH admin", description: "Restricted shell access.", icon: "terminal" },
  { value: "rdp_admin", label: "RDP admin", description: "Windows remote access.", icon: "monitor" },
  { value: "sip_rtp", label: "SIP/RTP voice", description: "VoIP signaling and media.", icon: "phone-call" },
  { value: "database_private", label: "Private database", description: "Database access kept private.", icon: "database" },
  { value: "vpn_only", label: "VPN only", description: "No broad public admin ports.", icon: "lock" },
];

const appUseCaseOptions = [
  { value: "team_workspace", label: "Team workspace", icon: "users" },
  { value: "private_cloud", label: "Private cloud", logo: "/partners/nextcloud.svg" },
  { value: "ai_assistant", label: "AI assistant", logo: "/partners/openclaw.svg" },
  { value: "automation_console", label: "Automation console", logo: "/partners/n8n.svg" },
  { value: "customer_portal", label: "Customer portal", icon: "globe" },
  { value: "internal_tool", label: "Internal tool", icon: "briefcase" },
];

const integrationOptions = [
  { value: "smtp_email", label: "SMTP/email", icon: "mail" },
  { value: "sso", label: "SSO", logo: "/partners/microsoft.svg" },
  { value: "crm", label: "CRM", icon: "briefcase" },
  { value: "webhook_api", label: "Webhook/API", icon: "webhook" },
  { value: "object_storage", label: "Object storage", logo: "/partners/object-storage.svg" },
  { value: "github", label: "GitHub", logo: "/partners/github.svg" },
  { value: "none", label: "No integration yet", icon: "x" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const migrationImportOptions = [
  { value: "none", label: "No import needed", icon: "x" },
  { value: "files", label: "Files or media", icon: "upload-cloud" },
  { value: "users", label: "Users or teams", icon: "users" },
  { value: "database", label: "Database import", icon: "database" },
  { value: "workspace", label: "Workspace data", icon: "package" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
];

const regionTimezoneOptions = [
  { value: "north_america", label: "North America", description: "US/Canada time zones.", icon: "globe" },
  { value: "uk_europe", label: "UK / Europe", icon: "globe" },
  { value: "pakistan_asia", label: "Pakistan / Asia", icon: "globe" },
  { value: "middle_east", label: "Middle East", icon: "globe" },
  { value: "australia", label: "Australia / Pacific", icon: "globe" },
  { value: "global", label: "Global coverage", icon: "globe" },
];

const didNumberOptions = [
  { value: "none_needed", label: "No numbers needed", icon: "x" },
  { value: "have_numbers", label: "Existing numbers", icon: "check" },
  { value: "need_local", label: "Need local numbers", icon: "phone" },
  { value: "need_toll_free", label: "Need toll-free numbers", icon: "phone-call" },
  { value: "caller_id_rules", label: "Caller ID rules", icon: "shield" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const inboundRoutingOptions = [
  { value: "simple_queue", label: "Simple queue", icon: "phone-incoming" },
  { value: "ivr_menu", label: "IVR menu", icon: "git-branch" },
  { value: "office_hours", label: "Office-hours routing", icon: "calendar" },
  { value: "overflow", label: "Overflow routing", icon: "route" },
  { value: "voicemail", label: "Voicemail", icon: "voicemail" },
  { value: "escalation", label: "Escalation path", icon: "step-forward" },
];

const rvmUseCaseOptions = [
  { value: "not_needed", label: "No RVM", icon: "x" },
  { value: "reminders", label: "Reminders", icon: "calendar" },
  { value: "lead_followup", label: "Lead follow-up", icon: "phone-outgoing" },
  { value: "notifications", label: "Notifications", icon: "voicemail" },
  { value: "winback", label: "Win-back campaign", icon: "repeat" },
];

const crmIntegrationOptions = [
  { value: "none", label: "No CRM integration", icon: "x" },
  { value: "crm_sync", label: "CRM sync", icon: "briefcase" },
  { value: "webhook_api", label: "Webhook/API", icon: "webhook" },
  { value: "ticketing", label: "Ticketing", icon: "life-buoy" },
  { value: "lead_source", label: "Lead source", icon: "upload-cloud" },
  { value: "custom", label: "Custom integration", icon: "settings" },
];

const complianceOptions = [
  { value: "tcpa", label: "TCPA", icon: "shield" },
  { value: "dnc", label: "DNC checks", icon: "shield" },
  { value: "consent", label: "Consent tracking", icon: "check-square" },
  { value: "recording_disclosure", label: "Recording disclosure", icon: "radio" },
  { value: "opt_out", label: "Opt-out handling", icon: "x" },
  { value: "none", label: "No special requirement", icon: "check" },
];

const reportingOptions = [
  { value: "agent_stats", label: "Agent stats", icon: "bar-chart" },
  { value: "campaign_reports", label: "Campaign reports", icon: "clipboard-list" },
  { value: "qa_exports", label: "QA exports", icon: "file-check" },
  { value: "recordings", label: "Recording access", icon: "radio" },
  { value: "dashboard", label: "Dashboard", icon: "monitor" },
  { value: "none", label: "Basic reporting only", icon: "check" },
];

const modelProviderOptions = [
  { value: "openai", label: "OpenAI-compatible", logo: "/partners/openai.svg" },
  { value: "deepseek", label: "DeepSeek", logo: "/partners/deepseek.svg" },
  { value: "claude", label: "Claude", logo: "/partners/claude.svg" },
  { value: "kimi", label: "Kimi", logo: "/partners/kimi.svg" },
  { value: "llama", label: "Llama / open model", icon: "bot" },
  { value: "qwen", label: "Qwen", icon: "brain" },
  { value: "custom", label: "Custom model", icon: "settings" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const aiUsageOptions = [
  { value: "light_api", label: "Light API traffic", icon: "activity" },
  { value: "steady_business", label: "Steady business use", icon: "briefcase" },
  { value: "batch_jobs", label: "Batch jobs", icon: "database" },
  { value: "high_throughput", label: "High throughput", icon: "gauge" },
  { value: "gpu_heavy", label: "GPU-heavy processing", icon: "server" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const frameworkOptions = [
  { value: "docker", label: "Docker", logo: "/partners/docker.svg" },
  { value: "kubernetes", label: "Kubernetes", logo: "/partners/kubernetes.svg" },
  { value: "vllm", label: "vLLM", icon: "terminal" },
  { value: "ollama", label: "Ollama", icon: "bot" },
  { value: "cuda", label: "CUDA/GPU stack", icon: "server" },
  { value: "openai_api", label: "OpenAI-compatible API", logo: "/partners/openai.svg" },
  { value: "not_sure", label: "Let ElevenOrbits choose", icon: "help-circle" },
];

const rolloutOptions = [
  { value: "immediate", label: "Immediate rollout", icon: "timer" },
  { value: "staged_pilot", label: "Staged pilot", icon: "git-branch" },
  { value: "after_data_review", label: "After data review", icon: "database" },
  { value: "after_security_review", label: "After security review", icon: "shield" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
];

const automationGoalOptions = [
  { value: "lead_routing", label: "Lead routing", icon: "route" },
  { value: "ticket_triage", label: "Ticket triage", icon: "life-buoy" },
  { value: "invoice_ops", label: "Invoice or billing ops", icon: "file-check" },
  { value: "data_sync", label: "Data sync", icon: "database" },
  { value: "ai_workflow", label: "AI workflow", logo: "/partners/openai.svg" },
  { value: "reporting", label: "Reporting automation", icon: "bar-chart" },
  { value: "notifications", label: "Notifications", icon: "mail" },
  { value: "custom", label: "Custom workflow", logo: "/partners/n8n.svg" },
];

const appSystemOptions = [
  { value: "forms", label: "Forms", icon: "clipboard-list" },
  { value: "email", label: "Email", icon: "mail" },
  { value: "crm", label: "CRM", icon: "briefcase" },
  { value: "database", label: "Database", icon: "database" },
  { value: "webhook_api", label: "Webhook/API", icon: "webhook" },
  { value: "spreadsheet", label: "Spreadsheet", icon: "file-text" },
  { value: "ticketing", label: "Ticketing", icon: "life-buoy" },
  { value: "github", label: "GitHub", logo: "/partners/github.svg" },
  { value: "microsoft", label: "Microsoft 365", logo: "/partners/microsoft.svg" },
  { value: "n8n", label: "n8n", logo: "/partners/n8n.svg" },
];

const approvalOptions = [
  { value: "none", label: "No human approval", icon: "check" },
  { value: "manager_review", label: "Manager review", icon: "user" },
  { value: "finance_review", label: "Finance review", icon: "file-check" },
  { value: "support_review", label: "Support review", icon: "life-buoy" },
  { value: "exception_only", label: "Exceptions only", icon: "alert-triangle" },
];

const errorHandlingOptions = [
  { value: "email_alert", label: "Email alert", icon: "mail" },
  { value: "ticket_alert", label: "Create support ticket", icon: "life-buoy" },
  { value: "retry_queue", label: "Retry queue", icon: "repeat" },
  { value: "pause_workflow", label: "Pause workflow", icon: "timer" },
  { value: "manual_review", label: "Manual review", icon: "user" },
];

const aiSolutionGoalOptions = [
  { value: "support_assistant", label: "Support assistant", icon: "life-buoy" },
  { value: "sales_assistant", label: "Sales assistant", icon: "briefcase" },
  { value: "document_qna", label: "Document Q&A", icon: "file-text" },
  { value: "internal_copilot", label: "Internal copilot", logo: "/partners/openai.svg" },
  { value: "content_ops", label: "Content operations", icon: "file-check" },
  { value: "workflow_agent", label: "Workflow agent", logo: "/partners/n8n.svg" },
  { value: "custom", label: "Custom AI solution", icon: "settings" },
];

const targetUsersOptions = [
  { value: "internal_staff", label: "Internal staff", icon: "users" },
  { value: "support_agents", label: "Support agents", icon: "headphones" },
  { value: "sales_team", label: "Sales team", icon: "briefcase" },
  { value: "customers", label: "Customers", icon: "globe" },
  { value: "operators", label: "Operations team", icon: "settings" },
];

const dataSourceOptions = [
  { value: "documents", label: "Documents", icon: "file-text" },
  { value: "database", label: "Database", icon: "database" },
  { value: "website", label: "Website content", icon: "globe" },
  { value: "spreadsheet", label: "Spreadsheets", icon: "file-text" },
  { value: "crm", label: "CRM", icon: "briefcase" },
  { value: "tickets", label: "Tickets", icon: "life-buoy" },
  { value: "api", label: "API", icon: "webhook" },
];

const successCriteriaOptions = [
  { value: "accuracy", label: "Answer accuracy", icon: "check-circle" },
  { value: "response_time", label: "Response time", icon: "timer" },
  { value: "ticket_reduction", label: "Ticket reduction", icon: "life-buoy" },
  { value: "workflow_completion", label: "Workflow completion", icon: "workflow" },
  { value: "human_review_pass", label: "Human review pass", icon: "user" },
  { value: "not_sure", label: "Define with team", icon: "help-circle" },
];

const supportGoalOptions = [
  { value: "bug_fix", label: "Bug fix", icon: "wrench" },
  { value: "feature_work", label: "Feature work", icon: "plus" },
  { value: "deployment_help", label: "Deployment help", icon: "upload-cloud" },
  { value: "performance", label: "Performance tuning", icon: "gauge" },
  { value: "integration", label: "Integration work", icon: "workflow" },
  { value: "maintenance", label: "Maintenance", icon: "shield" },
  { value: "technical_review", label: "Technical review", icon: "file-check" },
];

const stackOptions = [
  { value: "nextjs", label: "Next.js / React", icon: "code" },
  { value: "node", label: "Node.js", icon: "terminal" },
  { value: "python", label: "Python", icon: "terminal" },
  { value: "laravel", label: "Laravel / PHP", icon: "code" },
  { value: "wordpress", label: "WordPress", icon: "globe" },
  { value: "docker", label: "Docker", logo: "/partners/docker.svg" },
  { value: "database", label: "Database", icon: "database" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
];

const deploymentProcessOptions = [
  { value: "github_actions", label: "GitHub workflow", logo: "/partners/github.svg" },
  { value: "manual_server", label: "Manual server deploy", icon: "server" },
  { value: "docker_pipeline", label: "Docker deploy", logo: "/partners/docker.svg" },
  { value: "control_panel", label: "Control panel", icon: "settings" },
  { value: "no_process", label: "No process yet", icon: "alert-triangle" },
  { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
];

const projectToolOptions = [
  { value: "github", label: "GitHub Issues", logo: "/partners/github.svg" },
  { value: "jira", label: "Jira", logo: "/partners/jira.svg" },
  { value: "email", label: "Email", icon: "mail" },
  { value: "support_ticket", label: "Support ticket", icon: "life-buoy" },
  { value: "none", label: "No PM tool", icon: "x" },
];

const securityGoalOptions = [
  { value: "hardening", label: "Hardening", icon: "shield" },
  { value: "monitoring", label: "Monitoring", icon: "activity" },
  { value: "incident_review", label: "Incident review", icon: "alert-triangle" },
  { value: "audit_prep", label: "Audit prep", icon: "file-check" },
  { value: "vulnerability_scan", label: "Vulnerability scan", icon: "target" },
  { value: "endpoint_protection", label: "Endpoint protection", icon: "monitor" },
  { value: "backup_recovery", label: "Backup and recovery", logo: "/partners/veeam.svg" },
];

const targetSystemOptions = [
  { value: "domains", label: "Domains/web apps", icon: "globe" },
  { value: "servers", label: "Servers/IP ranges", icon: "server" },
  { value: "endpoints", label: "Endpoints/devices", icon: "monitor" },
  { value: "network", label: "Network devices", icon: "network" },
  { value: "cloud_accounts", label: "Cloud accounts", icon: "cloud" },
  { value: "email_identity", label: "Email/identity", icon: "mail" },
];

const complianceRequirementOptions = [
  { value: "none", label: "None", icon: "check" },
  { value: "pci", label: "PCI", icon: "file-check" },
  { value: "hipaa", label: "HIPAA", icon: "shield" },
  { value: "soc2", label: "SOC 2", icon: "file-check" },
  { value: "gdpr", label: "GDPR", icon: "lock" },
  { value: "internal_policy", label: "Internal policy", icon: "clipboard-list" },
];

const securityToolOptions = [
  { value: "waf", label: "WAF/firewall", icon: "shield" },
  { value: "edr", label: "EDR", icon: "monitor" },
  { value: "siem", label: "SIEM/logging", icon: "activity" },
  { value: "backup", label: "Backup", logo: "/partners/veeam.svg" },
  { value: "datto", label: "Datto", logo: "/partners/datto.svg" },
  { value: "kaseya", label: "Kaseya", logo: "/partners/kaseya.svg" },
  { value: "none", label: "None yet", icon: "x" },
];

const incidentConcernOptions = [
  { value: "none", label: "No active incident", icon: "check" },
  { value: "malware", label: "Malware concern", icon: "alert-triangle" },
  { value: "suspicious_login", label: "Suspicious logins", icon: "key" },
  { value: "exposed_ports", label: "Exposed ports", icon: "shield" },
  { value: "abuse_report", label: "Abuse report", icon: "file-text" },
  { value: "data_exposure", label: "Data exposure", icon: "lock" },
];

const cachingGoalOptions = [
  { value: "static_assets", label: "Static assets", icon: "image" },
  { value: "media_delivery", label: "Media delivery", icon: "download-cloud" },
  { value: "api_acceleration", label: "API acceleration", icon: "code" },
  { value: "full_page_cache", label: "Full-page cache", icon: "globe" },
  { value: "dynamic_safe", label: "Keep dynamic pages safe", icon: "shield" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
];

const bypassPathOptions = [
  { value: "admin", label: "Admin paths", icon: "lock" },
  { value: "checkout", label: "Cart/checkout", icon: "file-check" },
  { value: "api", label: "API paths", icon: "code" },
  { value: "auth", label: "Authenticated pages", icon: "key" },
  { value: "uploads", label: "Uploads", icon: "upload-cloud" },
  { value: "none", label: "No bypass needed", icon: "check" },
];

const protectionOptions = [
  { value: "waf", label: "WAF rules", icon: "shield" },
  { value: "ddos", label: "DDoS protection", icon: "shield" },
  { value: "bot_control", label: "Bot control", icon: "bot" },
  { value: "geo_rules", label: "Geo rules", icon: "globe" },
  { value: "rate_limit", label: "Rate limits", icon: "gauge" },
  { value: "none", label: "No extra protection", icon: "check" },
];

const corsOriginOptions = [
  { value: "same_domain", label: "Same domain only", icon: "globe" },
  { value: "app_domains", label: "App domains", icon: "globe" },
  { value: "admin_domains", label: "Admin domains", icon: "lock" },
  { value: "localhost_dev", label: "Local/dev origin", icon: "terminal" },
  { value: "not_needed", label: "No browser CORS", icon: "x" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
];

const lifecycleOptions = [
  { value: "none", label: "No lifecycle policy", icon: "check" },
  { value: "archive_30", label: "Archive after 30 days", icon: "archive" },
  { value: "archive_90", label: "Archive after 90 days", icon: "archive" },
  { value: "delete_old", label: "Delete old objects", icon: "trash" },
  { value: "legal_hold", label: "Retention/legal hold", icon: "lock" },
  { value: "not_sure", label: "Review with team", icon: "help-circle" },
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
      { key: "expectedUsers", label: "Expected users or traffic", type: "select", required: true, options: capacityOptions, icon: "users" },
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
      { key: "firewallPorts", label: "Required public access", type: "multiselect", options: portProfileOptions, icon: "shield" },
      { key: "backupNeed", label: "Backup requirement", type: "select", options: [
        { value: "standard", label: "Standard backups", icon: "hard-drive" },
        { value: "high_frequency", label: "High-frequency backups", icon: "refresh" },
        { value: "veeam", label: "Veeam-style backup", logo: "/partners/veeam.svg" },
        { value: "not_needed", label: "Not needed", icon: "x" },
      ], icon: "hard-drive" },
      { key: "migrationWindow", label: "Migration or launch window", type: "select", options: scheduleOptions, icon: "calendar" },
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
      { key: "useCase", label: "Main use case", type: "select", required: true, options: appUseCaseOptions, icon: "file-text" },
    ],
  },
  {
    id: "app-integrations",
    title: "Data and integrations",
    description: "Optional integration, import, and access policy details.",
    icon: "workflow",
    fields: [
      { key: "integrations", label: "Integrations needed", type: "multiselect", options: integrationOptions, icon: "workflow" },
      { key: "migrationImport", label: "Migration or import needs", type: "multiselect", options: migrationImportOptions, icon: "upload-cloud" },
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
          { key: "primaryRegion", label: "Primary country and timezone", type: "select", required: true, options: regionTimezoneOptions, icon: "globe" },
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
          { key: "didNumbers", label: "DID numbers or caller IDs", type: "multiselect", options: didNumberOptions, icon: "hash" },
          { key: "inboundRouting", label: "Inbound routing / IVR", type: "multiselect", options: inboundRoutingOptions, icon: "git-branch" },
          { key: "outboundDialing", label: "Outbound dialing mode", type: "select", options: [
            { value: "manual", label: "Manual / preview", icon: "mouse-pointer" },
            { value: "progressive", label: "Progressive", icon: "step-forward" },
            { value: "predictive", label: "Predictive", icon: "gauge" },
            { value: "not_sure", label: "Not sure yet", icon: "help-circle" },
          ], icon: "phone-outgoing" },
          { key: "rvmUseCase", label: "RVM use case", type: "select", options: rvmUseCaseOptions, icon: "voicemail" },
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
          { key: "crmIntegration", label: "CRM or webhook integration", type: "multiselect", options: crmIntegrationOptions, icon: "workflow" },
          { key: "complianceNotes", label: "Compliance notes", type: "multiselect", options: complianceOptions, icon: "shield" },
          { key: "reportingNeeds", label: "Reporting needs", type: "multiselect", options: reportingOptions, icon: "bar-chart" },
          { key: "migrationWindow", label: "Migration or rollout window", type: "select", options: scheduleOptions, icon: "calendar" },
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
          { key: "modelProvider", label: "Model/provider", type: "multiselect", required: true, options: modelProviderOptions, icon: "brain" },
          { key: "expectedUsage", label: "Expected usage", type: "select", required: true, options: aiUsageOptions, icon: "activity" },
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
          { key: "framework", label: "Framework/runtime", type: "multiselect", options: frameworkOptions, icon: "terminal" },
          { key: "apiKeyHandoff", label: "API key handoff", type: "select", options: [
            { value: "customer_provides", label: "Customer provides keys", icon: "key" },
            { value: "elevenorbits_managed", label: "ElevenOrbits managed keys", icon: "shield" },
            { value: "not_needed", label: "No external keys", icon: "x" },
          ], icon: "key" },
          { key: "rolloutNotes", label: "Rollout timing", type: "select", options: rolloutOptions, icon: "file-text" },
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
          { key: "automationGoal", label: "Automation goal", type: "select", required: true, options: automationGoalOptions, icon: "workflow" },
          { key: "sourceApps", label: "Source apps", type: "multiselect", required: true, options: appSystemOptions, icon: "upload-cloud" },
          { key: "destinationApps", label: "Destination apps", type: "multiselect", required: true, options: appSystemOptions, icon: "download-cloud" },
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
          { key: "approvalSteps", label: "Approval steps", type: "select", options: approvalOptions, icon: "check-square" },
          { key: "errorHandling", label: "Error handling", type: "multiselect", options: errorHandlingOptions, icon: "alert-triangle" },
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
          { key: "solutionGoal", label: "Solution goal", type: "select", required: true, options: aiSolutionGoalOptions, icon: "brain" },
          { key: "targetUsers", label: "Target users", type: "multiselect", required: true, options: targetUsersOptions, icon: "users" },
          { key: "modelPreference", label: "Model/provider preference", type: "multiselect", required: true, options: modelProviderOptions, icon: "bot" },
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
          { key: "dataSources", label: "Data sources", type: "multiselect", options: dataSourceOptions, icon: "database" },
          { key: "integrations", label: "Integrations", type: "multiselect", options: integrationOptions, icon: "workflow" },
          { key: "successCriteria", label: "Success criteria", type: "multiselect", options: successCriteriaOptions, icon: "check-circle" },
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
          { key: "supportGoal", label: "Support goal", type: "select", required: true, options: supportGoalOptions, icon: "life-buoy" },
          { key: "stackContext", label: "Stack or repo context", type: "multiselect", required: true, options: stackOptions, icon: "code" },
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
          { key: "deploymentProcess", label: "Deployment process", type: "select", options: deploymentProcessOptions, icon: "upload-cloud" },
          { key: "projectTool", label: "Ticketing or PM tool", type: "select", options: projectToolOptions, icon: "clipboard-list" },
          { key: "preferredSchedule", label: "Preferred schedule", type: "select", options: scheduleOptions, icon: "calendar" },
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
          { key: "securityGoal", label: "Current risk or need", type: "multiselect", required: true, options: securityGoalOptions, icon: "alert-triangle" },
          { key: "targetSystems", label: "Target systems", type: "multiselect", required: true, options: targetSystemOptions, icon: "target" },
          { key: "scanWindow", label: "Preferred scan/change window", type: "select", options: scheduleOptions, icon: "calendar" },
        ],
      },
      {
        id: "security-context",
        title: "Compliance and tools",
        description: "Optional current controls and compliance context.",
        icon: "lock",
        fields: [
          { key: "compliance", label: "Compliance requirement", type: "multiselect", options: complianceRequirementOptions, icon: "file-check" },
          { key: "currentTools", label: "Current tools", type: "multiselect", options: securityToolOptions, icon: "wrench" },
          { key: "incidentConcern", label: "Incident concerns", type: "multiselect", options: incidentConcernOptions, icon: "alert-triangle" },
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
          { key: "cachingGoal", label: "Caching goal", type: "select", required: true, options: cachingGoalOptions, icon: "gauge" },
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
          { key: "bypassPaths", label: "Cache bypass paths", type: "multiselect", options: bypassPathOptions, icon: "route" },
          { key: "protectionNotes", label: "WAF / DDoS notes", type: "multiselect", options: protectionOptions, icon: "shield" },
        ],
      },
    ],
  },
  "object-storage": {
    categorySlug: "object-storage",
    title: "O7 Bucket requirements",
    description: "Define S3 API access, gated access, CORS, and custom domain needs. If you need more storage in the future, ElevenOrbits can extend it for you.",
    logo: "/partners/object-storage.svg",
    sections: [
      {
        id: "bucket-basics",
        title: "Bucket basics",
        description: "Use case and access style. Future storage expansion can be handled by the ElevenOrbits team.",
        icon: "database",
        fields: [
          { key: "bucketUseCase", label: "Bucket use case", type: "select", required: true, options: [
            { value: "app_storage", label: "Application storage", icon: "package" },
            { value: "media_assets", label: "Media/assets", icon: "image" },
            { value: "backups", label: "Backups", icon: "hard-drive" },
            { value: "datasets", label: "AI/data sets", icon: "database" },
            { value: "archive", label: "Archive", icon: "archive" },
          ], icon: "database" },
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
          { key: "corsOrigins", label: "CORS origins", type: "multiselect", options: corsOriginOptions, icon: "globe" },
          { key: "allowedMethods", label: "Allowed API methods", type: "multiselect", options: [
            { value: "get", label: "GET", icon: "download-cloud" },
            { value: "put", label: "PUT", icon: "upload-cloud" },
            { value: "post", label: "POST", icon: "plus" },
            { value: "delete", label: "DELETE", icon: "trash" },
            { value: "list", label: "LIST", icon: "list" },
          ], icon: "code" },
          { key: "lifecycleNotes", label: "Lifecycle or retention notes", type: "select", options: lifecycleOptions, icon: "calendar" },
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
