import { createPostgresModel } from "./postgres-model.js";

const dateNow = () => new Date();

export const ActivityLog = createPostgresModel("ActivityLog", {
  collection: "activity_logs",
  defaults: {
    metadata: {},
  },
});

export const AdminSetting = createPostgresModel("AdminSetting", {
  collection: "admin_settings",
  defaults: {
    value: "",
    group: "general",
  },
});

export const ServiceCategory = createPostgresModel("ServiceCategory", {
  collection: "service_categories",
  defaults: {
    description: "",
    isActive: true,
    sortOrder: 0,
  },
  booleanFields: ["isActive"],
  numericFields: ["sortOrder"],
});

export const User = createPostgresModel("User", {
  collection: "users",
  defaults: {
    phone: "",
    secondaryEmail: "",
    address: "",
    role: "customer",
    company: "",
    billingAddress: {},
    accountBalance: 0,
    stripeCustomerId: "",
    defaultPaymentMethodId: "",
    defaultPaymentMethodBrand: "",
    defaultPaymentMethodLast4: "",
    savedPaymentMethods: [],
    autoCardBillingEnabled: true,
    accountStatus: "active",
    accountStatusReason: "",
    accountStatusBy: "",
    accountStatusAt: null,
  },
  arrayFields: ["savedPaymentMethods"],
  booleanFields: ["autoCardBillingEnabled"],
  numericFields: ["accountBalance"],
});

export const StaffUser = createPostgresModel("StaffUser", {
  collection: "staff_users",
  defaults: {
    role: "admin",
    isActive: true,
    lastLoginAt: null,
  },
  booleanFields: ["isActive"],
  dateFields: ["lastLoginAt"],
});

export const ProductPlan = createPostgresModel("ProductPlan", {
  collection: "product_plans",
  defaults: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscountPercent: 0,
    features: [],
    planType: "standard",
    billingCycles: ["monthly"],
    isManaged: true,
    isCustom: false,
    contactSalesOnly: false,
    displayPriceLabel: "",
    serviceType: "",
    techStack: [],
    isActive: true,
    sortOrder: 0,
  },
  refs: {
    categoryId: "ServiceCategory",
  },
  arrayFields: ["features", "billingCycles", "techStack"],
  booleanFields: ["isManaged", "isCustom", "contactSalesOnly", "isActive"],
  numericFields: ["monthlyPrice", "yearlyPrice", "yearlyDiscountPercent", "sortOrder"],
});

export const Addon = createPostgresModel("Addon", {
  collection: "addons",
  defaults: {
    addonType: "feature",
    selectionMode: "multi",
    optionCode: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    includedQuantity: 0,
    pricePerUnitMonthly: 0,
    pricePerUnitYearly: 0,
    unitLabel: "GB",
    minQuantity: 0,
    maxQuantity: 0,
    quantityStep: 1,
    isActive: true,
    sortOrder: 0,
  },
  refs: {
    categoryId: "ServiceCategory",
  },
  booleanFields: ["isActive"],
  numericFields: [
    "monthlyPrice",
    "yearlyPrice",
    "includedQuantity",
    "pricePerUnitMonthly",
    "pricePerUnitYearly",
    "minQuantity",
    "maxQuantity",
    "quantityStep",
    "sortOrder",
  ],
});

export const Order = createPostgresModel("Order", {
  collection: "orders",
  defaults: {
    addons: [],
    billingCycle: "monthly",
    status: "draft",
    lineItems: [],
    metadata: {},
  },
  refs: {
    userId: "User",
    productPlanId: "ProductPlan",
    addons: "Addon",
  },
  arrayFields: ["addons", "lineItems"],
  numericFields: ["totalAmount"],
});

export const Subscription = createPostgresModel("Subscription", {
  collection: "subscriptions",
  defaults: {
    addons: [],
    billingCycle: "monthly",
    status: "pending_verification",
    startDate: null,
    renewalDate: null,
    cancelAtPeriodEnd: false,
    customerDeletedAt: null,
    serviceAccess: {},
    sharedDetails: [],
    metadata: {},
  },
  refs: {
    userId: "User",
    orderId: "Order",
    productPlanId: "ProductPlan",
    addons: "Addon",
  },
  arrayFields: ["addons", "sharedDetails"],
  booleanFields: ["cancelAtPeriodEnd"],
  dateFields: ["startDate", "renewalDate", "customerDeletedAt"],
});

