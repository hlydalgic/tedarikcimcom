import "server-only";

import { getResendFromEmail, resend } from "@/lib/email/resend";
import { getEmailBrand } from "@/lib/email/utils";
import { logServerError } from "@/lib/security/errors";
import {
  buildPasswordResetEmail,
  buildProductApprovedEmail,
  buildProductRejectedEmail,
  buildSellerApplicationAdminEmail,
  buildSellerApplicationReceivedEmail,
  buildSellerApprovedEmail,
  buildSellerRejectedEmail,
  buildVerifyEmail,
  buildBuyerOrderConfirmationEmail,
  buildSellerNewOrderEmail,
  buildBuyerShipmentTrackingEmail,
} from "@/lib/email/templates/auth";
import { formatPrice } from "@/lib/format";

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    logServerError(
      "email/missing-api-key",
      new Error("RESEND_API_KEY not set")
    );
    return { ok: false as const };
  }
  if (!to) {
    logServerError("email/missing-recipient", new Error("missing to"));
    return { ok: false as const };
  }

  try {
    const { error } = await resend.emails.send({
      from: getResendFromEmail(),
      to,
      subject,
      html,
    });
    if (error) {
      logServerError("email/resend-error", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (err) {
    logServerError("email/send", err);
    return { ok: false as const };
  }
}

export async function sendVerifyEmail(input: {
  to: string;
  fullName?: string | null;
  verifyUrl: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildVerifyEmail({
    brand,
    fullName: input.fullName,
    verifyUrl: input.verifyUrl,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildPasswordResetEmail({
    brand,
    resetUrl: input.resetUrl,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendSellerApplicationReceived(input: {
  to: string;
  companyName: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildSellerApplicationReceivedEmail({
    brand,
    companyName: input.companyName,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendSellerApplicationAdminNotice(input: {
  companyName: string;
  applicantEmail: string;
}) {
  const brand = await getEmailBrand();
  if (!brand.supportEmail) {
    logServerError(
      "email/admin-notice",
      new Error("support_email not configured")
    );
    return { ok: false as const };
  }
  const mail = buildSellerApplicationAdminEmail({
    brand,
    companyName: input.companyName,
    applicantEmail: input.applicantEmail,
    reviewUrl: `${brand.siteUrl}/admin/saticilar/basvurular`,
  });
  return sendEmail(brand.supportEmail, mail.subject, mail.html);
}

export async function sendSellerApproved(input: {
  to: string;
  companyName: string;
  shopName: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildSellerApprovedEmail({
    brand,
    companyName: input.companyName,
    shopName: input.shopName,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendSellerRejected(input: {
  to: string;
  companyName: string;
  reason: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildSellerRejectedEmail({
    brand,
    companyName: input.companyName,
    reason: input.reason,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendProductApprovedEmail(input: {
  to: string;
  productTitle: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildProductApprovedEmail({
    brand,
    productTitle: input.productTitle,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendProductRejectedEmail(input: {
  to: string;
  productTitle: string;
  reason: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildProductRejectedEmail({
    brand,
    productTitle: input.productTitle,
    reason: input.reason,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendBuyerOrderConfirmation(input: {
  to: string;
  fullName?: string | null;
  orderNumber: string;
  grandTotal: number;
  currency: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildBuyerOrderConfirmationEmail({
    brand,
    fullName: input.fullName,
    orderNumber: input.orderNumber,
    grandTotal: formatPrice(input.grandTotal, input.currency),
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendSellerNewOrderNotification(input: {
  to: string;
  sellerName?: string | null;
  shopName: string;
  orderNumber: string;
  suborderNumber: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildSellerNewOrderEmail({
    brand,
    sellerName: input.sellerName,
    shopName: input.shopName,
    orderNumber: input.orderNumber,
    suborderNumber: input.suborderNumber,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}

export async function sendBuyerShipmentTrackingEmail(input: {
  to: string;
  orderNumber: string;
  suborderNumber: string;
  shopName: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  carrierName?: string;
}) {
  const brand = await getEmailBrand();
  const mail = buildBuyerShipmentTrackingEmail({
    brand,
    orderNumber: input.orderNumber,
    suborderNumber: input.suborderNumber,
    shopName: input.shopName,
    trackingNumber: input.trackingNumber,
    trackingUrl: input.trackingUrl,
    carrierName: input.carrierName,
  });
  return sendEmail(input.to, mail.subject, mail.html);
}
