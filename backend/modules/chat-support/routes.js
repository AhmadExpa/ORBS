import express from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { SupportMessage, SupportTicket } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { requireSameOrigin } from "../../middleware/csrf.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { recordActivity } from "../../services/activity-log-service.js";
import {
  sendSupportTicketConfirmationEmail,
  sendSupportTicketVerificationEmail,
} from "../../services/email-service.js";
import { getPaymentNetworkSignal } from "../../services/payment-preflight-service.js";
import { getSupportAssistantInsight } from "../../services/openrouter-support-service.js";
import {
  buildCustomerSupportRequester,
  createSupportPinSession,
  createSupportTicketSubject,
  createSupportVerificationCode,
  hashSupportVerificationCode,
  isCustomerSupportPinValid,
  isSupportVerificationCodeValid,
  reserveSupportTicketNumber,
  verifySupportPinSession,
} from "../../services/support-chat-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";

export const chatSupportRouter = express.Router();

const visitorTicketSchema = z.object({
  initialQuery: z.string().trim().min(3).max(500),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  question: z.string().trim().min(10).max(4000),
});

const visitorVerificationSchema = z.object({
  ticketNumber: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  code: z.string().trim().regex(/^\d{6}$/u, "Enter the 6-digit verification code."),
});

const supportPinSchema = z.object({
  pin: z.string().trim().regex(/^\d{6}$/u, "Enter your 6-digit Support PIN."),
});

const customerTicketSchema = z.object({
  pinSessionToken: z.string().min(20),
  question: z.string().trim().min(10).max(4000),
});

const assistantTurnSchema = z.object({
  phase: z.enum(["visitor_initial"]),
  message: z.string().trim().min(3).max(1000),
});

function supportNetworkContext(req) {
  const network = getPaymentNetworkSignal(req);
  return {
    maskedIp: network.maskedIp,
    country: network.country,
    secureTransport: network.secureTransport,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    language: String(req.headers["accept-language"] || "").slice(0, 120),
  };
}

chatSupportRouter.use(requireSameOrigin);

chatSupportRouter.post(
  "/assistant",
  rateLimit({
    name: "chat-support-assistant",
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = assistantTurnSchema.parse(req.body);
    const insight = await getSupportAssistantInsight({
      stage: "initial",
      requesterType: req.auth?.user ? "customer" : "visitor",
      initialQuery: payload.message,
    });

    res.json({
      reply: insight.customerReply,
      clarifyingQuestion: insight.clarifyingQuestion,
      assistantAvailable: insight.available,
    });
  }),
);

