import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  Addon,
  ActivityLog,
  AdminSetting,
  Invoice,
  Order,
  PaymentSubmission,
  ProductPlan,
  ServiceCategory,
  StaffUser,
  Subscription,
  SupportTicket,
  User,
  CustomerContract,
} from "../../db/models/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { requireAdmin, requireStaff } from "../../middleware/require-staff.js";
import { requireSameOrigin } from "../../middleware/csrf.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";
import { uploadImage } from "../../middleware/uploads.js";
import { persistUploadedFile } from "../../services/storage-service.js";
import { env } from "../../config/env.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { sendInvoiceNotification, sendServiceAccessNotification } from "../../services/email-service.js";
import { blockCustomer, reactivateCustomer, suspendCustomer } from "../../services/account-status-service.js";
import {
  approveContract,
  createContractDownloadUrl,
  getAdminContract,
  listAdminContracts,
  rejectContract,
  requireApprovedContract,
  syncContractWithDocumenso,
} from "../../services/contract-service.js";

export const adminRouter = express.Router();

adminRouter.use(requireStaff);

const rejectContractSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
});

const blockUserSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
});

function isSuspendedOrBlockedCustomer(user) {
  return ["suspended", "blocked"].includes(user?.accountStatus || "active");
}

function normalizeDocumentId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return value._id ? String(value._id) : "";
  }

  return String(value);
}

function serializePerson(record, fallbackType = "") {
  if (!record) {
    return null;
  }

  return {
    id: String(record._id || record.id || ""),
    name: record.name || "",
    email: record.email || "",
    role: record.role || fallbackType,
    accountStatus: record.accountStatus || "",
  };
}

function ensureRole(req, roles) {
  if (!roles.includes(req.staff.role)) {
    throw new HttpError(403, "You do not have permission for this action.");
  }
}

async function mapById(Model, ids) {
  const uniqueIds = [...new Set((ids || []).map((id) => String(id || "")).filter(Boolean))];
  if (!uniqueIds.length) {
    return new Map();
  }

  const records = await Model.find({ _id: { $in: uniqueIds } });
  return new Map(records.map((record) => [String(record._id), record]));
}

async function mapUsersByClerkId(clerkIds) {
  const uniqueIds = [...new Set((clerkIds || []).map((id) => String(id || "")).filter(Boolean))];
  if (!uniqueIds.length) {
    return new Map();
  }

  const users = await User.find({ clerkId: { $in: uniqueIds } });
  return new Map(users.map((user) => [String(user.clerkId), user]));
}

function logToPlainObject(log) {
  return log?.toJSON?.() || log;
}

function targetCustomerId(targetType, targetId, targetMaps) {
  const id = String(targetId || "");
  if (!id) {
    return "";
  }

  if (targetType === "user") {
    return id;
  }

  if (targetType === "support_ticket") {
    return String(targetMaps.tickets.get(id)?.userId || "");
  }

  if (targetType === "subscription") {
    return String(targetMaps.subscriptions.get(id)?.userId || "");
  }

  if (targetType === "order") {
    return String(targetMaps.orders.get(id)?.userId || "");
  }

  if (targetType === "invoice") {
    return String(targetMaps.invoices.get(id)?.userId || "");
  }

  if (targetType === "payment_submission") {
    return String(targetMaps.paymentSubmissions.get(id)?.userId || "");
  }

  return "";
}

function targetClerkCustomerId(targetType, targetId, targetMaps) {
  if (targetType !== "customer_contract") {
    return "";
  }

  return String(targetMaps.contracts.get(String(targetId || ""))?.clerkUserId || "");
}

function resolveTargetLabel(log, targetMaps) {
  const targetType = String(log.targetType || "");
  const targetId = String(log.targetId || "");

  if (targetType === "user") {
    const user = targetMaps.users.get(targetId);
    return user?.name || user?.email || targetId;
  }

  if (targetType === "staff_user") {
    const staff = targetMaps.staffUsers.get(targetId);
    return staff?.name || staff?.email || targetId;
  }

  if (targetType === "customer_contract") {
    return targetMaps.contracts.get(targetId)?.contractNumber || targetId;
  }

  if (targetType === "support_ticket") {
    return targetMaps.tickets.get(targetId)?.subject || targetId;
  }

  if (targetType === "subscription") {
    return targetMaps.subscriptions.get(targetId)?.productPlanId?.name || targetId;
  }

  if (targetType === "order") {
    return targetMaps.orders.get(targetId)?.status || targetId;
  }

  if (targetType === "invoice") {
    return targetMaps.invoices.get(targetId)?.invoiceNumber || targetId;
  }

  if (targetType === "payment_submission") {
    return targetMaps.paymentSubmissions.get(targetId)?.invoiceCode || targetId;
  }

  return targetId;
}

