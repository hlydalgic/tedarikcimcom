"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  ScrollText,
  Store,
  Upload,
} from "lucide-react";
import {
  submitSellerApplication,
  type SellerAppActionState,
} from "@/app/actions/seller-applications";
import { AddressFields } from "@/components/seller/AddressFields";
import { SellerApplicationSuccess } from "@/components/seller/SellerApplicationSuccess";
import type { CategoryRow } from "@/lib/categories/types";
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES,
  sellerApplicationStep1Schema,
  sellerApplicationStep2Schema,
  sellerApplicationStep3Schema,
  sellerApplicationStep5Schema,
  validateSellerDocumentFile,
  type CompanyType,
} from "@/lib/validation/seller-application";

const STEPS = [
  { title: "Şirket Bilgileri", icon: Building2 },
  { title: "Mağaza & Operasyon", icon: Store },
  { title: "Finansal Bilgiler", icon: Landmark },
  { title: "Belgeler", icon: FileText },
  { title: "Sözleşme & Onay", icon: ScrollText },
] as const;

const initialActionState: SellerAppActionState = {};

type FormState = {
  company_type: CompanyType;
  company_name: string;
  tax_number: string;
  tax_office: string;
  activity_city: string;
  activity_district: string;
  activity_address: string;
  shop_name: string;
  category_ids: string[];
  phone: string;
  billing_same_as_activity: boolean;
  billing_city: string;
  billing_district: string;
  billing_address: string;
  return_city: string;
  return_district: string;
  return_address: string;
  iban: string;
  bank_name: string;
  e_invoice_declared: boolean;
  seller_contract_accepted: boolean;
  e_invoice_confirmed: boolean;
  kvkk_accepted: boolean;
};

const initialFormState: FormState = {
  company_type: "limited",
  company_name: "",
  tax_number: "",
  tax_office: "",
  activity_city: "",
  activity_district: "",
  activity_address: "",
  shop_name: "",
  category_ids: [],
  phone: "",
  billing_same_as_activity: true,
  billing_city: "",
  billing_district: "",
  billing_address: "",
  return_city: "",
  return_district: "",
  return_address: "",
  iban: "",
  bank_name: "",
  e_invoice_declared: false,
  seller_contract_accepted: false,
  e_invoice_confirmed: false,
  kvkk_accepted: false,
};

type Props = {
  categories: CategoryRow[];
  shortName: string;
  logoUrl: string | null;
  marketplaceName: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Gönderiliyor…" : "Başvuruyu Gönder"}
    </button>
  );
}