chatSupportRouter.post(
  "/visitor/tickets",
  rateLimit({
    name: "chat-support-visitor-ticket",
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyFn: (req) => req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = visitorTicketSchema.parse(req.body);
    const assistantInsight = await getSupportAssistantInsight({
      stage: "ticket",
      requesterType: "visitor",
      initialQuery: payload.initialQuery,
      question: payload.question,
    });
    const ticketNumber = await reserveSupportTicketNumber();
    const verificationCode = createSupportVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const requester = {
      name: "Website visitor",
      email: payload.email,
      network: supportNetworkContext(req),
    };

    const ticket = await SupportTicket.create({
      userId: null,
      ticketNumber,
      source: "chat_widget",
      requesterType: "visitor",
      requester,
      verificationStatus: "pending",
      verifiedAt: null,
      emailVerification: {
        codeHash: hashSupportVerificationCode({
          ticketNumber,
          email: payload.email,
          code: verificationCode,
        }),
        expiresAt: verificationExpiresAt.toISOString(),
        attempts: 0,
        deliveryStatus: "pending",
      },
      aiTriage: {
        available: assistantInsight.available,
        model: assistantInsight.model,
        summary: assistantInsight.summary,
        agentNotes: assistantInsight.agentNotes,
        clarifyingQuestion: assistantInsight.clarifyingQuestion,
        possibleQuotationRequest: assistantInsight.possibleQuotationRequest,
        requiresUrgentReview: assistantInsight.requiresUrgentReview,
        generatedAt: new Date().toISOString(),
      },
      subject: assistantInsight.subject || createSupportTicketSubject(payload.initialQuery),
      category: assistantInsight.category,
      priority: assistantInsight.priority,
      status: "pending",
      serviceId: "",
      lastReplyAt: new Date(),
    });

    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "visitor",
      senderId: `visitor:${ticket._id}`,
      publicSenderName: payload.email,
      message: `Initial request\n${payload.initialQuery}\n\nQuestion and details\n${payload.question}`,
      attachments: [],
    });

    const emailDelivery = await sendSupportTicketVerificationEmail({
      email: payload.email,
      ticketNumber,
      verificationCode,
      question: payload.question.slice(0, 600),
    });

    ticket.emailVerification = {
      ...ticket.emailVerification,
      deliveryStatus: emailDelivery.status,
      deliveryCode: emailDelivery.code,
      messageId: emailDelivery.messageId || "",
    };
    if (!emailDelivery.delivered) {
      ticket.verificationStatus = "delivery_failed";
    }
    await ticket.save();

    await recordActivity({
      actorId: payload.email,
      actorRole: "visitor",
      action: "ticket.created_from_chat",
      targetType: "support_ticket",
      targetId: String(ticket._id),
      metadata: {
        ticketNumber,
        verificationStatus: ticket.verificationStatus,
      },
    });

    res.status(201).json({
      ticketNumber,
      emailSent: emailDelivery.delivered,
      emailStatus: emailDelivery.code,
      email: payload.email,
      expiresAt: verificationExpiresAt.toISOString(),
      assistantMessage: assistantInsight.customerReply,
      clarifyingQuestion: assistantInsight.clarifyingQuestion,
      message: emailDelivery.delivered
        ? "Your ticket was created. Check your email for the 6-digit verification code."
        : `Your ticket was created, but the verification email could not be delivered. Contact ${env.supportEmail} and include your ticket number.`,
    });
  }),
);

