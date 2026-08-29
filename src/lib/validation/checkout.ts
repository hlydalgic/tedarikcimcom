import { z } from "zod";

const tcNoSchema = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{11}$/.test(v), "TC kimlik no 11 haneli olmalı.");

export const addressSnapshotSchema = z.object({
  title: z.string().trim().max(80).optional(),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(30),
  city: z.string().trim().min(1),
  district: z.string().trim().min(1),
  address_line: z.string().trim().min(5).max(500),
  postal_code: z.string().trim().max(20).optional(),
  tc_no: tcNoSchema,
  company_name: z.string().trim().max(200).optional(),
  tax_number: z.string().trim().max(20).optional(),
  tax_office: z.string().trim().max(100).optional(),
});

export const checkoutPayloadSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(9999),
        })
      )
      .min(1),
    shop_shipping: z
      .record(z.string(), z.object({ amount: z.number().min(0) }))
      .optional(),
    shipping_address: addressSnapshotSchema,
    billing_address: addressSnapshotSchema,
    billing_type: z.enum(["individual", "corporate"]),
    notes: z.string().trim().max(2000).optional().nullable(),
    currency: z.string().length(3).default("TRY"),
  })
  .superRefine((data, ctx) => {
    if (data.billing_type !== "corporate") return;

    const addr = data.billing_address;
    if (!addr.company_name || addr.company_name.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Şirket adı gerekli.",
        path: ["billing_address", "company_name"],
      });
    }
    const tax = (addr.tax_number ?? "").replace(/\s/g, "");
    if (!/^\d{10,11}$/.test(tax)) {
      ctx.addIssue({
        code: "custom",
        message: "Vergi no 10 veya 11 haneli olmalı.",
        path: ["billing_address", "tax_number"],
      });
    }
    if (!addr.tax_office || addr.tax_office.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Vergi dairesi gerekli.",
        path: ["billing_address", "tax_office"],
      });
    }
  });

export type CheckoutPayloadInput = z.infer<typeof checkoutPayloadSchema>;
