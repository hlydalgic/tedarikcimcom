import { z } from "zod";

export const addressInputSchema = z.object({
  title: z.string().trim().max(80).optional().nullable(),
  full_name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
  phone: z.string().trim().min(10, "Telefon gerekli.").max(30),
  city: z.string().trim().min(1, "İl seçin."),
  district: z.string().trim().min(1, "İlçe seçin."),
  address_line: z.string().trim().min(5, "Adres en az 5 karakter.").max(500),
  postal_code: z.string().trim().max(20).optional().nullable(),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;
