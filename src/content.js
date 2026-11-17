// API handlers for site details, text pages, RSVP and the guest list.
import { HttpError, json, body, getSetting, setSetting } from "./util.js";
import { validateSite, validatePage, validateRsvp, validatePhoto, parseNames, nameKey, PAGE_SLUGS, LANGS } from "./validate.js";

const DEFAULT_SITE = { names: "Our Wedding", date: "", tagline: "", theme: "classic", meals: [] };

async function loadSite(env) {
  const raw = await getSetting(env, "site");
  return { ...DEFAULT_SITE, ...(raw ? JSON.parse(raw) : {}) };
}

function need(role, ...allowed) {
  if (!allowed.includes(role)) {
    throw new HttpError(role ? 403 : 401, allowed.includes("guest") ? "Login required" : "Admin login required");
  }
}
const needGuest = (role) => need(role, "guest", "admin");
const needAdmin = (role) => need(role, "admin");

/** Parties with their guests. ids = null loads every party. */
async function loadParties(env, ids = null) {
  const where = ids ? `WHERE p.id IN (${ids.map(() => "?").join(",")})` : "";
  const { results } = await env.DB.prepare(
    `SELECT p.id AS party_id, p.note, p.responded_at, g.id, g.name, g.attending, g.meal, g.dietary
     FROM parties p LEFT JOIN guests g ON g.party_id = p.id ${where} ORDER BY p.id, g.id`,
  ).bind(...(ids ?? [])).all();
  const parties = new Map();
  for (const r of results) {
    if (!parties.has(r.party_id)) parties.set(r.party_id, { id: r.party_id, note: r.note, responded: !!r.responded_at, guests: [] });
    if (r.id !== null) {
      parties.get(r.party_id).guests.push({
        id: r.id, name: r.name, attending: r.attending === null ? null : !!r.attending, meal: r.meal, dietary: r.dietary,
      });
    }
  }
  return [...parties.values()];
}

