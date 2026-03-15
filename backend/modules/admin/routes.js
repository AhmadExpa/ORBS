import express from "express";
import bcrypt from "bcryptjs";
import {
  Addon,
  ActivityLog,
  AdminSetting,
  Invoice,
  Order,
  PaymentSetting,
  PaymentSubmission,
  ProductPlan,
  ServiceCategory,
  StaffUser,
  Subscription,
  SupportTicket,
  User,
} from "../../db/models/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { requireAdmin, requireStaff } from "../../middleware/require-staff.js";
import { uploadQrCode } from "../../middleware/uploads.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { generateInvoicePdf } from "../../services/invoice-service.js";
import { env } from "../../config/env.js";
import { addBillingPeriod, processSubscriptionRenewals } from "../../services/billing-cycle-service.js";

export const adminRouter = express.Router();

adminRouter.use(requireStaff);

function ensureRole(req, roles) {
  if (!roles.includes(req.staff.role)) {
    throw new HttpError(403, "You do not have permission for this action.");
  }
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

adminRouter.get(
  "/analytics/summary",
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals();

    const [usersCount, subscriptions, paymentSubmissions, openTickets] = await Promise.all([
      User.countDocuments(),
      Subscription.find({}),
      PaymentSubmission.find({}).sort({ submittedAt: -1 }).limit(5),
      SupportTicket.find({ status: { $in: ["open", "pending"] } }).sort({ updatedAt: -1 }).limit(5),
    ]);

    const monthlyRecurringRevenue = subscriptions
      .filter((sub) => sub.status === "active" && sub.billingCycle === "monthly")
      .reduce((sum, subscription) => sum + Number(subscription.metadata?.billingAmount || 0), 0);

    const yearlyRecurringRevenue = subscriptions
      .filter((sub) => sub.status === "active" && sub.billingCycle === "yearly")
      .reduce((sum, subscription) => sum + Number(subscription.metadata?.billingAmount || 0), 0);

    res.json({
      totalUsers: usersCount,
      totalSubscriptions: subscriptions.length,
      monthlyRecurringRevenue,
      yearlyRecurringRevenue,
      recentPayments: paymentSubmissions,
      recentTickets: openTickets,
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

adminRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const [categories, plans, addons] = await Promise.all([
      ServiceCategory.find({}).sort({ sortOrder: 1 }),
      ProductPlan.find({}).populate("categoryId").sort({ sortOrder: 1 }),
      Addon.find({}).populate("categoryId").sort({ name: 1 }),
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

adminRouter.get(
  "/pricing",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin", "support_agent"]);
    const plans = await ProductPlan.find({}).populate("categoryId").sort({ sortOrder: 1 });
    res.json({ plans });
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
    res.json({ subscriptions });
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
    await invoice.save();
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
    const { status, adminRemarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      throw new HttpError(400, "Review status must be approved or rejected.");
    }

    const submission = await PaymentSubmission.findById(req.params.id);
    if (!submission) {
      throw new HttpError(404, "Payment submission not found.");
    }

    if (submission.status !== "pending_verification") {
      throw new HttpError(400, "This payment has already been completed or reviewed.");
    }

    const [order, subscription, invoice, customer] = await Promise.all([
      Order.findById(submission.orderId),
      Subscription.findById(submission.subscriptionId).populate("productPlanId"),
      Invoice.findOne({ orderId: submission.orderId }),
      User.findById(submission.userId),
    ]);

    submission.status = status;
    submission.adminRemarks = adminRemarks;
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.staff._id;
    await submission.save();

    if (submission.submissionType === "wallet_topup") {
      if (!customer) {
        throw new HttpError(404, "Customer not found.");
      }

      if (status === "approved") {
        customer.accountBalance = Number(customer.accountBalance || 0) + Number(submission.amount || 0);
        await customer.save();
        await processSubscriptionRenewals({ userIds: [customer._id] });
      }

      await recordActivity({
        actorId: req.staff._id,
        actorRole: req.staff.role,
        action: `wallet.topup_${status}`,
        targetType: "payment_submission",
        targetId: String(submission._id),
        metadata: {
          amount: submission.amount,
          remarks: adminRemarks,
        },
      });

      res.json({ submission, user: customer });
      return;
    }

    if (order) {
      order.status = status;
      await order.save();
    }

    if (subscription) {
      subscription.status = status === "approved" ? "active" : "pending_verification";
      subscription.startDate = status === "approved" ? new Date() : subscription.startDate;
      subscription.renewalDate =
        status === "approved" ? addBillingPeriod(new Date(), subscription.billingCycle) : subscription.renewalDate;
      subscription.metadata = {
        ...subscription.metadata,
        billingAmount: order?.totalAmount || 0,
      };
      await subscription.save();
    }

    if (invoice) {
      invoice.status = status === "approved" ? "paid" : "rejected";
      invoice.paidAt = status === "approved" ? new Date() : undefined;
      invoice.paymentMethodType = submission.paymentMethodType;
      invoice.paymentReferenceCode = submission.invoiceCode;
      const pdfData = await generateInvoicePdf({
        invoice,
        customer,
        planName: subscription?.productPlanId?.name || "Managed Service",
        supportEmail: env.supportEmail,
      });
      invoice.pdfPath = pdfData.pdfPath;
      invoice.pdfUrl = pdfData.pdfUrl;
      await invoice.save();
    }

    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: `payment.${status}`,
      targetType: "payment_submission",
      targetId: String(submission._id),
      metadata: {
        remarks: adminRemarks,
      },
    });

    res.json({ submission, order, subscription, invoice });
  }),
);

adminRouter.get(
  "/payment-settings",
  asyncHandler(async (req, res) => {
    ensureRole(req, ["admin"]);
    const paymentSetting = await PaymentSetting.findOne({}).sort({ updatedAt: -1 });
    res.json({ paymentSetting });
  }),
);

adminRouter.put(
  "/payment-settings",
  requireAdmin,
  uploadQrCode.single("qrCode"),
  asyncHandler(async (req, res) => {
    const current = await PaymentSetting.findOne({}).sort({ updatedAt: -1 });
    const update = {
      title: req.body.title || current?.title || "Primary Manual Payment",
      paymentLink: req.body.paymentLink ?? current?.paymentLink,
      instructions: req.body.instructions ?? current?.instructions,
      isActive: req.body.isActive ? req.body.isActive === "true" : current?.isActive ?? true,
      supportedFor: req.body.supportedFor
        ? Array.isArray(req.body.supportedFor)
          ? req.body.supportedFor
          : String(req.body.supportedFor).split(",").map((item) => item.trim())
        : current?.supportedFor || [],
    };

    if (req.file) {
      update.qrCodeImageUrl = `/files/uploads/qr-codes/${req.file.filename}`;
    } else if (req.body.removeQrCode === "true") {
      update.qrCodeImageUrl = "";
    } else {
      update.qrCodeImageUrl = current?.qrCodeImageUrl || "";
    }

    const paymentSetting = current
      ? await PaymentSetting.findByIdAndUpdate(current._id, update, { new: true })
      : await PaymentSetting.create(update);

    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "payment_settings.updated",
      targetType: "payment_setting",
      targetId: String(paymentSetting._id),
    });

    res.json({ paymentSetting });
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
    res.json({ logs });
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
