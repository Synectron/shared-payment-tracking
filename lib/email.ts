import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Settora <contact@mail.opuskiln.com>";

/** Hosted logo for email clients (PNG; absolute production URL). */
export const EMAIL_LOGO_URL = "https://settora.opuskiln.com/settora-logo.png";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ error?: string }> {
  const resend = getResend();
  if (!resend) {
    return {
      error:
        "Email is not configured. Add RESEND_API_KEY (and verify mail.opuskiln.com in Resend).",
    };
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) return { error: error.message };
  return {};
}

function emailShell(body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f4f6f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px 28px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${EMAIL_LOGO_URL}" alt="Settora" width="112" height="112" style="display:block;width:112px;height:112px;border:0;border-radius:22px;" />
            </td>
          </tr>
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function ctaButton(href: string, label: string) {
  return `
<tr>
  <td align="center" style="padding:8px 0 24px;">
    <a href="${href}" style="display:inline-block;padding:14px 28px;background:#2d4a3e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">${label}</a>
  </td>
</tr>
  `.trim();
}

export function magicLinkEmailHtml(link: string) {
  return emailShell(`
<tr>
  <td style="padding-bottom:8px;font-size:16px;text-align:center;">
    Sign in to <strong>Settora</strong> with the button below.
  </td>
</tr>
${ctaButton(link, "Sign in to Settora")}
<tr>
  <td style="font-size:12px;color:#666;text-align:center;">
    This link works once and expires soon. Didn't ask for this? Safe to ignore.
  </td>
</tr>
  `);
}

export function magicLinkEmailText() {
  return [
    "Sign in to Settora",
    "",
    "Open this message in an email app that shows HTML, then tap \"Sign in to Settora\".",
    "",
    "Didn't ask for this? Safe to ignore.",
  ].join("\n");
}

export function groupInviteEmailHtml(input: {
  groupName: string;
  inviteLink: string;
  inviteCode: string;
  inviterName: string;
}) {
  const safeName = escapeHtml(input.groupName);
  const safeInviter = escapeHtml(input.inviterName);
  const safeCode = escapeHtml(input.inviteCode);

  return emailShell(`
<tr>
  <td style="padding-bottom:8px;font-size:16px;text-align:center;">
    <strong>${safeInviter}</strong> invited you to <strong>${safeName}</strong> on Settora.
  </td>
</tr>
${ctaButton(input.inviteLink, "Join group")}
<tr>
  <td style="font-size:12px;color:#666;text-align:center;">
    Prefer a code? Use <code style="font-size:13px;letter-spacing:0.04em;">${safeCode}</code>
  </td>
</tr>
  `);
}

export function groupInviteEmailText(input: {
  groupName: string;
  inviteCode: string;
  inviterName: string;
}) {
  return [
    `${input.inviterName} invited you to ${input.groupName} on Settora.`,
    "",
    'Open this message in an email app that shows HTML, then tap "Join group".',
    "",
    `Prefer a code? Use ${input.inviteCode}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