chatSupportRouter.post(
  "/visitor/verify",
  rateLimit({
    name: "chat-support-visitor-verify",
    windowMs: 15 * 60 * 1000,
    max: 12,
    keyFn: (req) => req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = visitorVerificationSchema.parse(req.body);
    const ticket = await SupportTicket.findOne({
      ticketNumber: payload.ticketNumber,
      requesterType: "visitor",
    });

    if (!ticket || String(ticket.requester?.email || "").toLowerCase() !== payload.email) {
      throw new HttpError(400, "The ticket, email, or verification code is incorrect.");
    }

    if (ticket.verificationStatus === "verified") {
      res.json({
        verified: true,
        ticketNumber: ticket.ticketNumber,
        message: "Your email is already verified. Our team will review your request.",
      });
      return;
    }

    const verification = ticket.emailVerification || {};
    const attempts = Number(verification.attempts || 0);
    if (attempts >= 5) {
      throw new HttpError(429, "Too many incorrect codes. Contact support with your ticket number.");
    }

    const expiresAt = new Date(verification.expiresAt || 0);
    if (!expiresAt.getTime() || expiresAt.getTime() < Date.now()) {
      ticket.verificationStatus = "expired";
      await ticket.save();
      throw new HttpError(410, "This verification code expired. Start a new chat request.");
    }

    const valid = isSupportVerificationCodeValid({
      ticketNumber: ticket.ticketNumber,
      email: payload.email,
      code: payload.code,
      expectedHash: verification.codeHash,
    });
    if (!valid) {
      ticket.emailVerification = {
        ...verification,
        attempts: attempts + 1,
      };
      await ticket.save();
      throw new HttpError(400, "That verification code is incorrect.");
    }

    ticket.verificationStatus = "verified";
    ticket.verifiedAt = new Date();
    ticket.status = "open";
    ticket.emailVerification = {
      ...verification,
      codeHash: "",
      verifiedAt: ticket.verifiedAt.toISOString(),
    };
    await ticket.save();

    await recordActivity({
      actorId: payload.email,
      actorRole: "visitor",
      action: "ticket.email_verified",
      targetType: "support_ticket",
      targetId: String(ticket._id),
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    res.json({
      verified: true,
      ticketNumber: ticket.ticketNumber,
      message: "Email verified. Stay tuned—once our team reviews your request, we will send the next response or quotation by email.",
    });
  }),
);

chatSupportRouter.post(
  "/customer/verify-pin",
  requireCustomer,
  rateLimit({
    name: "chat-support-pin",
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = supportPinSchema.parse(req.body);
    const user = req.auth.user;

    if (!isCustomerSupportPinValid(user, payload.pin)) {
      throw new HttpError(400, "That Support PIN is incorrect. Find it in Portal → Account → Support & security.");
    }

    res.json({
      verified: true,
      pinSessionToken: createSupportPinSession(user),
      customerName: user.name || user.email || "Customer",
      message: "Support PIN verified. Tell us what you need help with.",
    });
  }),
);

chatSupportRouter.post(
  "/customer/tickets",
  requireCustomer,
  rateLimit({
    name: "chat-support-customer-ticket",
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyFn: (req) => req.auth?.clerkId || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = customerTicketSchema.parse(req.body);
    const user = req.auth.user;
    verifySupportPinSession(payload.pinSessionToken, user);

    const assistantInsight = await getSupportAssistantInsight({
      stage: "ticket",
      requesterType: "customer",
      question: payload.question,
    });
    const ticketNumber = await reserveSupportTicketNumber();
    const requester = {
      ...buildCustomerSupportRequester(user),
      network: supportNetworkContext(req),
      supportPinValidatedAt: new Date().toISOString(),
    };
    const ticket = await SupportTicket.create({
      userId: user._id,
      ticketNumber,
      source: "chat_widget",
      requesterType: "customer",
      requester,
      verificationStatus: "support_pin_verified",
      verifiedAt: new Date(),
      aiTriage: {
        available: assistantInsight.available,
        model: assistantInsight.model,
        summary: assistantInsight.summary,
        agentNotes: assistantInsight.agentNotes,
        clarifyingQuestion: assistantInsight.clarifyingQuestion,
        possibleQuotationRequest: assistantInsight.possibleQuotationRequest,
        requiresUrgentReview: assistantInsight.requiresUrgentReview,
        generatedAt: new Date().toISOString(),
      },
      subject: assistantInsight.subject || createSupportTicketSubject(payload.question),
      category: assistantInsight.category,
      priority: assistantInsight.priority,
      status: "open",
      serviceId: "",
      lastReplyAt: new Date(),
    });

    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "customer",
      senderId: user._id,
      publicSenderName: user.name || user.email || "Customer",
      message: payload.question,
      attachments: [],
    });

    const emailDelivery = await sendSupportTicketConfirmationEmail({
      customer: user,
      ticket,
      question: payload.question.slice(0, 600),
    });

    await recordActivity({
      actorId: user._id,
      actorRole: "customer",
      action: "ticket.created_from_chat",
      targetType: "support_ticket",
      targetId: String(ticket._id),
      metadata: {
        ticketNumber,
        supportPinValidated: true,
        emailStatus: emailDelivery.code,
      },
    });

    res.status(201).json({
      ticketId: ticket._id,
      ticketNumber,
      emailSent: emailDelivery.delivered,
      emailStatus: emailDelivery.code,
      email: user.email,
      assistantMessage: assistantInsight.customerReply,
      clarifyingQuestion: assistantInsight.clarifyingQuestion,
      message: emailDelivery.delivered
        ? "Your ticket is in the support queue. Check your email for the confirmation."
        : "Your ticket is in the support queue and available in the customer portal.",
    });
  }),
);
