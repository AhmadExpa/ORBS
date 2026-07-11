import { z } from "zod";

export const billingCycleSchema = z.enum(["monthly", "yearly", "contact_sales"]);

export const productPlanSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  yearlyDiscountPercent: z.number().min(0).max(100),
  features: z.array(z.string()).default([]),
  planType: z.string().default("standard"),
  billingCycles: z.array(billingCycleSchema).default(["monthly"]),
  isManaged: z.boolean().default(true),
  isCustom: z.boolean().default(false),
  contactSalesOnly: z.boolean().default(false),
  displayPriceLabel: z.string().optional(),
  serviceType: z.string().optional(),
  techStack: z.array(z.string()).default([]),
});

export const orderQuoteSchema = z.object({
  productPlanId: z.string().min(1),
  addonIds: z.array(z.string()).default([]),
  selectedRegionId: z.string().optional(),
  selectedImageId: z.string().optional(),
  selectedStorageId: z.string().optional(),
  storageQuantity: z.coerce.number().min(0).optional(),
  serviceConfiguration: z
    .object({
      answers: z.record(z.any()).default({}),
    })
    .passthrough()
    .optional(),
  finalNote: z.string().trim().max(2000).optional(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(3),
  category: z.string().min(2),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  message: z.string().min(10),
  serviceId: z.string().optional(),
  subscriptionId: z.string().optional(),
});

export const supportReplySchema = z.object({
  message: z.string().min(1),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  assignedTo: z.string().trim().nullable().optional(),
  publicSenderName: z.string().trim().min(1).max(80).optional(),
});