async function enrichActivityLogs(logs) {
  const plainLogs = logs.map(logToPlainObject);
  const targetIdsByType = plainLogs.reduce((groups, log) => {
    const type = String(log.targetType || "");
    const id = String(log.targetId || "");
    if (type && id) {
      groups[type] = [...(groups[type] || []), id];
    }
    return groups;
  }, {});
  const staffActorIds = plainLogs
    .filter((log) => ["admin", "support_agent"].includes(log.actorRole))
    .map((log) => log.actorId);
  const customerActorIds = plainLogs
    .filter((log) => log.actorRole === "customer")
    .map((log) => log.actorId);

  const [staffUsers, directUsers, targetUsers, contracts, tickets, subscriptions, orders, invoices, paymentSubmissions] = await Promise.all([
    mapById(StaffUser, [...staffActorIds, ...(targetIdsByType.staff_user || [])]),
    mapById(User, [...customerActorIds, ...(targetIdsByType.user || [])]),
    mapById(User, targetIdsByType.user || []),
    mapById(CustomerContract, targetIdsByType.customer_contract || []),
    mapById(SupportTicket, targetIdsByType.support_ticket || []),
    mapById(Subscription, targetIdsByType.subscription || []),
    mapById(Order, targetIdsByType.order || []),
    mapById(Invoice, targetIdsByType.invoice || []),
    mapById(PaymentSubmission, targetIdsByType.payment_submission || []),
  ]);

  const targetMaps = {
    staffUsers,
    users: targetUsers,
    contracts,
    tickets,
    subscriptions,
    orders,
    invoices,
    paymentSubmissions,
  };
  const linkedCustomerIds = plainLogs
    .map((log) => targetCustomerId(log.targetType, log.targetId, targetMaps))
    .filter(Boolean);
  const contractClerkIds = plainLogs
    .map((log) => targetClerkCustomerId(log.targetType, log.targetId, targetMaps))
    .filter(Boolean);
  const [linkedUsers, clerkUsers] = await Promise.all([
    mapById(User, linkedCustomerIds),
    mapUsersByClerkId([
      ...contractClerkIds,
      ...plainLogs.filter((log) => log.actorRole === "customer").map((log) => log.actorId),
    ]),
  ]);

  return plainLogs.map((log) => {
    const actorId = String(log.actorId || "");
    const customerId = targetCustomerId(log.targetType, log.targetId, targetMaps);
    const customerByClerkId = targetClerkCustomerId(log.targetType, log.targetId, targetMaps);
    const actor =
      log.actorRole === "customer"
        ? directUsers.get(actorId) || clerkUsers.get(actorId)
        : ["admin", "support_agent"].includes(log.actorRole)
          ? staffUsers.get(actorId)
          : null;
    const customer =
      log.actorRole === "customer"
        ? directUsers.get(actorId) || clerkUsers.get(actorId)
        : linkedUsers.get(customerId) || clerkUsers.get(customerByClerkId) || null;

    return {
      ...log,
      actor: serializePerson(actor, log.actorRole),
      customer: serializePerson(customer, "customer"),
      targetLabel: resolveTargetLabel(log, targetMaps),
    };
  });
}

async function resolveAssignedSupportAgentId(assignedTo) {
  if (!assignedTo) {
    return null;
  }

  const assignedStaff = await StaffUser.findById(assignedTo).select("_id role isActive");
  if (!assignedStaff || !assignedStaff.isActive || assignedStaff.role !== "support_agent") {
    throw new HttpError(400, "Assigned staff user must be an active support agent.");
  }

  return assignedStaff._id;
}

