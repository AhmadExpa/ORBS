import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import {
  ActivityLog,
  CustomerContract,
  CustomerDelegate,
  Invoice,
  Order,
  PaymentSubmission,
  Subscription,
  SupportTicket,
  User,
} from "../../db/models/index.js";
import { requireCustomer, findUserFromRequest } from "../../middleware/require-customer.js";
import { isDelegateActor, requirePortalActor, serializeDelegateSession } from "../../middleware/require-portal-actor.js";
import { verifyClerkRequestToken } from "../../services/clerk-auth-service.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { syncCustomerProfile } from "../../services/customer-profile-service.js";

export const profilesRouter = express.Router();

async function verifyCustomerRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new HttpError(401, "Authentication required.");
  }

  const payload = await verifyClerkRequestToken(token);
  if (!payload?.sub) {
    throw new HttpError(401, "Unable to verify user.");
  }

  return payload;
}

function idOf(value) {
  return value?._id ? String(value._id) : String(value || "");
}

function mapById(records = []) {
  return new Map(records.map((record) => [idOf(record), record]));
}

function firstPresent(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function statusLabel(value) {
  return String(value || "")
    .replace(/[._]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function contractActivityTitle(action) {
  const titles = {
    "contract.created": "Service agreement created",
    "contract.signing_url_issued": "Signing link issued",
    "contract.turnstile_verified": "Agreement verification completed",
    "contract.documenso_document_created": "Agreement document prepared",
    "contract.documenso_document_recreated": "Agreement document refreshed",
    "contract.document_completed": "Agreement signed",
    "contract.pdf_downloaded": "Signed agreement retrieved",
    "contract.pdf_uploaded_to_r2": "Signed agreement stored",
    "contract.approved": "Service agreement approved",
    "contract.rejected": "Service agreement rejected",
    "contract.superseded": "Service agreement superseded",
  };

  return titles[action] || statusLabel(action);
}

function targetLabelFor(log, maps) {
  const targetId = idOf(log.targetId);

  if (log.targetType === "customer_delegate") {
    const delegate = maps.delegates.get(targetId);
    return firstPresent(delegate?.displayName, delegate?.username, "Account agent");
  }

  if (log.targetType === "support_ticket") {
    return firstPresent(maps.tickets.get(targetId)?.subject, "Support ticket");
  }

  if (log.targetType === "subscription") {
    const subscription = maps.subscriptions.get(targetId);
    return firstPresent(subscription?.productPlanId?.name, subscription?.metadata?.planName, "Managed service");
  }

  if (log.targetType === "order") {
    const order = maps.orders.get(targetId);
    return firstPresent(order?.productPlanId?.name, order?.metadata?.planName, "Service order");
  }

  if (log.targetType === "invoice") {
    const invoice = maps.invoices.get(targetId);
    return firstPresent(invoice?.invoiceNumber, invoice?.paymentReferenceCode, "Invoice");
  }

  if (log.targetType === "payment_submission") {
    const payment = maps.paymentSubmissions.get(targetId);
    return firstPresent(payment?.invoiceCode, payment?.gatewayPaymentId, "Payment");
  }

  if (log.targetType === "customer_contract") {
    const contract = maps.contracts.get(targetId);
    return firstPresent(contract?.contractNumber, "Service agreement");
  }

  return "Portal item";
}

function actorLabelFor(log, user, delegateMap) {
  if (log.actorRole === "customer_delegate") {
    const delegate = delegateMap.get(idOf(log.actorId));
    return firstPresent(delegate?.displayName, delegate?.username, "Account agent");
  }

  if (log.actorRole === "customer") {
    return firstPresent(user?.name, user?.email, "Account owner");
  }

  if (["admin", "support_agent", "system"].includes(log.actorRole)) {
    return "ElevenOrbits team";
  }

  return "Portal";
}

function activityRowFor(log, { user, maps }) {
  const targetLabel = targetLabelFor(log, maps);
  const actorLabel = actorLabelFor(log, user, maps.delegates);
  const targetId = idOf(log.targetId);
  const base = {
    id: idOf(log._id) || `${log.action}-${targetId}-${log.createdAt || ""}`,
    action: log.action,
    actorRole: log.actorRole,
    actorLabel,
    targetType: log.targetType,
    targetLabel,
    at: log.createdAt,
    status: "",
    href: "",
    type: "activity",
  };

  switch (log.action) {
    case "delegate.created":
      return {
        ...base,
        type: "delegate",
        title: `${actorLabel} created agent access`,
        description: targetLabel,
        href: "/portal/account",
      };
    case "delegate.updated":
      return {
        ...base,
        type: "delegate",
        title: `${actorLabel} updated agent access`,
        description: targetLabel,
        href: "/portal/account",
      };
    case "delegate.password_reset":
      return {
        ...base,
        type: "delegate",
        title: `${actorLabel} reset an agent password`,
        description: targetLabel,
        href: "/portal/account",
      };
    case "delegate.login":
      return {
        ...base,
        type: "delegate",
        title: `${targetLabel} signed in`,
        description: "Delegated portal access",
        href: "/portal/account",
      };
    case "ticket.created":
      return {
        ...base,
        type: "ticket",
        title: log.actorRole === "customer_delegate" ? `${actorLabel} opened a ticket` : "Support ticket opened",
        description: targetLabel,
        status: maps.tickets.get(targetId)?.status || "",
        href: targetId ? `/portal/support/${targetId}` : "/portal/support",
      };
    case "ticket.message_added":
      return {
        ...base,
        type: "ticket",
        title: log.actorRole === "customer_delegate" ? `${actorLabel} replied to a ticket` : "Ticket reply added",
        description: targetLabel,
        status: maps.tickets.get(targetId)?.status || "",
        href: targetId ? `/portal/support/${targetId}` : "/portal/support",
      };
    case "ticket.updated":
      return {
        ...base,
        type: "ticket",
        title: "Support ticket updated",
        description: targetLabel,
        status: maps.tickets.get(targetId)?.status || "",
        href: targetId ? `/portal/support/${targetId}` : "/portal/support",
      };
    case "payment.submitted":
    case "payment.succeeded":
    case "payment.dispute_created":
    case "payment.completed_via_wallet":
    case "payment.completed_via_stripe":
    case "renewal.completed_via_wallet":
    case "wallet.topup_completed_via_stripe":
      return {
        ...base,
        type: "payment",
        title:
          log.action === "payment.submitted"
            ? "Payment submitted"
            : log.action === "renewal.completed_via_wallet"
              ? "Renewal paid from wallet"
              : log.action === "wallet.topup_completed_via_stripe"
                ? "Wallet top-up completed"
                : "Payment completed",
        description: targetLabel,
        status: maps.paymentSubmissions.get(targetId)?.status || "",
        href: "/portal/payments",
      };
    case "stripe.card_saved":
    case "stripe.primary_card_updated":
    case "stripe.card_removed":
      return {
        ...base,
        type: "payment",
        title:
          log.action === "stripe.card_saved"
            ? "Card saved"
            : log.action === "stripe.primary_card_updated"
              ? "Primary card updated"
              : "Card removed",
        description: "Payment methods",
        href: "/portal/payments",
      };
    case "order.created":
      return {
        ...base,
        type: "order",
        title: "Service order placed",
        description: targetLabel,
        status: maps.orders.get(targetId)?.status || "",
        href: "/portal/services",
      };
    case "order.cancelled_by_customer":
      return {
        ...base,
        type: "order",
        title: "Service order cancelled",
        description: targetLabel,
        status: maps.orders.get(targetId)?.status || "",
        href: "/portal/services",
      };
    case "subscription.created":
    case "subscription.cancelled":
    case "subscription.cancelled_by_customer":
    case "subscription.deleted_from_portal":
      return {
        ...base,
        type: "service",
        title: log.action === "subscription.created" ? "Service subscription created" : "Service removed from portal",
        description: targetLabel,
        status: maps.subscriptions.get(targetId)?.status || "",
        href: "/portal/services",
      };
    case "contract.created":
    case "contract.signing_url_issued":
    case "contract.turnstile_verified":
    case "contract.documenso_document_created":
    case "contract.documenso_document_recreated":
    case "contract.document_completed":
    case "contract.pdf_downloaded":
    case "contract.pdf_uploaded_to_r2":
    case "contract.approved":
    case "contract.rejected":
    case "contract.superseded":
      return {
        ...base,
        type: "contract",
        title: contractActivityTitle(log.action),
        description: targetLabel,
        status: maps.contracts.get(targetId)?.status || "",
        href: "/portal/contracts",
      };
    default:
      return {
        ...base,
        title: statusLabel(log.action || "Portal activity"),
        description: targetLabel,
      };
  }
}

profilesRouter.post(
  "/sync",
  asyncHandler(async (req, res) => {
    const payload = await verifyCustomerRequest(req);
    const user = await syncCustomerProfile({
      payload,
      body: req.body,
    });

    res.json({ user });
  }),
);

profilesRouter.get(
  "/account-status",
  asyncHandler(async (req, res) => {
    // Intentionally does NOT use requireCustomer (which rejects non-active
    // accounts) so the portal gate can read the status with a 200 response.
    const authContext = await findUserFromRequest(req, { ignoreInvalidToken: true });
    const user = authContext?.user;

    if (!user) {
      res.json({ status: "active", reason: "" });
      return;
    }

    res.json({
      status: user.accountStatus || "active",
      reason: user.accountStatusReason || "",
    });
  }),
);

profilesRouter.get(
  "/me",
  requirePortalActor,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });
    const user = await User.findById(req.auth.user._id);
    res.json({
      user,
      actorType: isDelegateActor(req) ? "delegate" : "owner",
      delegate: isDelegateActor(req) ? serializeDelegateSession(req.auth.delegate, user) : null,
    });
  }),
);