const routes = {
  // Public: only what the landing page may show.
  "GET /api/site": async ({ env }) => {
    const { names, date, tagline, theme } = await loadSite(env);
    return json({ names, date, tagline, theme });
  },
  "GET /api/admin/site": async ({ env, role }) => {
    needAdmin(role);
    return json(await loadSite(env));
  },
  "POST /api/admin/site": async ({ request, env, role }) => {
    needAdmin(role);
    await setSetting(env, "site", JSON.stringify(validateSite(await body(request))));
    return json({ ok: true });
  },

  // Pages that have text in at least one language, in menu order.
  "GET /api/nav": async ({ env, role }) => {
    needGuest(role);
    const { results } = await env.DB.prepare("SELECT DISTINCT slug FROM pages WHERE body != ''").all();
    const have = new Set(results.map((r) => r.slug));
    const hasPhotos = await env.DB.prepare("SELECT 1 AS x FROM photos LIMIT 1").first();
    return json({ pages: [...PAGE_SLUGS.filter((s) => have.has(s)), ...(hasPhotos ? ["photos"] : [])] });
  },
  // Text in the requested language, falling back to English unless exact=1 (used by the editor).
  "GET /api/pages": async ({ env, role, url }) => {
    needGuest(role);
    const slug = url.searchParams.get("slug");
    const lang = url.searchParams.get("lang") || "en";
    if (!PAGE_SLUGS.includes(slug) || !LANGS.includes(lang)) throw new HttpError(400, "Unknown page or language");
    const { results } = await env.DB.prepare("SELECT lang, title, body FROM pages WHERE slug = ? AND lang IN (?, 'en')")
      .bind(slug, lang).all();
    const row = results.find((r) => r.lang === lang) ?? (url.searchParams.get("exact") === "1" ? null : results[0]);
    return json(row ?? { lang: null, title: "", body: "" });
  },
  "POST /api/admin/pages": async ({ request, env, role }) => {
    needAdmin(role);
    const { slug, lang, title, body: text } = validatePage(await body(request));
    if (!title && !text) {
      await env.DB.prepare("DELETE FROM pages WHERE slug = ? AND lang = ?").bind(slug, lang).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO pages (slug, lang, title, body) VALUES (?, ?, ?, ?) ON CONFLICT(slug, lang) DO UPDATE SET title = excluded.title, body = excluded.body",
      ).bind(slug, lang, title, text).run();
    }
    return json({ ok: true });
  },

  // Photos: bytes in KV, ordered ids in D1. Only logged-in users can fetch them.
  "GET /api/photos": async ({ env, role }) => {
    needGuest(role);
    const { results } = await env.DB.prepare("SELECT id FROM photos ORDER BY id DESC").all();
    return json({ photos: results.map((r) => r.id) });
  },
  "POST /api/admin/photos": async ({ request, env, role }) => {
    needAdmin(role);
    const data = await request.arrayBuffer();
    validatePhoto(data);
    const { meta } = await env.DB.prepare("INSERT INTO photos DEFAULT VALUES").run();
    try {
      await env.PHOTOS.put(`photo:${meta.last_row_id}`, data);
    } catch (err) {
      await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(meta.last_row_id).run(); // Don't leave an id without bytes.
      throw err;
    }
    return json({ id: meta.last_row_id });
  },
  "POST /api/admin/photos/delete": async ({ request, env, role }) => {
    needAdmin(role);
    const id = Number((await body(request)).id);
    await env.PHOTOS.delete(`photo:${id}`);
    await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(id).run();
    return json({ ok: true });
  },

  // Guests find their party by typing part of any name in it.
  "GET /api/rsvp/search": async ({ env, role, url }) => {
    needGuest(role);
    const key = nameKey(url.searchParams.get("q") || "");
    if (key.length < 3) throw new HttpError(400, "Type at least 3 letters");
    const like = `%${key.replace(/[\\%_]/g, "\\$&")}%`;
    const { results } = await env.DB.prepare("SELECT DISTINCT party_id FROM guests WHERE name_key LIKE ? ESCAPE '\\' LIMIT 5")
      .bind(like).all();
    const meals = (await loadSite(env)).meals;
    if (!results.length) return json({ parties: [], meals });
    return json({ parties: await loadParties(env, results.map((r) => r.party_id)), meals });
  },
  "POST /api/rsvp": async ({ request, env, role }) => {
    needGuest(role);
    const input = await body(request);
    const partyId = Number(input.party_id);
    const { results } = await env.DB.prepare("SELECT id FROM guests WHERE party_id = ?").bind(partyId).all();
    if (!results.length) throw new HttpError(404, "Group not found");
    const { guests, note } = validateRsvp(input, results.map((r) => r.id), (await loadSite(env)).meals);
    await env.DB.batch([
      ...guests.map((g) =>
        env.DB.prepare("UPDATE guests SET attending = ?, meal = ?, dietary = ? WHERE id = ? AND party_id = ?")
          .bind(g.attending ? 1 : 0, g.meal, g.dietary, g.id, partyId)),
      env.DB.prepare("UPDATE parties SET note = ?, responded_at = datetime('now') WHERE id = ?").bind(note, partyId),
    ]);
    return json({ ok: true });
  },

  // Minimal guest list for now; CSV import and the full dashboard come in the next step.
  "GET /api/admin/parties": async ({ env, role }) => {
    needAdmin(role);
    return json({ parties: await loadParties(env) });
  },
  "POST /api/admin/parties": async ({ request, env, role }) => {
    needAdmin(role);
    const names = parseNames((await body(request)).names);
    const { meta } = await env.DB.prepare("INSERT INTO parties (note) VALUES ('')").run();
    await env.DB.batch(names.map((n) =>
      env.DB.prepare("INSERT INTO guests (party_id, name, name_key) VALUES (?, ?, ?)").bind(meta.last_row_id, n, nameKey(n))));
    return json({ ok: true });
  },
  "POST /api/admin/parties/delete": async ({ request, env, role }) => {
    needAdmin(role);
    const id = Number((await body(request)).id);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM guests WHERE party_id = ?").bind(id),
      env.DB.prepare("DELETE FROM parties WHERE id = ?").bind(id),
    ]);
    return json({ ok: true });
  },
};

async function servePhoto({ env, role }, id) {
  needGuest(role);
  const bytes = await env.PHOTOS.get(`photo:${id}`, "stream");
  if (!bytes) throw new HttpError(404, "Photo not found");
  return new Response(bytes, {
    headers: {
      "content-type": "image/jpeg",
      "x-content-type-options": "nosniff",
      "cache-control": "private, max-age=31536000, immutable", // private: never stored by shared caches. A photo id never changes.
    },
  });
}

/** @returns {Promise<Response|null>} null when no content route matches. */
export async function contentApi(key, ctx) {
  if (routes[key]) return routes[key](ctx);
  const photo = key.match(/^GET \/api\/photos\/(\d+)$/);
  return photo ? servePhoto(ctx, Number(photo[1])) : null;
}
