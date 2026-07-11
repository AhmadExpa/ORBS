import express from "express";
import { supportReplySchema, supportTicketSchema } from "../../lib/shared/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { attachCustomer } from "../../middleware/require-customer.js";
import { isDelegateActor, isSubscriptionAssignedToDelegate, requirePortalActor } from "../../middleware/require-portal-actor.js";
import { attachStaff } from "../../middleware/require-staff.js";
import { uploadSupportAttachment } from "../../middleware/uploads.js";
import { HttpError } from "../../utils/http-error.js";
import { CustomerDelegate, StaffUser, Subscription, SupportMessage, SupportTicket, User } from "../../db/models/index.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { persistUploadedFile } from "../../services/storage-service.js";

export const ticketsRouter = express.Router();

ticketsRouter.use(attachCustomer);
ticketsRouter.use(attachStaff);

function getSenderContext(req) {
  if (req.staff) {
    return {
      senderType: req.staff.role,
      senderId: req.staff._id,
      actorRole: req.staff.role,
    };
  }

  if (req.auth?.user) {
    if (isDelegateActor(req)) {
      return {
        senderType: "customer_delegate",
        senderId: req.auth.delegate._id,
        actorRole: "customer_delegate",
      };
    }

    return {
      senderType: "customer",
      senderId: req.auth.user._id,
      actorRole: "customer",
    };
  }

  throw new HttpError(401, "Authentication required.");
}

function serializeTicketForCustomer(ticket) {
  return {
    _id: ticket._id,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    serviceId: ticket.serviceId,
    subscriptionId: ticket.subscriptionId?._id || ticket.subscriptionId || null,
    createdByDelegateId: ticket.createdByDelegateId?._id || ticket.createdByDelegateId || null,
    lastReplyAt: ticket.lastReplyAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

async function loadMessageActors(messages) {
  const customerIds = [...new Set(messages.filter((item) => item.senderType === "customer").map((item) => String(item.senderId)))];
  const delegateIds = [...new Set(messages.filter((item) => item.senderType === "customer_delegate").map((item) => String(item.senderId)))];
  const staffIds = [...new Set(messages.filter((item) => !["customer", "customer_delegate"].includes(item.senderType)).map((item) => String(item.senderId)))];

  const [customers, delegates, staffUsers] = await Promise.all([
    customerIds.length ? User.find({ _id: { $in: customerIds } }).select("name email") : [],
    delegateIds.length ? CustomerDelegate.find({ _id: { $in: delegateIds } }).select("displayName username") : [],
    staffIds.length ? StaffUser.find({ _id: { $in: staffIds } }).select("name role isActive") : [],
  ]);

  return {
    customerMap: new Map(customers.map((item) => [String(item._id), item])),
    delegateMap: new Map(delegates.map((item) => [String(item._id), item])),
    staffMap: new Map(staffUsers.map((item) => [String(item._id), item])),
  };
}

async function serializeMessages(messages, req) {
  const { customerMap, delegateMap, staffMap } = await loadMessageActors(messages);

  return messages.map((message) => {
    const record = message.toObject?.() || message.toJSON?.() || message;
    const customer = customerMap.get(String(message.senderId));
    const delegate = delegateMap.get(String(message.senderId));
    const staffUser = staffMap.get(String(message.senderId));
    const isCustomerSide = ["customer", "customer_delegate"].includes(message.senderType);
    const senderName =
      message.senderType === "customer"
        ? customer?.name || customer?.email || "Customer"
        : message.senderType === "customer_delegate"
          ? delegate?.displayName || delegate?.username || record.publicSenderName || "Account agent"
          : staffUser?.name || "Support Team";
    const publicSenderName = isCustomerSide
      ? record.publicSenderName || senderName
      : record.publicSenderName || (message.senderType === "support_agent" ? senderName : "Support Team");

    if (req.staff) {
      return {
        ...record,
        senderName,
        publicSenderName,
      };
    }

    const isCurrentOwnerMessage = message.senderType === "customer" && !isDelegateActor(req);
    const isCurrentDelegateMessage =
      message.senderType === "customer_delegate" && isDelegateActor(req) && String(message.senderId) === String(req.auth.delegate._id);

    return {
      _id: record._id,
      senderType: isCustomerSide ? "customer" : "support",
      displayName: isCurrentOwnerMessage || isCurrentDelegateMessage ? "You" : publicSenderName,
      publicSenderName,
      message: record.message,
      attachments: record.attachments,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  });
}

async function resolvePublicSenderName({ req, ticket, payload }) {
  if (isDelegateActor(req)) {
    return req.auth.delegate.displayName || req.auth.delegate.username || "Account agent";
  }

  if (req.auth?.user) {
    return req.auth.user.name || req.auth.user.email || "Customer";
  }

  if (payload.publicSenderName) {
    return payload.publicSenderName;
  }

  if (req.staff?.role === "support_agent") {
    return req.staff.name;
  }

  if (ticket.assignedTo?.name) {
    return ticket.assignedTo.name;
  }

  if (ticket.assignedTo) {
    const assignedStaff = await StaffUser.findById(ticket.assignedTo).select("name role isActive");
    if (assignedStaff?.isActive && assignedStaff.role === "support_agent") {
      return assignedStaff.name;
    }
  }

  return "Support Team";
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

async function ensureTicketAccess(ticket, req) {
  if (req.staff) {
    return true;
  }

  if (isDelegateActor(req)) {
    const ownsTicket = String(ticket.userId?._id || ticket.userId) === String(req.auth.user._id);
    const ticketSubscriptionId = ticket.subscriptionId?._id || ticket.subscriptionId;
    const createdByDelegateId = ticket.createdByDelegateId?._id || ticket.createdByDelegateId;
    const allowedByService = ticketSubscriptionId && isSubscriptionAssignedToDelegate(req, ticketSubscriptionId);
    const allowedByCreator = createdByDelegateId && String(createdByDelegateId) === String(req.auth.delegate._id);

    if (ownsTicket && (allowedByService || allowedByCreator)) {
      return true;
    }
  } else if (req.auth?.user && String(ticket.userId?._id || ticket.userId) === String(req.auth.user._id)) {
    return true;
  }

  throw new HttpError(403, "You do not have access to this ticket.");
}

ticketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.staff && !req.auth?.user) {
      throw new HttpError(401, "Authentication required.");
    }

    let filter = req.staff ? {} : { userId: req.auth.user._id };
    if (!req.staff && isDelegateActor(req)) {
      const scopedFilters = [{ createdByDelegateId: req.auth.delegate._id }];
      if (req.auth.allowedSubscriptionIds?.length) {
        scopedFilters.push({ subscriptionId: { $in: req.auth.allowedSubscriptionIds } });
      }
      filter = {
        userId: req.auth.user._id,
        $or: scopedFilters,
      };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });
    res.json({ tickets });
  }),
);

