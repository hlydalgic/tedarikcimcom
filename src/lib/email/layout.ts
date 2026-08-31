import {
  escapeHtml,
  type EmailBrand,
} from "@/lib/email/utils";
import { getResendFromEmail } from "@/lib/email/resend";

export function emailButton(
  href: string,
  label: string,
  primaryColor: string
): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 8px; background-color: ${escapeHtml(primaryColor)};">
          <a href="${escapeHtml(href)}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function emailParagraph(html: string): string {
  return `<p style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #4b5563;">${html}</p>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin: 0 0 20px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 600; line-height: 1.3; color: #111827;">${escapeHtml(text)}</h1>`;
}

export function buildEmailLayout(content: string, brand: EmailBrand): string {
  const name = escapeHtml(brand.marketplaceName);
  const logoBlock = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${name}" height="36" style="height: 36px; width: auto; display: block;" />`
    : `<span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 700; color: ${escapeHtml(brand.primaryColor)};">${name}</span>`;

  const footerEmail = getResendFromEmail();
  const support = footerEmail
    ? `<a href="mailto:${escapeHtml(footerEmail)}" style="color: ${escapeHtml(brand.primaryColor)}; text-decoration: none;">${escapeHtml(footerEmail)}</a>`
    : brand.supportEmail
      ? `<a href="mailto:${escapeHtml(brand.supportEmail)}" style="color: ${escapeHtml(brand.primaryColor)}; text-decoration: none;">${escapeHtml(brand.supportEmail)}</a>`
      : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid #e5e7eb;">
              <a href="${escapeHtml(brand.siteUrl)}" style="text-decoration: none;">${logoBlock}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.5; color: #9ca3af; text-align: center;">
                ${name}${support ? ` · ${support}` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