function FileUploadField({
  id,
  label,
  hint,
  file,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-6 transition hover:border-primary/40 hover:bg-primary-soft/30"
      >
        <Upload className="mb-2 h-6 w-6 text-primary" />
        <span className="text-sm font-medium text-ink">
          {file ? file.name : "Dosya seçin veya sürükleyin"}
        </span>
        <span className="mt-1 text-xs text-ink-muted">{hint}</span>
      </label>
      <input
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SellerApplicationWizard({
  categories,
  shortName,
  logoUrl,
  marketplaceName,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null);
  const [signatureCircular, setSignatureCircular] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<{
    tax?: string;
    signature?: string;
  }>({});
  const [actionState, formAction] = useFormState(
    submitSellerApplication,
    initialActionState
  );
  const [, startTransition] = useTransition();

  const taxIdLabel =
    form.company_type === "sahis" ? "TCKN" : "Vergi kimlik numarası (VKN)";

  const progress = (step / STEPS.length) * 100;

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const validateCurrentStep = (): boolean => {
    setFieldError(null);
    setDocErrors({});

    if (step === 1) {
      const result = sellerApplicationStep1Schema.safeParse(form);
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Formu kontrol edin.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      const result = sellerApplicationStep2Schema.safeParse(form);
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Formu kontrol edin.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      const result = sellerApplicationStep3Schema.safeParse(form);
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Formu kontrol edin.");
        return false;
      }
      return true;
    }

    if (step === 4) {
      const taxErr = validateSellerDocumentFile(taxCertificate);
      const sigErr = validateSellerDocumentFile(signatureCircular);
      if (taxErr || sigErr) {
        setDocErrors({ tax: taxErr ?? undefined, signature: sigErr ?? undefined });
        return false;
      }
      return true;
    }

    if (step === 5) {
      const result = sellerApplicationStep5Schema.safeParse({
        seller_contract_accepted: form.seller_contract_accepted,
        e_invoice_confirmed: form.e_invoice_confirmed,
        kvkk_accepted: form.kvkk_accepted,
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? "Onayları tamamlayın.");
        return false;
      }
      return true;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setFieldError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const stepIcon = useMemo(() => STEPS[step - 1]?.icon ?? Building2, [step]);
  const StepIcon = stepIcon;

  if (actionState.success === "submitted") {
    return (
      <SellerApplicationSuccess
        shortName={shortName}
        logoUrl={logoUrl}
        marketplaceName={marketplaceName}
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">
            Adım {step}/{STEPS.length}
          </span>
          <span className="text-ink-muted">{STEPS[step - 1]?.title}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
          <StepIcon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold text-ink">
          {STEPS[step - 1]?.title}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step !== STEPS.length) {
            goNext();
            return;
          }
          if (!validateCurrentStep()) return;
          if (!taxCertificate || !signatureCircular) return;

          const fd = new FormData();
          fd.set("company_type", form.company_type);
          fd.set("company_name", form.company_name);
          fd.set("tax_number", form.tax_number);
          fd.set("tax_office", form.tax_office);
          fd.set("activity_city", form.activity_city);
          fd.set("activity_district", form.activity_district);
          fd.set("activity_address", form.activity_address);
          fd.set("shop_name", form.shop_name);
          fd.set("phone", form.phone);
          fd.set(
            "billing_same_as_activity",
            String(form.billing_same_as_activity)
          );
          fd.set("billing_city", form.billing_city);
          fd.set("billing_district", form.billing_district);
          fd.set("billing_address", form.billing_address);
          fd.set("return_city", form.return_city);
          fd.set("return_district", form.return_district);
          fd.set("return_address", form.return_address);
          fd.set("iban", form.iban);
          fd.set("bank_name", form.bank_name);
          fd.set("e_invoice_declared", String(form.e_invoice_declared));
          fd.set("e_invoice_confirmed", String(form.e_invoice_confirmed));
          fd.set(
            "seller_contract_accepted",
            String(form.seller_contract_accepted)
          );
          fd.set("kvkk_accepted", String(form.kvkk_accepted));
          for (const id of form.category_ids) {
            fd.append("category_ids", id);
          }
          fd.set("tax_certificate", taxCertificate);
          fd.set("signature_circular", signatureCircular);

          startTransition(() => {
            formAction(fd);
          });
        }}
        className="space-y-5"
      >
        {step === 1 ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Şirket türü</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {COMPANY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      form.company_type === type
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-ink hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="company_type"
                      value={type}
                      checked={form.company_type === type}
                      onChange={() => update("company_type", type)}
                      className="sr-only"
                    />
                    {COMPANY_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="company_name" className="mb-1.5 block text-sm font-medium">
                Şirket adı / Unvan
              </label>
              <input
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tax_number" className="mb-1.5 block text-sm font-medium">
                  {taxIdLabel}
                </label>
                <input
                  id="tax_number"
                  name="tax_number"
                  value={form.tax_number}
                  onChange={(e) => update("tax_number", e.target.value)}
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="tax_office" className="mb-1.5 block text-sm font-medium">
                  Vergi dairesi
                </label>
                <input
                  id="tax_office"
                  name="tax_office"
                  value={form.tax_office}
                  onChange={(e) => update("tax_office", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                />
              </div>
            </div>
            <AddressFields
              idPrefix="activity"
              label="Faaliyet adresi"
              value={{
                city: form.activity_city,
                district: form.activity_district,
                address: form.activity_address,
              }}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  activity_city: v.city,
                  activity_district: v.district,
                  activity_address: v.address,
                }))
              }
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <label htmlFor="shop_name" className="mb-1.5 block text-sm font-medium">
                Mağaza adı
              </label>
              <input
                id="shop_name"
                name="shop_name"
                value={form.shop_name}
                onChange={(e) => update("shop_name", e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                placeholder="Müşterilerin göreceği mağaza adı"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                İletişim telefonu
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Satış kategorileri</p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      name="category_ids"
                      value={c.id}
                      checked={form.category_ids.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span>
                      {"—".repeat(c.depth)} {c.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="billing_same_as_activity"
                checked={form.billing_same_as_activity}
                onChange={(e) =>
                  update("billing_same_as_activity", e.target.checked)
                }
                className="h-4 w-4 rounded border-border"
              />
              Fatura adresi faaliyet adresi ile aynı
            </label>
            {!form.billing_same_as_activity ? (
              <AddressFields
                idPrefix="billing"
                label="Fatura adresi"
                value={{
                  city: form.billing_city,
                  district: form.billing_district,
                  address: form.billing_address,
                }}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    billing_city: v.city,
                    billing_district: v.district,
                    billing_address: v.address,
                  }))
                }
              />
            ) : null}
            <AddressFields
              idPrefix="return"
              label="İade / depo adresi"
              value={{
                city: form.return_city,
                district: form.return_district,
                address: form.return_address,
              }}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  return_city: v.city,
                  return_district: v.district,
                  return_address: v.address,
                }))
              }
            />
            <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm">
              <input
                type="checkbox"
                name="e_invoice_declared"
                checked={form.e_invoice_declared}
                onChange={(e) => update("e_invoice_declared", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                <strong className="text-ink">e-Fatura mükellefiyim</strong>
                <span className="mt-1 block text-ink-muted">
                  Satıcı olarak e-Fatura veya e-Arşiv mükellefi olmak zorunludur.
                </span>
              </span>
            </label>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div>
              <label htmlFor="iban" className="mb-1.5 block text-sm font-medium">
                IBAN (şirkete ait)
              </label>
              <input
                id="iban"
                name="iban"
                value={form.iban}
                onChange={(e) => update("iban", e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="bank_name" className="mb-1.5 block text-sm font-medium">
                Banka adı
              </label>
              <input
                id="bank_name"
                name="bank_name"
                value={form.bank_name}
                onChange={(e) => update("bank_name", e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="rounded-xl bg-background px-4 py-3 text-sm text-ink-muted">
              GİB entegrasyonu şimdilik bulunmuyor; belgelerinizi manuel
              yükleyin. PDF, JPG veya PNG — en fazla 10 MB.
            </p>
            <FileUploadField
              id="tax_certificate"
              label="Vergi levhası"
              hint="PDF, JPG veya PNG — max 10 MB"
              file={taxCertificate}
              onChange={setTaxCertificate}
              error={docErrors.tax}
            />
            <FileUploadField
              id="signature_circular"
              label="İmza sirküleri"
              hint="PDF, JPG veya PNG — max 10 MB"
              file={signatureCircular}
              onChange={setSignatureCircular}
              error={docErrors.signature}
            />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-ink-muted">
              <p className="font-semibold text-ink">Satıcı sözleşmesi</p>
              <p className="mt-2">
                {marketplaceName} platformunda satıcı olarak faaliyet göstermek
                için komisyon, ödeme, iade ve içerik kurallarına uymayı kabul
                edersiniz. Ürün bilgilerinin doğruluğundan ve yasal yükümlülüklerin
                yerine getirilmesinden satıcı sorumludur.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="seller_contract_accepted"
                checked={form.seller_contract_accepted}
                onChange={(e) =>
                  update("seller_contract_accepted", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>Satıcı sözleşmesini okudum ve kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="e_invoice_confirmed"
                checked={form.e_invoice_confirmed}
                onChange={(e) =>
                  update("e_invoice_confirmed", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                e-Fatura / e-Arşiv mükellefi olduğumu beyan ederim.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="kvkk_accepted"
                checked={form.kvkk_accepted}
                onChange={(e) => update("kvkk_accepted", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                Kişisel verilerimin KVKK kapsamında işlenmesini kabul ediyorum.
              </span>
            </label>
          </>
        ) : null}

        {fieldError ? (
          <p className="text-sm text-error" role="alert">
            {fieldError}
          </p>
        ) : null}
        {actionState.error ? (
          <p className="text-sm text-error" role="alert">
            {actionState.error}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex h-11 items-center gap-1 rounded-xl px-4 text-sm font-semibold text-ink transition hover:bg-background disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Geri
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 items-center gap-1 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              İleri
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <SubmitButton />
          )}
        </div>
      </form>
    </div>
  );
}
