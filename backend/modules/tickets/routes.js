import express from "express";
import { supportReplySchema, supportTicketSchema } from "../../lib/shared/index.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { attachCustomer, requireCustomer } from "../../middleware/require-customer.js";
import { attachStaff } from "../../middleware/require-staff.js";
import { uploadSupportAttachment } from "../../middleware/uploads.js";
import { HttpError } from "../../utils/http-error.js";
import { StaffUser, SupportMessage, SupportTicket, User } from "../../db/models/index.js";
import { recordActivity } from "../../services/activity-log-service.js";

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
    lastReplyAt: ticket.lastReplyAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

async function loadMessageActors(messages) {
  const customerIds = [...new Set(messages.filter((item) => item.senderType === "customer").map((item) => String(item.senderId)))];
  const staffIds = [...new Set(messages.filter((item) => item.senderType !== "customer").map((item) => String(item.senderId)))];

  const [customers, staffUsers] = await Promise.all([
    customerIds.length ? User.find({ _id: { $in: customerIds } }).select("name email") : [],
    staffIds.length ? StaffUser.find({ _id: { $in: staffIds } }).select("name role isActive") : [],
  ]);

  return {
    customerMap: new Map(customers.map((item) => [String(item._id), item])),
    staffMap: new Map(staffUsers.map((item) => [String(item._id), item])),
  };
}

async function serializeMessages(messages, req) {
  const { customerMap, staffMap } = await loadMessageActors(messages);

  return messages.map((message) => {
    const record = message.toObject();
    const customer = customerMap.get(String(message.senderId));
    const staffUser = staffMap.get(String(message.senderId));
    const senderName = message.senderType === "customer" ? customer?.name || customer?.email || "Customer" : staffUser?.name || "Support Team";
    const publicSenderName =
      message.senderType === "customer"
        ? customer?.name || customer?.email || "Customer"
        : record.publicSenderName || (message.senderType === "support_agent" ? senderName : "Support Team");

    if (req.staff) {
      return {
        ...record,
        senderName,
        publicSenderName,
      };
    }

    return {
      _id: record._id,
      senderType: message.senderType === "customer" ? "customer" : "support",
      displayName: message.senderType === "customer" ? "You" : publicSenderName,
      publicSenderName,
      message: record.message,
      attachments: record.attachments,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  });
}

async function resolvePublicSenderName({ req, ticket, payload }) {
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

  if (req.auth?.user && String(ticket.userId?._id || ticket.userId) === String(req.auth.user._id)) {
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

    const filter = req.staff ? {} : { userId: req.auth.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });
    res.json({ tickets });
  }),
);

ticketsRouter.post(
  "/",
  requireCustomer,
  uploadSupportAttachment.array("attachments", 3),
  asyncHandler(async (req, res) => {
    const payload = supportTicketSchema.parse(req.body);
    const ticket = await SupportTicket.create({
      userId: req.auth.user._id,
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority,
      status: "open",
      serviceId: payload.serviceId,
      subscriptionId: payload.subscriptionId,
      lastReplyAt: new Date(),
    });

    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "customer",
      senderId: req.auth.user._id,
      publicSenderName: req.auth.user.name || req.auth.user.email || "Customer",
      message: payload.message,
      attachments: (req.files || []).map((file) => `/files/uploads/support-attachments/${file.filename}`),
    });

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
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
      ticket: req.staff ? ticket.toObject() : serializeTicketForCustomer(ticket),
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

    const message = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: sender.senderType,
      senderId: sender.senderId,
      publicSenderName,
      message: payload.message,
      attachments: (req.files || []).map((file) => `/files/uploads/support-attachments/${file.filename}`),
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
