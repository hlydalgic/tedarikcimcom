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

export function buildBuyerOrderConfirmationEmail(params: {
  brand: EmailBrand;
  fullName?: string | null;
  orderNumber: string;
  grandTotal: string;
}) {
  const greeting = params.fullName
    ? `Merhaba ${escapeHtml(params.fullName)},`
    : "Merhaba,";
  const content = `
    ${emailHeading("Siparişiniz alındı")}
    ${emailParagraph(greeting)}
    ${emailParagraph(
      `<strong>${escapeHtml(params.brand.marketplaceName)}</strong> üzerinden verdiğiniz sipariş onaylandı.`
    )}
    ${emailParagraph(
      `<strong>Sipariş no:</strong> ${escapeHtml(params.orderNumber)}<br/><strong>Toplam:</strong> ${escapeHtml(params.grandTotal)}`
    )}
    ${emailButton(
      `${params.brand.siteUrl}/siparis/${encodeURIComponent(params.orderNumber)}`,
      "Siparişi görüntüle",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Sipariş onaylandı ${params.orderNumber} — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerNewOrderEmail(params: {
  brand: EmailBrand;
  sellerName?: string | null;
  shopName: string;
  orderNumber: string;
  suborderNumber: string;
}) {
  const greeting = params.sellerName
    ? `Merhaba ${escapeHtml(params.sellerName)},`
    : "Merhaba,";
  const content = `
    ${emailHeading("Yeni siparişiniz var")}
    ${emailParagraph(greeting)}
    ${emailParagraph(
      `<strong>${escapeHtml(params.shopName)}</strong> mağazanıza yeni bir sipariş geldi.`
    )}
    ${emailParagraph(
      `<strong>Sipariş:</strong> ${escapeHtml(params.orderNumber)}<br/><strong>Alt sipariş:</strong> ${escapeHtml(params.suborderNumber)}`
    )}
    ${emailButton(
      `${params.brand.siteUrl}/panel/siparisler`,
      "Siparişleri aç",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Yeni sipariş ${params.suborderNumber} — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildBuyerShipmentTrackingEmail(params: {
  brand: EmailBrand;
  orderNumber: string;
  suborderNumber: string;
  shopName: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  carrierName?: string;
}) {
  const trackLink = params.trackingUrl
    ? emailButton(
        params.trackingUrl,
        "Kargoyu takip et",
        params.brand.primaryColor
      )
    : "";
  const content = `
    ${emailHeading("Siparişiniz kargoya verildi")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.shopName)}</strong> mağazasından verdiğiniz sipariş kargoya verildi.`
    )}
    ${emailParagraph(
      `<strong>Sipariş:</strong> ${escapeHtml(params.orderNumber)}<br/>
       <strong>Alt sipariş:</strong> ${escapeHtml(params.suborderNumber)}<br/>
       ${params.carrierName ? `<strong>Kargo:</strong> ${escapeHtml(params.carrierName)}<br/>` : ""}
       <strong>Takip no:</strong> ${escapeHtml(params.trackingNumber)}`
    )}
    ${trackLink}
    ${emailButton(
      `${params.brand.siteUrl}/hesabim/siparisler/${encodeURIComponent(params.orderNumber)}`,
      "Sipariş detayı",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Kargo takip ${params.trackingNumber} — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildQuoteRequestReceivedEmail(params: {
  brand: EmailBrand;
  productTitle: string;
}) {
  const content = `
    ${emailHeading("Nakliye teklif talebiniz alındı")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.productTitle)}</strong> için nakliye teklif talebiniz kaydedildi. Satıcı teklif verdiğinde bilgilendirileceksiniz.`
    )}
    ${emailButton(
      `${params.brand.siteUrl}/hesabim/teklifler`,
      "Tekliflerimi görüntüle",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Teklif talebiniz alındı — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildSellerNewQuoteRequestEmail(params: {
  brand: EmailBrand;
  productTitle: string;
  quantity: number;
  requestId: string;
}) {
  const content = `
    ${emailHeading("Yeni nakliye teklif talebi")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.productTitle)}</strong> ürününüz için ${params.quantity} adet nakliye teklif talebi geldi.`
    )}
    ${emailButton(
      `${params.brand.siteUrl}/panel/teklifler/${params.requestId}`,
      "Talebi görüntüle",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Yeni nakliye talebi — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}

export function buildBuyerQuoteReadyEmail(params: {
  brand: EmailBrand;
  productTitle: string;
  shopName: string;
  price: string;
  requestId: string;
}) {
  const content = `
    ${emailHeading("Nakliye teklifiniz hazır")}
    ${emailParagraph("Merhaba,")}
    ${emailParagraph(
      `<strong>${escapeHtml(params.shopName)}</strong> mağazası <strong>${escapeHtml(params.productTitle)}</strong> için nakliye teklifi verdi.`
    )}
    ${emailParagraph(`<strong>Nakliye ücreti:</strong> ${escapeHtml(params.price)}`)}
    ${emailButton(
      `${params.brand.siteUrl}/hesabim/teklifler/${params.requestId}`,
      "Teklifi incele",
      params.brand.primaryColor
    )}
  `;
  return {
    subject: `Nakliye teklifi hazır — ${params.brand.marketplaceName}`,
    html: buildEmailLayout(content, params.brand),
  };
}
