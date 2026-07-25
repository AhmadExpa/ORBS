import express from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AiAdvisorConversation, AiAdvisorMessage } from "../../db/models/index.js";
import { withTransaction } from "../../db/postgres-client.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { requireSameOrigin } from "../../middleware/csrf.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { getAiAdvisorReply, loadAiAdvisorCatalog } from "../../services/ai-advisor-service.js";
import {
  getAiAdvisorUsage,
  refundAiAdvisorMessage,
  reserveAiAdvisorMessage,
} from "../../services/ai-advisor-usage-service.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";

export const aiAdvisorRouter = express.Router();

const createConversationSchema = z.object({
  title: z.string().trim().min(3).max(80).optional(),
});

const advisorMessageSchema = z.object({
  message: z.string().trim().min(3).max(4000),
});

function serializeConversation(conversation) {
  return {
    _id: conversation._id,
    title: conversation.title,
    preview: conversation.preview,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function serializeMessage(message) {
  return {
    _id: message._id,
    role: message.role,
    content: message.content,
    recommendations: message.recommendations || [],
    nextSteps: message.nextSteps || [],
    shouldContactTeam: Boolean(message.shouldContactTeam),
    createdAt: message.createdAt,
  };
}

function conversationTitle(message) {
  const normalized = String(message || "").replace(/\s+/gu, " ").trim();
  if (!normalized) {
    return "New advisory conversation";
  }
  return normalized.length > 64
    ? `${normalized.slice(0, 61).trimEnd()}...`
    : normalized;
}

async function requireOwnedConversation(conversationId, userId) {
  const conversation = await AiAdvisorConversation.findOne({
    _id: conversationId,
    userId,
  });
  if (!conversation) {
    throw new HttpError(404, "AI Advisor conversation not found.");
  }
  return conversation;
}

aiAdvisorRouter.use(requireCustomer);
aiAdvisorRouter.use(requireSameOrigin);

aiAdvisorRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth.user._id;
    const [usage, conversations] = await Promise.all([
      getAiAdvisorUsage(userId),
      AiAdvisorConversation.find({ userId }).sort({ lastMessageAt: -1 }).limit(40),
    ]);

    res.json({
      configured: Boolean(env.openRouterApiKey),
      usage,
      conversations: conversations.map(serializeConversation),
    });
  }),
);

aiAdvisorRouter.post(
  "/conversations",
  rateLimit({
    name: "ai-advisor-create-conversation",
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyFn: (req) => req.auth?.user?._id || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = createConversationSchema.parse(req.body || {});
    const conversation = await AiAdvisorConversation.create({
      userId: req.auth.user._id,
      title: payload.title || "New advisory conversation",
      preview: "",
      status: "active",
      lastMessageAt: new Date(),
    });

    res.status(201).json({ conversation: serializeConversation(conversation) });
  }),
);

aiAdvisorRouter.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const userId = req.auth.user._id;
    const conversation = await requireOwnedConversation(req.params.id, userId);
    const messages = await AiAdvisorMessage.find({
      userId,
      conversationId: conversation._id,
    }).sort({ createdAt: -1 }).limit(100);

    res.json({
      conversation: serializeConversation(conversation),
      messages: messages.reverse().map(serializeMessage),
    });
  }),
);

aiAdvisorRouter.post(
  "/conversations/:id/messages",
  rateLimit({
    name: "ai-advisor-message",
    windowMs: 10 * 60 * 1000,
    max: 30,
    keyFn: (req) => req.auth?.user?._id || req.ip,
  }),
  asyncHandler(async (req, res) => {
    const payload = advisorMessageSchema.parse(req.body);
    const userId = req.auth.user._id;
    const conversation = await requireOwnedConversation(req.params.id, userId);
    const priorMessages = await AiAdvisorMessage.find({
      userId,
      conversationId: conversation._id,
    }).sort({ createdAt: -1 }).limit(12);
    const catalog = await loadAiAdvisorCatalog();
    const usageDate = new Date();
    let creditReserved = false;

    try {
      const usage = await reserveAiAdvisorMessage(userId, { date: usageDate });
      creditReserved = true;
      const reply = await getAiAdvisorReply({
        question: payload.message,
        history: priorMessages.reverse().map((message) => ({
          role: message.role,
          content: message.content,
        })),
        catalog,
      });

      let assistantMessage;
      await withTransaction(async () => {
        await AiAdvisorMessage.create({
          userId,
          conversationId: conversation._id,
          role: "user",
          content: payload.message,
        });
        assistantMessage = await AiAdvisorMessage.create({
          userId,
          conversationId: conversation._id,
          role: "assistant",
          content: reply.answer,
          recommendations: reply.recommendations,
          nextSteps: reply.nextSteps,
          shouldContactTeam: reply.shouldContactTeam,
          model: reply.model,
          promptTokens: reply.usage.promptTokens,
          completionTokens: reply.usage.completionTokens,
        });

        if (!conversation.preview) {
          conversation.title = conversationTitle(payload.message);
        }
        conversation.preview = payload.message.slice(0, 180);
        conversation.lastMessageAt = new Date();
        await conversation.save();

        await recordActivity({
          actorId: userId,
          actorRole: "customer",
          action: "ai_advisor.message_sent",
          targetType: "ai_advisor_conversation",
          targetId: String(conversation._id),
          metadata: {
            period: usage.period,
            messagesUsed: usage.used,
            recommendationCount: reply.recommendations.length,
          },
        });
      });

      res.status(201).json({
        conversation: serializeConversation(conversation),
        message: serializeMessage(assistantMessage),
        usage,
      });
    } catch (error) {
      if (creditReserved) {
        await refundAiAdvisorMessage(userId, { date: usageDate }).catch(() => {});
      }
      throw error;
    }
  }),
);
