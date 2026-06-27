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
      { href: "/portal/contracts", label: "Contracts", icon: "file-signature", description: "Your signed service agreement" },
    ],
  },
  { label: "Support", href: "/portal/support", icon: "life-buoy" },
];

export const adminNavigation = [
  { href: "/eo-admin", label: "Overview", icon: "layout-dashboard" },
  { href: "/eo-admin/users", label: "Users", icon: "users" },
  { href: "/eo-admin/products", label: "Products", icon: "boxes" },
  { href: "/eo-admin/pricing", label: "Pricing", icon: "badge-dollar-sign" },
  { href: "/eo-admin/subscriptions", label: "Subscriptions", icon: "package" },
  { href: "/eo-admin/invoices", label: "Invoices", icon: "receipt" },
  { href: "/eo-admin/contracts", label: "Contracts", icon: "file-signature" },
  { href: "/eo-admin/tickets", label: "Tickets", icon: "tickets" },
  { href: "/eo-admin/settings", label: "Settings", icon: "settings-2" },
  { href: "/eo-admin/activity", label: "Activity", icon: "activity" },
];