async function findInvoicesForDisputedPayments(submissions) {
  const paymentReferences = [
    ...new Set(
      submissions
        .flatMap((submission) => [submission.invoiceCode, submission.gatewayPaymentId])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
  const orderIds = [
    ...new Set(
      submissions
        .map((submission) => normalizeDocumentId(submission.orderId))
        .filter(Boolean),
    ),
  ];
  const filters = [];

  if (paymentReferences.length) {
    filters.push({ paymentReferenceCode: { $in: paymentReferences } });
  }

  if (orderIds.length) {
    filters.push({ orderId: { $in: orderIds } });
  }

  if (!filters.length) {
    return new Map();
  }

  const invoices = await Invoice.find(filters.length === 1 ? filters[0] : { $or: filters }).populate("userId subscriptionId orderId");
  const invoiceMap = new Map();

  for (const invoice of invoices) {
    if (invoice.paymentReferenceCode) {
      invoiceMap.set(`reference:${invoice.paymentReferenceCode}`, invoice);
    }

    const orderId = normalizeDocumentId(invoice.orderId);
    if (orderId) {
      invoiceMap.set(`order:${orderId}`, invoice);
    }
  }

  return invoiceMap;
}

adminRouter.get(
  "/analytics/summary",
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals();

    const disputedStatuses = ["disputed", "charged_back"];
    const [usersCount, subscriptions, paymentSubmissions, openTickets, allInvoices, pendingContractCount, openTicketCount, disputedPaymentCount] =
      await Promise.all([
        User.countDocuments(),
        Subscription.find({}),
        PaymentSubmission.find({}).sort({ submittedAt: -1 }).limit(5),
        SupportTicket.find({ status: { $in: ["open", "pending"] } }).sort({ updatedAt: -1 }).limit(5),
        Invoice.find({}),
        CustomerContract.countDocuments({ status: "SIGNED_PENDING_ADMIN" }),
        SupportTicket.countDocuments({ status: { $in: ["open", "pending"] } }),
        PaymentSubmission.countDocuments({ status: { $in: disputedStatuses } }),
      ]);

    const monthlyRecurringRevenue = subscriptions
      .filter((sub) => sub.status === "active" && sub.billingCycle === "monthly")
      .reduce((sum, subscription) => sum + Number(subscription.metadata?.billingAmount || 0), 0);

    const yearlyRecurringRevenue = subscriptions
      .filter((sub) => sub.status === "active" && sub.billingCycle === "yearly")
      .reduce((sum, subscription) => sum + Number(subscription.metadata?.billingAmount || 0), 0);

    const unpaidInvoices = allInvoices.filter((invoice) => invoice.status !== "paid");
    const unpaidInvoiceTotal = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active").length;

    res.json({
      totalUsers: usersCount,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions,
      monthlyRecurringRevenue,
      yearlyRecurringRevenue,
      recentPayments: paymentSubmissions,
      recentTickets: openTickets,
      attention: {
        pendingContracts: pendingContractCount,
        openTickets: openTicketCount,
        disputedPayments: disputedPaymentCount,
        unpaidInvoices: unpaidInvoices.length,
        unpaidInvoiceTotal,
      },
    });
  }),
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const [customers, staffUsers] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }),
      StaffUser.find({}).sort({ createdAt: -1 }),
    ]);
    res.json({
      customers,
      staffUsers,
      currentStaffUser: {
        _id: req.staff._id,
        name: req.staff.name,
        role: req.staff.role,
      },
    });
  }),
);

adminRouter.post(
  "/users/:id/suspend",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const user = await suspendCustomer({ userId: req.params.id, staff: req.staff });
    res.json({ user });
  }),
);

adminRouter.post(
  "/users/:id/block",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const { reason } = blockUserSchema.parse(req.body);
    const user = await blockCustomer({ userId: req.params.id, staff: req.staff, reason });
    res.json({ user });
  }),
);

adminRouter.post(
  "/users/:id/reactivate",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const user = await reactivateCustomer({ userId: req.params.id, staff: req.staff });
    res.json({ user });
  }),
);

adminRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const [categories, plans, addons] = await Promise.all([
      ServiceCategory.find({}).sort({ sortOrder: 1 }),
      ProductPlan.find({}).populate("categoryId").sort({ sortOrder: 1 }),
      Addon.find({}).populate("categoryId").sort({ addonType: 1, sortOrder: 1, name: 1 }),
    ]);

    res.json({ categories, plans, addons });
  }),
);

adminRouter.post(
  "/products",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const plan = await ProductPlan.create(req.body);
    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "product.created",
      targetType: "product_plan",
      targetId: String(plan._id),
    });
    res.status(201).json({ plan });
  }),
);

adminRouter.patch(
  "/products/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const plan = await ProductPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) {
      throw new HttpError(404, "Plan not found.");
    }
    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "product.updated",
      targetType: "product_plan",
      targetId: String(plan._id),
    });
    res.json({ plan });
  }),
);

