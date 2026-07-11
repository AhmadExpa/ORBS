export const portalNavigation = [
  { href: "/portal", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/portal/services", label: "Apps", icon: "server" },
  { href: "/portal/subscriptions", label: "Subscriptions", icon: "package" },
  { href: "/portal/invoices", label: "Invoices", icon: "receipt" },
  { href: "/portal/payments", label: "Wallet & Payments", icon: "wallet" },
  { href: "/portal/contracts", label: "Contracts", icon: "file-signature" },
  { href: "/portal/support", label: "Support", icon: "life-buoy" },
  { href: "/portal/account", label: "Account", icon: "user-round" },
];

// Grouped, HubSpot-style top navigation for the customer portal.
// Single links use `href`; groups expose a dropdown via `items`.
export const portalNavGroups = [
  { label: "Dashboard", href: "/portal", icon: "layout-dashboard" },
  {
    label: "Services",
    icon: "server",
    items: [
      { href: "/portal/services", label: "Apps", icon: "server", description: "Your managed apps and servers" },
      { href: "/portal/subscriptions", label: "Subscriptions", icon: "package", description: "Plans, billing cycles, and renewals" },
    ],
  },
  {
    label: "Billing",
    icon: "receipt",
    items: [
      { href: "/portal/invoices", label: "Invoices", icon: "receipt", description: "Review, download, and pay invoices" },
      { href: "/portal/payments", label: "Wallet & Payments", icon: "wallet", description: "Top up balance and manage cards" },
      { href: "/portal/contracts", label: "Contracts", icon: "file-signature", description: "Your signed Managed Service Agreement" },
    ],
  },
  { label: "Support", href: "/portal/support", icon: "life-buoy" },
];

// Contextual left-rail config per section. The top nav routes between
// sections; this drives the in-section sidebar (sub-views + filters).
export const portalSections = [
  {
    id: "services",
    label: "Services",
    description: "Apps, subscriptions, and renewals",
    links: [
      { href: "/portal/services", label: "Apps", icon: "server" },
      { href: "/portal/subscriptions", label: "Subscriptions", icon: "package" },
    ],
    quickActions: [
      { href: "/portal/services", label: "Browse apps", icon: "server" },
      { href: "/portal/payments", label: "Top up wallet", icon: "wallet" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Invoices, wallet, and agreements",
    links: [
      { href: "/portal/invoices", label: "Invoices", icon: "receipt" },
      { href: "/portal/payments", label: "Wallet & Payments", icon: "wallet" },
      { href: "/portal/contracts", label: "Contracts", icon: "file-signature" },
    ],
    quickActions: [
      { href: "/portal/payments", label: "Top up wallet", icon: "wallet" },
      { href: "/portal/invoices", label: "View invoices", icon: "receipt" },
    ],
  },
  {
    id: "support",
    label: "Support",
    description: "Tickets and help",
    links: [{ href: "/portal/support", label: "Tickets", icon: "life-buoy" }],
    quickActions: [
      { href: "/portal/support", label: "New ticket", icon: "life-buoy" },
      { href: "/portal/contracts", label: "View agreement", icon: "file-signature" },
    ],
  },
];

// Per-page filters surfaced in the left rail (URL query driven).
export const portalFilters = {
  "/portal/support": {
    param: "status",
    label: "Filter tickets",
    options: [
      { value: "", label: "All tickets" },
      { value: "open", label: "Open" },
      { value: "pending", label: "Waiting on us" },
      { value: "resolved", label: "Resolved" },
      { value: "closed", label: "Closed" },
    ],
  },
  "/portal/invoices": {
    param: "status",
    label: "Filter invoices",
    options: [
      { value: "", label: "All invoices" },
      { value: "outstanding", label: "Outstanding" },
      { value: "paid", label: "Paid" },
    ],
  },
  "/portal/subscriptions": {
    param: "status",
    label: "Filter subscriptions",
    options: [
      { value: "", label: "All" },
      { value: "active", label: "Active" },
      { value: "cancelled", label: "Cancelled" },
      { value: "expired", label: "Expired" },
    ],
  },
};

export const adminNavigation = [
  { href: "/eo-admin", label: "Overview", icon: "layout-dashboard" },
  { href: "/eo-admin/users", label: "Users", icon: "users" },
  { href: "/eo-admin/products", label: "Products", icon: "boxes" },
  { href: "/eo-admin/pricing", label: "Pricing", icon: "badge-dollar-sign" },
  { href: "/eo-admin/subscriptions", label: "Subscriptions", icon: "package" },
  { href: "/eo-admin/invoices", label: "Invoices", icon: "receipt" },
  { href: "/eo-admin/disputes", label: "Disputes", icon: "alert-triangle" },
  { href: "/eo-admin/contracts", label: "Contracts", icon: "file-signature" },
  { href: "/eo-admin/tickets", label: "Tickets", icon: "tickets" },
  { href: "/eo-admin/contact-submissions", label: "Contact Leads", icon: "mail" },
  { href: "/eo-admin/settings", label: "Settings", icon: "settings-2" },
  { href: "/eo-admin/activity", label: "Activity", icon: "activity" },
];

// Grouped admin navigation for the dark operations sidebar.
export const adminNavGroups = [
  { items: [{ href: "/eo-admin", label: "Overview", icon: "layout-dashboard" }] },
  {
    label: "Catalog",
    items: [{ href: "/eo-admin/products", label: "Catalog", icon: "boxes" }],
  },
  {
    label: "Customers",
    items: [
      { href: "/eo-admin/users", label: "Users", icon: "users" },
      { href: "/eo-admin/subscriptions", label: "Subscriptions & Services", icon: "server" },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/eo-admin/invoices", label: "Invoices", icon: "receipt" },
      { href: "/eo-admin/disputes", label: "Disputes", icon: "alert-triangle" },
      { href: "/eo-admin/contracts", label: "Contracts", icon: "file-signature" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/eo-admin/tickets", label: "Tickets", icon: "tickets" },
      { href: "/eo-admin/contact-submissions", label: "Contact Leads", icon: "mail" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/eo-admin/settings", label: "Settings", icon: "settings-2" },
      { href: "/eo-admin/activity", label: "Activity", icon: "activity" },
    ],
  },
];
