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

export const placeQuoteOrderSchema = z
  .object({
    sellerQuoteId: z.string().uuid(),
    billingAddress: addressSnapshotSchema,
    billingType: z.enum(["individual", "corporate"]),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.billingType !== "corporate") return;

    const addr = data.billingAddress;
    if (!addr.company_name || addr.company_name.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Şirket adı gerekli.",
        path: ["billingAddress", "company_name"],
      });
    }
    const tax = (addr.tax_number ?? "").replace(/\s/g, "");
    if (!/^\d{10,11}$/.test(tax)) {
      ctx.addIssue({
        code: "custom",
        message: "Vergi no 10 veya 11 haneli olmalı.",
        path: ["billingAddress", "tax_number"],
      });
    }
    if (!addr.tax_office || addr.tax_office.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Vergi dairesi gerekli.",
        path: ["billingAddress", "tax_office"],
      });
    }
  });

export const quoteIdSchema = z.string().uuid();
