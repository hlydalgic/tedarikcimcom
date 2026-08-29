import { z } from "zod";

export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Şifreler eşleşmiyor.",
    path: ["password_confirm"],
  });