adminRouter.post(
  "/addons",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const addon = await Addon.create(req.body);
    res.status(201).json({ addon });
  }),
);

adminRouter.patch(
  "/addons/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const addon = await Addon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ addon });
  }),
);

adminRouter.delete(
  "/products/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const plan = await ProductPlan.findById(req.params.id);
    if (!plan) {
      throw new HttpError(404, "Plan not found.");
    }
    // Unassign this plan from any plan-scoped add-ons so they don't dangle.
    const scopedAddons = await Addon.find({ planIds: { $in: [String(plan._id)] } });
    await Promise.all(
      scopedAddons.map((addon) =>
        Addon.findByIdAndUpdate(addon._id, {
          planIds: (addon.planIds || []).filter((id) => String(id) !== String(plan._id)),
        }),
      ),
    );
    await ProductPlan.findByIdAndDelete(req.params.id);
    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "product.deleted",
      targetType: "product_plan",
      targetId: String(plan._id),
    });
    res.json({ success: true });
  }),
);

adminRouter.delete(
  "/addons/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const addon = await Addon.findById(req.params.id);
    if (!addon) {
      throw new HttpError(404, "Add-on not found.");
    }
    await Addon.findByIdAndDelete(req.params.id);
    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "addon.deleted",
      targetType: "addon",
      targetId: String(addon._id),
    });
    res.json({ success: true });
  }),
);

adminRouter.post(
  "/categories",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await ServiceCategory.create(req.body);
    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "category.created",
      targetType: "service_category",
      targetId: String(category._id),
    });
    res.status(201).json({ category });
  }),
);

adminRouter.patch(
  "/categories/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      throw new HttpError(404, "Category not found.");
    }
    res.json({ category });
  }),
);

adminRouter.post(
  "/uploads/image",
  requireAdmin,
  uploadImage.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "No image was provided.");
    }
    const url = await persistUploadedFile({ file: req.file, directory: "catalog" });
    res.json({ url });
  }),
);

adminRouter.get(
  "/pricing",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const [plans, addons] = await Promise.all([
      ProductPlan.find({}).populate("categoryId").sort({ sortOrder: 1 }),
      Addon.find({}).populate("categoryId").sort({ addonType: 1, sortOrder: 1, name: 1 }),
    ]);
    res.json({ plans, addons });
  }),
);

adminRouter.get(
  "/subscriptions",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    await processSubscriptionRenewals();
    const subscriptions = await Subscription.find({})
      .populate("userId")
      .populate({
        path: "productPlanId",
        populate: {
          path: "categoryId",
        },
      })
      .sort({ createdAt: -1 });
    res.json({
      subscriptions: subscriptions.filter((subscription) => !isSuspendedOrBlockedCustomer(subscription.userId)),
    });
  }),
);

adminRouter.patch(
  "/subscriptions/:id/access",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id)
      .populate("userId")
      .populate({
        path: "productPlanId",
        populate: {
          path: "categoryId",
        },
      });

    if (!subscription) {
      throw new HttpError(404, "Subscription not found.");
    }

    if (isSuspendedOrBlockedCustomer(subscription.userId)) {
      throw new HttpError(403, "Suspended or blocked customer accounts cannot have subscription access managed.");
    }

    await requireApprovedContract(subscription.userId?.clerkId);

    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const ipAddress = String(req.body.ipAddress || "").trim();
    const sharedDetails = Array.isArray(req.body.sharedDetails)
      ? req.body.sharedDetails
          .map((item) => ({
            label: String(item?.label || "").trim(),
            value: String(item?.value || "").trim(),
          }))
          .filter((item) => item.label && item.value)
      : [];
    const hasAssignedAccess = Boolean(username || password || ipAddress);

    subscription.serviceAccess = {
      username,
      password,
      ipAddress,
      assignedAt: hasAssignedAccess ? new Date() : null,
      assignedBy: hasAssignedAccess ? req.staff._id : null,
    };
    subscription.sharedDetails = sharedDetails;

    await subscription.save();

    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: hasAssignedAccess ? "subscription.access_updated" : "subscription.access_cleared",
      targetType: "subscription",
      targetId: String(subscription._id),
      metadata: {
        customerId: subscription.userId?._id ? String(subscription.userId._id) : undefined,
        planId: subscription.productPlanId?._id ? String(subscription.productPlanId._id) : undefined,
        hasUsername: Boolean(username),
        hasPassword: Boolean(password),
        hasIpAddress: Boolean(ipAddress),
        sharedDetailCount: sharedDetails.length,
      },
    });

    if (hasAssignedAccess || sharedDetails.length) {
      await sendServiceAccessNotification({
        customer: subscription.userId,
        subscription,
        planName: subscription.productPlanId?.name || "Managed Service",
        access: {
          username,
          password,
          ipAddress,
          sharedDetails,
        },
      });
    }

    res.json({ subscription });
  }),
);

