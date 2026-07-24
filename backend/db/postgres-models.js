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
    imageUrl: "",
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
    accountStatusNotificationStatus: "",
    accountStatusNotificationCode: "",
    accountStatusNotificationAt: null,
  },
  arrayFields: ["savedPaymentMethods"],
  booleanFields: ["autoCardBillingEnabled"],
  numericFields: ["accountBalance"],
  dateFields: ["accountStatusAt", "accountStatusNotificationAt"],
});

export const CustomerDelegate = createPostgresModel("CustomerDelegate", {
  collection: "customer_delegates",
  defaults: {
    username: "",
    usernameNormalized: "",
    displayName: "",
    passwordHash: "",
    subscriptionIds: [],
    isActive: true,
    lastLoginAt: null,
    deactivatedAt: null,
    createdBy: "",
    metadata: {},
  },
  refs: {
    userId: "User",
    subscriptionIds: "Subscription",
  },
  arrayFields: ["subscriptionIds"],
  booleanFields: ["isActive"],
  dateFields: ["lastLoginAt", "deactivatedAt"],
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
    imageUrl: "",
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
    imageUrl: "",
    planIds: [],
    isActive: true,
    sortOrder: 0,
  },
  refs: {
    categoryId: "ServiceCategory",
  },
  arrayFields: ["planIds"],
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
    metadata: {},
    stripeDisputeId: "",
    stripeDisputeStatus: "",
    stripeDisputeReason: "",
    stripeDisputeAmount: 0,
    stripeDisputeCurrency: "",
    stripeDisputeEventType: "",
    disputeResolvedAt: null,
    issuedAt: dateNow,
    paidAt: null,
  },
  refs: {
    userId: "User",
    subscriptionId: "Subscription",
    orderId: "Order",
  },
  arrayFields: ["lineItems"],
  numericFields: ["amount", "stripeDisputeAmount"],
  dateFields: ["issuedAt", "paidAt", "disputeResolvedAt"],
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
    gatewayChargeId: "",
    gatewaySetupIntentId: "",
    stripeDisputeId: "",
    stripeDisputeStatus: "",
    stripeDisputeReason: "",
    stripeDisputeAmount: 0,
    stripeDisputeCurrency: "",
    stripeDisputeCaseType: "",
    stripeDisputeEventType: "",
    stripeDisputeDueBy: null,
    disputedAt: null,
    disputeResolvedAt: null,
    metadata: {},
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
  numericFields: ["amount", "stripeDisputeAmount"],
  dateFields: ["submittedAt", "reviewedAt", "stripeDisputeDueBy", "disputedAt", "disputeResolvedAt"],
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
    submittedDocumentUrl: "",
    submissionMethod: "",
    documensoFieldValues: [],
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
    "documensoCompletedAt",
    "documensoFieldValuesSyncedAt",
    "manualVerificationSubmittedAt",
    "manualVerificationVerifiedAt",
    "storageStartedAt",
    "storedAt",
    "supersededAt",
  ],
  arrayFields: ["documensoFieldValues"],
});

export const ContactSubmission = createPostgresModel("ContactSubmission", {
  collection: "contact_submissions",
  defaults: {
    company: "",
    phone: "",
    department: "general",
    serviceInterest: "",
    status: "new",
    adminNotes: "",
    ipAddress: "",
    userAgent: "",
    turnstileHostname: "",
    turnstileAction: "",
    metadata: {},
    submittedAt: dateNow,
    reviewedAt: null,
    reviewedBy: null,
  },
  refs: {
    reviewedBy: "StaffUser",
  },
  dateFields: ["submittedAt", "reviewedAt", "turnstileVerifiedAt"],
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
    ticketNumber: "",
    source: "portal",
    requesterType: "customer",
    requester: {},
    verificationStatus: "not_required",
    verifiedAt: null,
    emailVerification: {},
    aiTriage: null,
    priority: "medium",
    status: "open",
    serviceId: "",
    subscriptionId: null,
    createdByDelegateId: null,
    assignedTo: null,
    lastReplyAt: null,
  },
  refs: {
    userId: "User",
    subscriptionId: "Subscription",
    createdByDelegateId: "CustomerDelegate",
    assignedTo: "StaffUser",
  },
  dateFields: ["lastReplyAt", "verifiedAt"],
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
