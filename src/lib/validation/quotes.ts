import { z } from "zod";
import { addressSnapshotSchema } from "@/lib/validation/checkout";

export const createQuoteRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(9999),
  addressId: z.string().uuid(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const submitSellerQuoteSchema = z.object({
  quoteRequestId: z.string().uuid(),
  price: z.number().min(0),
  estimatedDays: z.number().int().min(1).max(365).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const placeQuoteOrderSchema = z.object({
  sellerQuoteId: z.string().uuid(),
  billingAddress: addressSnapshotSchema,
  billingType: z.enum(["individual", "corporate"]),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const quoteIdSchema = z.string().uuid();