adminRouter.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    await processSubscriptionRenewals();
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const invoices = await Invoice.find(filter)
      .populate("userId subscriptionId orderId")
      .sort({ issuedAt: -1 });
    res.json({ invoices });
  }),
);

adminRouter.post(
  "/invoices/:id/regenerate",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw new HttpError(404, "Invoice not found.");
    }
    const latestSubmission = invoice.orderId
      ? await PaymentSubmission.findOne({ orderId: invoice.orderId }).sort({ submittedAt: -1 })
      : null;

    if (!invoice.paymentMethodType && latestSubmission?.paymentMethodType) {
      invoice.paymentMethodType = latestSubmission.paymentMethodType;
    }

    if (!invoice.paymentReferenceCode && latestSubmission?.invoiceCode) {
      invoice.paymentReferenceCode = latestSubmission.invoiceCode;
    }

    const [customer, subscription] = await Promise.all([
      User.findById(invoice.userId),
      Subscription.findById(invoice.subscriptionId).populate("productPlanId"),
    ]);
    const pdfData = await generateInvoicePdf({
      invoice,
      customer,
      planName: subscription?.productPlanId?.name || "Managed Service",
      supportEmail: env.supportEmail,
    });
    invoice.pdfPath = pdfData.pdfPath;
    invoice.pdfUrl = pdfData.pdfUrl;
    invoice.pdfStorageKey = pdfData.pdfStorageKey;
    invoice.pdfStorageProvider = pdfData.pdfStorageProvider;
    await invoice.save();
    await sendInvoiceNotification({
      customer,
      invoice,
      planName: subscription?.productPlanId?.name || "Managed Service",
      eventType: invoice.status === "paid" ? "invoice_paid" : "invoice_created",
    });
    res.json({ invoice });
  }),
);

adminRouter.get(
  "/payments",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const submissions = await PaymentSubmission.find(filter)
      .populate("userId subscriptionId reviewedBy")
      .populate({
        path: "orderId",
        populate: {
          path: "productPlanId",
        },
      })
      .sort({ submittedAt: -1 });
    res.json({ submissions });
  }),
);

adminRouter.patch(
  "/payments/:id/review",
  requireAdmin,
  asyncHandler(async (req, res) => {
    throw new HttpError(410, "Legacy payment review is no longer supported. Card payments are recorded automatically.");
  }),
);

adminRouter.get(
  "/disputes",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);

    const submissions = await PaymentSubmission.find({ stripeDisputeId: { $exists: true, $ne: "" } })
      .populate("userId")
      .populate({
        path: "subscriptionId",
        populate: {
          path: "productPlanId",
        },
      })
      .populate({
        path: "orderId",
        populate: {
          path: "productPlanId",
        },
      })
      .sort({ disputedAt: -1, submittedAt: -1 });
    const disputedSubmissions = submissions.filter((submission) => submission.stripeDisputeId);
    const invoiceMap = await findInvoicesForDisputedPayments(disputedSubmissions);
    const disputes = disputedSubmissions.map((submission) => {
      const invoice =
        invoiceMap.get(`reference:${submission.invoiceCode || ""}`) ||
        invoiceMap.get(`reference:${submission.gatewayPaymentId || ""}`) ||
        invoiceMap.get(`order:${normalizeDocumentId(submission.orderId)}`) ||
        null;

      return {
        id: String(submission._id),
        submission,
        invoice,
        customer: submission.userId || invoice?.userId || null,
        subscription: submission.subscriptionId || invoice?.subscriptionId || null,
        order: submission.orderId || invoice?.orderId || null,
        disputeId: submission.stripeDisputeId,
        disputeStatus: submission.stripeDisputeStatus || "",
        disputeReason: submission.stripeDisputeReason || "",
        disputeAmount: submission.stripeDisputeAmount || submission.amount || 0,
        disputeCurrency: submission.stripeDisputeCurrency || env.stripeCurrency.toUpperCase(),
        dueBy: submission.stripeDisputeDueBy || null,
        disputedAt: submission.disputedAt || submission.submittedAt,
        resolvedAt: submission.disputeResolvedAt || null,
        paymentStatus: submission.status,
        paymentIntentId: submission.gatewayPaymentId || "",
        chargeId: submission.gatewayChargeId || "",
        adminRemarks: submission.adminRemarks || "",
      };
    });

    const now = new Date();
    const summary = {
      total: disputes.length,
      open: disputes.filter((dispute) => dispute.paymentStatus === "disputed").length,
      chargedBack: disputes.filter((dispute) => dispute.paymentStatus === "charged_back").length,
      resolved: disputes.filter((dispute) => dispute.paymentStatus === "approved").length,
      evidenceDue: disputes.filter((dispute) => dispute.paymentStatus === "disputed" && dispute.dueBy).length,
      overdue: disputes.filter((dispute) => dispute.paymentStatus === "disputed" && dispute.dueBy && new Date(dispute.dueBy) < now).length,
    };

    res.json({ disputes, summary });
  }),
);