profilesRouter.get(
  "/activity",
  requirePortalActor,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth.user._id);
    if (!user) {
      throw new HttpError(404, "Customer profile not found.");
    }

    const [delegates, tickets, subscriptions, orders, invoices, paymentSubmissions, contracts] = await Promise.all([
      CustomerDelegate.find({ userId: user._id }).sort({ createdAt: -1 }),
      SupportTicket.find({ userId: user._id }).sort({ updatedAt: -1 }),
      Subscription.find({ userId: user._id }).populate("productPlanId").sort({ updatedAt: -1 }),
      Order.find({ userId: user._id }).populate("productPlanId").sort({ updatedAt: -1 }),
      Invoice.find({ userId: user._id }).sort({ updatedAt: -1 }),
      PaymentSubmission.find({ userId: user._id }).sort({ submittedAt: -1 }),
      CustomerContract.find({ clerkUserId: user.clerkId }).sort({ createdAt: -1 }),
    ]);

    const delegateIds = delegates.map((item) => idOf(item)).filter(Boolean);
    const ticketIds = tickets.map((item) => idOf(item)).filter(Boolean);
    const subscriptionIds = subscriptions.map((item) => idOf(item)).filter(Boolean);
    const orderIds = orders.map((item) => idOf(item)).filter(Boolean);
    const invoiceIds = invoices.map((item) => idOf(item)).filter(Boolean);
    const paymentIds = paymentSubmissions.map((item) => idOf(item)).filter(Boolean);
    const contractIds = contracts.map((item) => idOf(item)).filter(Boolean);
    const actorIds = [idOf(user._id), idOf(user.clerkId), ...delegateIds].filter(Boolean);
    const targetFilters = [
      { targetType: "user", targetId: idOf(user._id) },
      ticketIds.length ? { targetType: "support_ticket", targetId: { $in: ticketIds } } : null,
      subscriptionIds.length ? { targetType: "subscription", targetId: { $in: subscriptionIds } } : null,
      orderIds.length ? { targetType: "order", targetId: { $in: orderIds } } : null,
      invoiceIds.length ? { targetType: "invoice", targetId: { $in: invoiceIds } } : null,
      paymentIds.length ? { targetType: "payment_submission", targetId: { $in: paymentIds } } : null,
      delegateIds.length ? { targetType: "customer_delegate", targetId: { $in: delegateIds } } : null,
      contractIds.length ? { targetType: "customer_contract", targetId: { $in: contractIds } } : null,
    ].filter(Boolean);
    const activityFilter = {
      $or: [
        actorIds.length ? { actorId: { $in: actorIds } } : null,
        ...targetFilters,
      ].filter(Boolean),
    };

    const logs = activityFilter.$or.length
      ? await ActivityLog.find(activityFilter).sort({ createdAt: -1 }).limit(80)
      : [];

    const maps = {
      delegates: mapById(delegates),
      tickets: mapById(tickets),
      subscriptions: mapById(subscriptions),
      orders: mapById(orders),
      invoices: mapById(invoices),
      paymentSubmissions: mapById(paymentSubmissions),
      contracts: mapById(contracts),
    };
    const allowedTargets = {
      user: new Set([idOf(user._id)]),
      support_ticket: new Set(ticketIds),
      subscription: new Set(subscriptionIds),
      order: new Set(orderIds),
      invoice: new Set(invoiceIds),
      payment_submission: new Set(paymentIds),
      customer_delegate: new Set(delegateIds),
      customer_contract: new Set(contractIds),
    };
    const ownedActorIds = new Set(actorIds);

    const activities = logs
      .filter((log) => {
        if (ownedActorIds.has(idOf(log.actorId))) {
          return true;
        }

        return Boolean(allowedTargets[log.targetType]?.has(idOf(log.targetId)));
      })
      .map((log) => activityRowFor(log, { user, maps }))
      .slice(0, 12);

    res.json({ activities });
  }),
);

profilesRouter.patch(
  "/me",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const allowedFields = ["phone", "company", "address", "billingAddress"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );
    const user = await User.findByIdAndUpdate(req.auth.user._id, updates, { new: true });
    res.json({ user });
  }),
);
