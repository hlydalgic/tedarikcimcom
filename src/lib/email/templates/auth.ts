import {
  buildEmailLayout,
  emailButton,
  emailHeading,
  emailParagraph,
} from "@/lib/email/layout";
import { escapeHtml, type EmailBrand } from "@/lib/email/utils";

export function buildVerifyEmail(params: {
  brand: EmailBrand;
  fullName?: string | null;
  verifyUrl: string;
}) {
  const greeting = params.fullName
    ? `Merhaba ${escapeHtml(params.fullName)},`
    : "Merhaba,";
  const content = `
    ${emailHeading("E-posta adresinizi doğrulayın")}
    ${emailParagraph(greeting)}
    ${emailParagraph(
      `<strong>${escapeHtml(params.brand.marketplaceName)}</strong> hesabınızı tamamlamak için e-posta adresinizi doğrulayın.`
    )}
    ${emailButton(params.verifyUrl, "E-postamı doğrula", params.brand.primaryColor)}
    ${emailParagraph(
      "Bu bağlantı kısa süre içinde geçerliliğini yitirebilir. Siz talep etmediyseniz bu e-postayı yok sayabilirsiniz."
    )}
  `;
  return {
    subject: `E-posta doğrulama — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildPasswordResetEmail(params: {
  brand: EmailBrand;
  resetUrl: string;
}) {
  const content = `
    ${emailHeading("Şifre sıfırlama")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.brand.marketplaceName)}</strong> hesabınız için şifre sıfırlama talebi aldık.`
    )}
    ${emailButton(params.resetUrl, "Yeni şifre belirle", params.brand.primaryColor)}
    ${emailParagraph(
      "Bu talebi siz yapmadıysanız e-postayı yok sayabilirsiniz. Hesabınız güvende kalır."
    )}
  `;
  return {
    subject: `Şifre sıfırlama — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerApplicationReceivedEmail(params: {
  brand: EmailBrand;
  companyName: string;
}) {
  const content = `
    ${emailHeading("Başvurunuz alındı")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.companyName)}</strong> için satıcı başvurunuz <strong>${escapeHtml(params.brand.marketplaceName)}</strong> ekibine iletildi.`
    )}
    ${emailParagraph(
      "İnceleme tamamlandığında e-posta ile bilgilendirileceksiniz."
    )}
  `;
  return {
    subject: `Satıcı başvurunuz alındı — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerApplicationAdminEmail(params: {
  brand: EmailBrand;
  companyName: string;
  applicantEmail: string;
  reviewUrl: string;
}) {
  const content = `
    ${emailHeading("Yeni satıcı başvurusu")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.companyName)}</strong> (${escapeHtml(params.applicantEmail)}) satıcı başvurusu yaptı.`
    )}
    ${emailButton(params.reviewUrl, "Başvuruları incele", params.brand.primaryColor)}
  `;
  return {
    subject: `Yeni satıcı başvurusu — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerApprovedEmail(params: {
  brand: EmailBrand;
  companyName: string;
  shopName: string;
}) {
  const content = `
    ${emailHeading("Satıcı başvurunuz onaylandı")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.companyName)}</strong> başvurunuz onaylandı. Mağazanız: <strong>${escapeHtml(params.shopName)}</strong>.`
    )}
    ${emailParagraph(
      `${escapeHtml(params.brand.marketplaceName)} üzerinde satışa başlayabilirsiniz.`
    )}
    ${emailButton(params.brand.siteUrl, "Mağazaya git", params.brand.primaryColor)}
  `;
  return {
    subject: `Satıcı başvurunuz onaylandı — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerRejectedEmail(params: {
  brand: EmailBrand;
  companyName: string;
  reason: string;
}) {
  const content = `
    ${emailHeading("Satıcı başvurunuz reddedildi")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.companyName)}</strong> başvurunuz incelendi ancak şu an onaylanamadı.`
    )}
    ${emailParagraph(`<strong>Gerekçe:</strong> ${escapeHtml(params.reason)}`)}
    ${emailParagraph(
      params.brand.supportEmail
        ? `Sorularınız için: ${escapeHtml(params.brand.supportEmail)}`
        : "Sorularınız için destek ekibimizle iletişime geçebilirsiniz."
    )}
  `;
  return {
    subject: `Satıcı başvurusu sonucu — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildProductApprovedEmail(params: {
  brand: EmailBrand;
  productTitle: string;
}) {
  const content = `
    ${emailHeading("Ürününüz onaylandı")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.productTitle)}</strong> ürününüz onaylandı ve ${escapeHtml(params.brand.marketplaceName)} üzerinde yayında.`
    )}
    ${emailButton(`${params.brand.siteUrl}/panel/urunler`, "Ürünlerime git", params.brand.primaryColor)}
  `;
  return {
    subject: `Ürün onaylandı — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildProductRejectedEmail(params: {
  brand: EmailBrand;
  productTitle: string;
  reason: string;
}) {
  const content = `
    ${emailHeading("Ürününüz reddedildi")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.productTitle)}</strong> ürününüz incelendi ancak onaylanamadı.`
    )}
    ${emailParagraph(`<strong>Gerekçe:</strong> ${escapeHtml(params.reason)}`)}
    ${emailButton(`${params.brand.siteUrl}/panel/urunler`, "Ürünlerime git", params.brand.primaryColor)}
  `;
  return {
    subject: `Ürün reddedildi — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}
