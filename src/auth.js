// Password hashing and signed session tokens, using only WebCrypto (works in Workers and Node 22).

const ITERATIONS = 100000; // Workers cap PBKDF2 at 100k iterations.
const enc = new TextEncoder();

const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

/** Constant-time string comparison (hashes first so length differences leak nothing). */
export async function safeEqual(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const ua = new Uint8Array(x), ub = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

/** @returns {Promise<string>} "pbkdf2$<iterations>$<salt>$<hash>" */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(await pbkdf2(password, salt, ITERATIONS))}`;
}

/** @returns {Promise<boolean>} */
export async function verifyPassword(password, stored) {
  const [scheme, iter, salt, hash] = String(stored).split("$");
  if (scheme !== "pbkdf2" || !hash) return false;
  return safeEqual(toB64(await pbkdf2(password, fromB64(salt), Number(iter))), hash);
}

/** @returns {Promise<string>} "<payload>.<signature>", payload is base64url JSON. */
export async function signToken(payload, secret) {
  const body = toB64(enc.encode(JSON.stringify(payload)));
  return `${body}.${toB64(await hmac(secret, body))}`;
}

/** @returns {Promise<object|null>} the payload, or null if tampered or expired (payload.exp in seconds). */
export async function verifyToken(token, secret, nowSec = Math.floor(Date.now() / 1000)) {
  const [body, sig] = String(token).split(".");
  if (!body || !sig || !(await safeEqual(toB64(await hmac(secret, body)), sig))) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromB64(body)));
  return payload.exp > nowSec ? payload : null;
}
