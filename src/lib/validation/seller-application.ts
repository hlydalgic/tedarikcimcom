import { z } from "zod";

export const COMPANY_TYPES = ["sahis", "limited", "anonim"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  sahis: "Şahıs",
  limited: "Limited",
  anonim: "Anonim",
};

const ibanSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, "").toUpperCase())
  .refine(
    (v) => /^TR\d{24}$/.test(v),
    "Geçerli bir TR IBAN girin (26 karakter)."
  );

function validateTaxNumber(
  companyType: CompanyType,
  taxNumber: string,
  ctx: z.RefinementCtx
) {
  const digits = taxNumber.replace(/\s/g, "");
  if (companyType === "sahis") {
    if (!/^\d{11}$/.test(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Şahıs hesapları için 11 haneli TCKN girin.",
        path: ["tax_number"],
      });
    }
    return;
  }
  if (!/^\d{10}$/.test(digits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Limited/Anonim şirketler için 10 haneli VKN girin.",
      path: ["tax_number"],
    });
  }
}

export const sellerApplicationStep1Schema = z
  .object({
    company_type: z.enum(COMPANY_TYPES, {
      message: "Şirket türü seçin.",
    }),
    company_name: z
      .string()
      .trim()
      .min(2, "Şirket adı / unvan en az 2 karakter olmalı.")
      .max(200),
    tax_number: z.string().trim().min(1, "Vergi kimlik numarası gerekli."),
    tax_office: z
      .string()
      .trim()
      .min(2, "Vergi dairesi gerekli.")
      .max(120),
    activity_city: z.string().trim().min(1, "İl seçin."),
    activity_district: z.string().trim().min(1, "İlçe seçin."),
    activity_address: z
      .string()
      .trim()
      .min(5, "Faaliyet adresi en az 5 karakter olmalı.")
      .max(500),
  })
  .superRefine((data, ctx) => {
    validateTaxNumber(data.company_type, data.tax_number, ctx);
  });

export const sellerApplicationStep2Schema = z
  .object({
    shop_name: z
      .string()
      .trim()
      .min(2, "Mağaza adı en az 2 karakter olmalı.")
      .max(120),
    category_ids: z
      .array(z.string().uuid())
      .min(1, "En az bir kategori seçin."),
    phone: z
      .string()
      .trim()
      .min(10, "Telefon numarası gerekli.")
      .max(30),
    billing_same_as_activity: z.boolean(),
    billing_city: z.string().trim().optional(),
    billing_district: z.string().trim().optional(),
    billing_address: z.string().trim().optional(),
    return_city: z.string().trim().min(1, "İade/depo ili seçin."),
    return_district: z.string().trim().min(1, "İade/depo ilçesi seçin."),
    return_address: z
      .string()
      .trim()
      .min(5, "İade/depo adresi en az 5 karakter olmalı.")
      .max(500),
    e_invoice_declared: z.boolean().refine((v) => v === true, {
      message: "e-Fatura / e-Arşiv mükellefi olduğunuzu onaylamalısınız.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.billing_same_as_activity) return;
    if (!data.billing_city?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fatura ili seçin.",
        path: ["billing_city"],
      });
    }
    if (!data.billing_district?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fatura ilçesi seçin.",
        path: ["billing_district"],
      });
    }
    if (!data.billing_address?.trim() || data.billing_address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fatura adresi en az 5 karakter olmalı.",
        path: ["billing_address"],
      });
    }
  });

export const sellerApplicationStep3Schema = z.object({
  iban: ibanSchema,
  bank_name: z
    .string()
    .trim()
    .min(2, "Banka adı gerekli.")
    .max(120),
});

export const sellerApplicationStep5Schema = z.object({
  seller_contract_accepted: z.boolean().refine((v) => v === true, {
    message: "Satıcı sözleşmesini onaylamalısınız.",
  }),
  e_invoice_confirmed: z.boolean().refine((v) => v === true, {
    message: "e-Fatura / e-Arşiv mükellefi olduğunuzu onaylamalısınız.",
  }),
  kvkk_accepted: z.boolean().refine((v) => v === true, {
    message: "KVKK aydınlatma metnini onaylamalısınız.",
  }),
});

export const sellerApplicationFullSchema = sellerApplicationStep1Schema
  .merge(sellerApplicationStep2Schema)
  .merge(sellerApplicationStep3Schema)
  .merge(sellerApplicationStep5Schema);

export type SellerApplicationFormData = z.infer<
  typeof sellerApplicationFullSchema
>;

export const SELLER_DOC_MAX_BYTES = 10 * 1024 * 1024;
export const SELLER_DOC_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export function validateSellerDocumentFile(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "Dosya seçin.";
  }
  if (file.size > SELLER_DOC_MAX_BYTES) {
    return "Dosya boyutu en fazla 10 MB olabilir.";
  }
  if (
    !SELLER_DOC_MIME_TYPES.includes(
      file.type as (typeof SELLER_DOC_MIME_TYPES)[number]
    )
  ) {
    return "Yalnızca PDF, JPG veya PNG yükleyebilirsiniz.";
  }
  return null;
}