adminRouter.get(
  "/contracts",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const contracts = await listAdminContracts({ status: req.query.status });
    res.json({ contracts });
  }),
);

adminRouter.get(
  "/contracts/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const contract = await getAdminContract(req.params.id);
    res.json({ contract });
  }),
);

adminRouter.post(
  "/contracts/:id/sync",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const contract = await syncContractWithDocumenso({
      contractId: req.params.id,
      staff: req.staff,
    });
    res.json({ contract });
  }),
);

adminRouter.post(
  "/contracts/:id/approve",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const contract = await approveContract({
      contractId: req.params.id,
      staff: req.staff,
    });
    res.json({ contract });
  }),
);

adminRouter.post(
  "/contracts/:id/reject",
  requireAdmin,
  requireSameOrigin,
  asyncHandler(async (req, res) => {
    const payload = rejectContractSchema.parse(req.body);
    const contract = await rejectContract({
      contractId: req.params.id,
      staff: req.staff,
      reason: payload.reason,
    });
    res.json({ contract });
  }),
);

adminRouter.get(
  "/contracts/:id/download",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await createContractDownloadUrl({
      contractId: req.params.id,
      staff: req.staff,
    });
    res.json(result);
  }),
);

adminRouter.get(
  "/contracts/:id/audit-download",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await createContractDownloadUrl({
      contractId: req.params.id,
      staff: req.staff,
      audit: true,
    });
    res.json(result);
  }),
);

adminRouter.get(
  "/payment-settings",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin"]);
    throw new HttpError(410, "Legacy billing configuration is no longer supported.");
  }),
);

adminRouter.put(
  "/payment-settings",
  requireAdmin,
  asyncHandler(async (req, res) => {
    throw new HttpError(410, "Legacy billing configuration is no longer supported.");
  }),
);

adminRouter.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    const tickets = await SupportTicket.find(filter)
      .populate("userId assignedTo subscriptionId")
      .sort({ updatedAt: -1 });
    res.json({ tickets });
  }),
);

adminRouter.patch(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const update = {};

    if (req.body.status !== undefined) {
      update.status = req.body.status;
    }
    if (req.body.assignedTo !== undefined) {
      update.assignedTo = await resolveAssignedSupportAgentId(req.body.assignedTo);
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "ticket.updated",
      targetType: "support_ticket",
      targetId: String(ticket._id),
    });

    res.json({ ticket });
  }),
);

adminRouter.get(
  "/activity",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin"]);
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ logs: await enrichActivityLogs(logs) });
  }),
);

adminRouter.get(
  "/settings",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin"]);
    const settings = await AdminSetting.find({}).sort({ group: 1, key: 1 });
    res.json({ settings });
  }),
);

adminRouter.put(
  "/settings/:key",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const setting = await AdminSetting.findOneAndUpdate(
      { key: req.params.key },
      {
        key: req.params.key,
        value: req.body.value,
        group: req.body.group || "general",
      },
      { new: true, upsert: true },
    );
    res.json({ setting });
  }),
);

adminRouter.post(
  "/settings/staff-users",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const staffUser = await StaffUser.create({
      email: req.body.email,
      name: req.body.name,
      passwordHash,
      role: req.body.role || "support_agent",
      isActive: true,
    });
    res.status(201).json({ staffUser });
  }),
);
