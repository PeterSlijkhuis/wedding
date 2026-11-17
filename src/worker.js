import { hashPassword, verifyPassword, safeEqual, signToken, verifyToken } from "./auth.js";
import { contentApi } from "./content.js";
import { HttpError, json, body, getSetting, setSetting } from "./util.js";

const COOKIE = "session";
const SESSION_SECONDS = 30 * 24 * 3600;
// Reachable without a password: the landing page, the login page and their assets.
const PUBLIC_PATHS = ["/", "/index.html", "/login", "/login.html", "/favicon.ico"];
const PUBLIC_PREFIXES = ["/css/", "/js/", "/i18n/"];

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: "Server error" }, 500);
    }
  },
};

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.startsWith("/api/")) return api(request, env, url);

  const role = await currentRole(request, env);
  const isPublic = PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const needsAdmin = path === "/admin" || path.startsWith("/admin/");
  if ((needsAdmin && role !== "admin") || (!isPublic && !role)) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", path + url.search);
    if (url.searchParams.has("lang")) login.searchParams.set("lang", url.searchParams.get("lang"));
    return Response.redirect(login, 302);
  }
  return env.ASSETS.fetch(request);
}

async function api(request, env, url) {
  if (request.method === "POST" && !request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "Expected application/json" }, 415); // Also blocks cross-site form posts (CSRF).
  }
  const key = `${request.method} ${url.pathname}`;

  if (key === "POST /api/login") {
    const { password } = await body(request);
    const role = await roleForPassword(String(password ?? ""), env);
    if (!role) return json({ error: "Wrong password" }, 401);
    const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const token = await signToken({ role, exp }, await sessionSecret(env));
    return json({ role }, 200, { "set-cookie": cookie(token, SESSION_SECONDS) });
  }
  if (key === "POST /api/logout") return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });

  const role = await currentRole(request, env);
  if (key === "GET /api/me") return json({ role });

  if (key === "POST /api/admin/guest-password") {
    if (role !== "admin") return json({ error: "Admin login required" }, role ? 403 : 401);
    const { password } = await body(request);
    if (typeof password !== "string" || password.length < 6) {
      return json({ error: "Guest password must be at least 6 characters" }, 400);
    }
    await setSetting(env, "guest_password", await hashPassword(password));
    return json({ ok: true });
  }
  return (await contentApi(key, { request, env, role, url })) ?? json({ error: "Not found" }, 404);
}

async function roleForPassword(password, env) {
  if (!env.ADMIN_PASSWORD) {
    throw new HttpError(500, "ADMIN_PASSWORD is not set. Run: npx wrangler secret put ADMIN_PASSWORD");
  }
  if (await safeEqual(password, env.ADMIN_PASSWORD)) return "admin";
  const guestHash = await getSetting(env, "guest_password");
  if (guestHash && (await verifyPassword(password, guestHash))) return "guest";
  return null;
}

async function currentRole(request, env) {
  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;
  const payload = await verifyToken(match[1], await sessionSecret(env));
  return payload?.role ?? null;
}

/** Random signing key, created on first use and kept in D1, so self-hosters need only one secret. */
async function sessionSecret(env) {
  const existing = await getSetting(env, "session_secret");
  if (existing) return existing;
  const fresh = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('session_secret', ?)").bind(fresh).run();
  return getSetting(env, "session_secret"); // Re-read: a parallel request may have won the insert.
}

const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
