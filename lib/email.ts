import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Settora <contact@mail.opuskiln.com>";

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

export function magicLinkEmailHtml(link: string) {
  return `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <p>Sign in to <strong>Settora</strong> with this one-time link:</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">Sign in</a></p>
      <p style="font-size:12px;color:#666;">Or paste this URL:<br/>${link}</p>
      <p style="font-size:12px;color:#666;">If you did not request this, you can ignore the email.</p>
    </div>
  `;
}

export function groupInviteEmailHtml(input: {
  groupName: string;
  inviteLink: string;
  inviteCode: string;
  inviterName: string;
}) {
  return `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <p><strong>${input.inviterName}</strong> invited you to join <strong>${input.groupName}</strong> on Settora.</p>
      <p><a href="${input.inviteLink}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">Join group</a></p>
      <p style="font-size:12px;color:#666;">Or use invite code <code>${input.inviteCode}</code><br/>${input.inviteLink}</p>
    </div>
  `;
}
