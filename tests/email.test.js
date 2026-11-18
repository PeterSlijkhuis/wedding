import test from "node:test";
import assert from "node:assert/strict";
import { invitationEmail, nextStatus, verifyWebhook } from "../src/email.js";

test("invitation escapes what the couple typed", () => {
  const { html, text } = invitationEmail({ names: "Ana & <b>Marko</b>", date: "June 12", location: "", message: "Hi!\n\nCome <script>", siteUrl: "https://x.dev/?a=1&b=2", button: "Open" });
  assert.ok(html.includes("Ana &amp; &lt;b&gt;Marko") && html.includes("Come &lt;script&gt;") && html.includes("?a=1&amp;b=2"));
  assert.ok(!html.includes("<script>"));
  assert.equal(text, "Ana & <b>Marko</b>\n\nJune 12\n\nHi!\n\nCome <script>\n\nOpen: https://x.dev/?a=1&b=2");
});

test("status only moves forward", () => {
  assert.equal(nextStatus("", "email.sent"), "sent");
  assert.equal(nextStatus("opened", "email.delivered"), null);
  assert.equal(nextStatus("delivered", "email.clicked"), "clicked");
  assert.equal(nextStatus("clicked", "email.bounced"), "bounced");
  assert.equal(nextStatus("sent", "email.unknown"), null);
});

test("webhook signature: valid, tampered, old", async () => {
  const secret = "whsec_" + btoa("0123456789abcdef0123456789abcdef");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("0123456789abcdef0123456789abcdef"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const now = 1_800_000_000_000, ts = String(now / 1000), body = '{"type":"email.opened"}';
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`msg_1.${ts}.${body}`)))));
  const h = (s, t = ts) => new Headers({ "svix-id": "msg_1", "svix-timestamp": t, "svix-signature": `v1,bogus v1,${s}` });
  assert.equal(await verifyWebhook(secret, h(sig), body, now), true);
  assert.equal(await verifyWebhook(secret, h(sig), body + " ", now), false);
  assert.equal(await verifyWebhook(secret, h(sig, String(now / 1000 - 400)), body, now), false);
  assert.equal(await verifyWebhook("", h(sig), body, now), false);
});