export const Invoice = createPostgresModel("Invoice", {
  collection: "invoices",
  defaults: {
    currency: "USD",
    billingCycle: "monthly",
    status: "pending",
    pdfUrl: "",
    pdfPath: "",
    pdfStorageKey: "",
    pdfStorageProvider: "local",
    paymentMethodType: "pending_confirmation",
    paymentReferenceCode: "",
    lineItems: [],
    issuedAt: dateNow,
    paidAt: null,
  },
  refs: {
    userId: "User",
    subscriptionId: "Subscription",
    orderId: "Order",
  },
  arrayFields: ["lineItems"],
  numericFields: ["amount"],
  dateFields: ["issuedAt", "paidAt"],
});

export const PaymentSubmission = createPostgresModel("PaymentSubmission", {
  collection: "payment_submissions",
  defaults: {
    submissionType: "order_payment",
    amount: 0,
    paymentMethodType: "pending_confirmation",
    screenshotUrl: "",
    status: "pending_verification",
    adminRemarks: "",
    gateway: "stripe",
    gatewayPaymentId: "",
    gatewayCheckoutSessionId: "",
    gatewaySetupIntentId: "",
    submittedAt: dateNow,
    reviewedAt: null,
    reviewedBy: null,
  },
  refs: {
    userId: "User",
    orderId: "Order",
    subscriptionId: "Subscription",
    reviewedBy: "StaffUser",
  },
  numericFields: ["amount"],
  dateFields: ["submittedAt", "reviewedAt"],
});

export const CustomerContract = createPostgresModel("CustomerContract", {
  collection: "customer_contracts",
  defaults: {
    customerType: "INDIVIDUAL",
    businessName: "",
    signingCapacity: "",
    businessRole: "",
    businessRegistrationType: "",
    businessRegistrationNumber: "",
    incorporationCountry: "",
    country: "",
    phone: "",
    status: "NOT_STARTED",
    adminDecision: "",
    adminReviewedBy: "",
    adminRejectionReason: "",
    documensoDocumentId: "",
    documensoRecipientId: "",
    r2SignedPdfKey: "",
    r2AuditCertificateKey: "",
    r2EvidenceKey: "",
    signedPdfSha256: "",
    turnstileHostname: "",
  },
  dateFields: [
    "signedAt",
    "turnstileVerifiedAt",
    "adminReviewedAt",
    "storageStartedAt",
    "storedAt",
    "supersededAt",
  ],
});

export const ContractCounter = createPostgresModel("ContractCounter", {
  collection: "contract_counters",
  defaults: {
    sequence: 0,
  },
  numericFields: ["sequence"],
});

export const ContractWebhookEvent = createPostgresModel("ContractWebhookEvent", {
  collection: "contract_webhook_events",
  defaults: {
    provider: "documenso",
    eventType: "",
    documentId: "",
    processedAt: null,
  },
  dateFields: ["processedAt"],
});

export const PaymentSetting = createPostgresModel("PaymentSetting", {
  collection: "payment_settings",
  defaults: {
    qrCodeImageUrl: "",
    paymentLink: "",
    instructions: "",
    isActive: true,
    supportedFor: [],
  },
  arrayFields: ["supportedFor"],
  booleanFields: ["isActive"],
});

export const SupportTicket = createPostgresModel("SupportTicket", {
  collection: "support_tickets",
  defaults: {
    priority: "medium",
    status: "open",
    serviceId: "",
    subscriptionId: null,
    assignedTo: null,
    lastReplyAt: null,
  },
  refs: {
    userId: "User",
    subscriptionId: "Subscription",
    assignedTo: "StaffUser",
  },
  dateFields: ["lastReplyAt"],
});

export const SupportMessage = createPostgresModel("SupportMessage", {
  collection: "support_messages",
  defaults: {
    publicSenderName: "",
    attachments: [],
  },
  refs: {
    ticketId: "SupportTicket",
  },
  arrayFields: ["attachments"],
});