ticketsRouter.post(
  "/",
  requirePortalActor,
  uploadSupportAttachment.array("attachments", 3),
  asyncHandler(async (req, res) => {
    const payload = supportTicketSchema.parse(req.body);
    let subscriptionId = payload.subscriptionId || null;
    if (isDelegateActor(req) && !subscriptionId) {
      throw new HttpError(400, "Choose an assigned service before creating an agent ticket.");
    }

    if (subscriptionId) {
      if (isDelegateActor(req) && !isSubscriptionAssignedToDelegate(req, subscriptionId)) {
        throw new HttpError(403, "This service is not assigned to your agent access.");
      }

      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        userId: req.auth.user._id,
        customerDeletedAt: null,
      });
      if (!subscription) {
        throw new HttpError(400, "Selected service is not available on this account.");
      }
      subscriptionId = subscription._id;
    }

    const attachments = await Promise.all(
      (req.files || []).map((file) => persistUploadedFile({ file, directory: "support-attachments" })),
    );
    const ticket = await SupportTicket.create({
      userId: req.auth.user._id,
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority,
      status: "open",
      serviceId: payload.serviceId,
      subscriptionId,
      createdByDelegateId: isDelegateActor(req) ? req.auth.delegate._id : null,
      lastReplyAt: new Date(),
    });

    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: isDelegateActor(req) ? "customer_delegate" : "customer",
      senderId: isDelegateActor(req) ? req.auth.delegate._id : req.auth.user._id,
      publicSenderName: await resolvePublicSenderName({ req, ticket, payload }),
      message: payload.message,
      attachments,
    });

    await recordActivity({
      actorId: isDelegateActor(req) ? req.auth.delegate._id : req.auth.user._id,
      actorRole: isDelegateActor(req) ? "customer_delegate" : "customer",
      action: "ticket.created",
      targetType: "support_ticket",
      targetId: String(ticket._id),
    });

    res.status(201).json({ ticket });
  }),
);

ticketsRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id).populate("userId assignedTo subscriptionId");
    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    await ensureTicketAccess(ticket, req);

    const messages = await SupportMessage.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
    res.json({
      ticket: req.staff ? ticket.toObject?.() || ticket.toJSON?.() || ticket : serializeTicketForCustomer(ticket),
      messages: await serializeMessages(messages, req),
    });
  }),
);

ticketsRouter.post(
  "/:id/messages",
  uploadSupportAttachment.array("attachments", 3),
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    await ensureTicketAccess(ticket, req);
    const payload = supportReplySchema.parse(req.body);
    const sender = getSenderContext(req);
    const publicSenderName = await resolvePublicSenderName({ req, ticket, payload });
    const attachments = await Promise.all(
      (req.files || []).map((file) => persistUploadedFile({ file, directory: "support-attachments" })),
    );

    const message = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: sender.senderType,
      senderId: sender.senderId,
      publicSenderName,
      message: payload.message,
      attachments,
    });

    ticket.lastReplyAt = new Date();
    if (req.staff && payload.status) {
      ticket.status = payload.status;
    }
    if (req.staff && req.body.assignedTo !== undefined) {
      ticket.assignedTo = await resolveAssignedSupportAgentId(payload.assignedTo);
    }
    await ticket.save();

    await recordActivity({
      actorId: sender.senderId,
      actorRole: sender.actorRole,
      action: "ticket.message_added",
      targetType: "support_ticket",
      targetId: String(ticket._id),
    });

    res.status(201).json({ message });
  }),
);
