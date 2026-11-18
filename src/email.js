// Invitation emails through Resend: the email itself, sending, and reading Resend's delivery events.
import { HttpError } from "./util.js";
import { safeEqual } from "./auth.js";

const RESEND = "https://api.resend.com";
export const MAX_PER_SEND = 100; // Resend's batch limit, and the free plan's daily limit

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const KINDS = ["savedate", "invitation", "thanks"];

const PLAIN = { bg: "#f6f5f0", card: "#ffffff", text: "#2b2b2b", muted: "#666666", accent: "#2b2b2b", onAccent: "#ffffff", display: "Georgia, serif", body: "Arial, sans-serif" };

/**
 * Plain text and HTML of one email in the site's colors and fonts. Everything the couple typed is escaped.
 * Email apps that block web fonts (Gmail, Outlook) fall back to the generic family at the end of each font list.
 */
export function invitationEmail({ names, date, location, message, siteUrl, button, design = PLAIN }) {
  const d = { ...PLAIN, ...design };
  const font = (f) => escapeHtml(f).replace(/&quot;/g, "'");
  const paras = String(message).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const when = [date, location].filter(Boolean).join(" · ");
  const text = [names, when, ...paras, `${button}: ${siteUrl}`].filter(Boolean).join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;background:${d.bg};font-family:${font(d.body)};color:${d.text}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${d.bg}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${d.card};border-radius:16px;border-top:6px solid ${d.accent}">
<tr><td style="padding:40px 32px;text-align:center">
<h1 style="font-family:${font(d.display)};font-weight:normal;font-size:34px;line-height:1.2;margin:0 0 8px;color:${d.text}">${escapeHtml(names)}</h1>
${when ? `<p style="margin:0 0 24px;color:${d.muted};font-size:16px">${escapeHtml(when)}</p>` : ""}
${paras.map((p) => `<p style="margin:0 0 16px;font-size:17px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("\n")}
<p style="margin:32px 0 0"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:${d.accent};color:${d.onAccent};text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px">${escapeHtml(button)}</a></p>
</td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}

/** Send up to 100 emails in one call. Returns Resend's ids in the same order. */
export async function sendBatch(apiKey, emails, base = RESEND) {
  if (!apiKey) throw new HttpError(400, "Email is not set up: run npx wrangler secret put RESEND_API_KEY");
  const res = await fetch(`${base}/emails/batch`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(emails),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, `Resend refused the emails: ${data.message || res.status}`);
  return (data.data ?? []).map((d) => d.id);
}

// Later events never overwrite more informative ones: an opened email stays opened when "delivered" arrives late.
const RANK = { "": 0, sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, complained: 5 };
const EVENTS = { "email.sent": "sent", "email.delivered": "delivered", "email.opened": "opened", "email.clicked": "clicked", "email.bounced": "bounced", "email.complained": "complained" };

/** The guest's new status after a Resend event, or null to leave it as it is. */
export function nextStatus(current, eventType) {
  const status = EVENTS[eventType];
  return status && RANK[status] > (RANK[current] ?? 0) ? status : null;
}

const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

/**
 * Check a Resend (Svix) webhook signature: HMAC-SHA256 of "id.timestamp.body" with the whsec_ secret.
 * Rejects events older than 5 minutes so a captured request cannot be replayed later.
 */
export async function verifyWebhook(secret, headers, rawBody, now = Date.now()) {
  const id = headers.get("svix-id"), timestamp = headers.get("svix-timestamp"), signatures = headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signatures) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)));
  for (const s of signatures.split(" ")) if (await safeEqual(s.split(",")[1] ?? "", expected)) return true;
  return false;
}
