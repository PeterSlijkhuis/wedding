// API handlers for site details, text pages, RSVP and the guest list.
import { HttpError, json, body, getSetting, setSetting } from "./util.js";
import { validateSite, validatePage, validateRsvp, validatePhoto, validateGuest, csvGuests, parseNames, nameKey, PAGE_SLUGS, LANGS } from "./validate.js";

const DEFAULT_SITE = { names: "Our Wedding", date: "", rsvpDeadline: "", location: "", countdown: false, tagline: {}, theme: "sage", palette: "", font: "", layout: "", art: "", motion: "", accent: "", coverPhoto: 0, coverShape: "rounded", pagePhotos: {}, photoFocus: {}, meals: [] };

async function loadSite(env) {
  const raw = await getSetting(env, "site");
  const site = { ...DEFAULT_SITE, ...(raw ? JSON.parse(raw) : {}) };
  if (typeof site.tagline === "string") site.tagline = site.tagline ? { en: site.tagline } : {}; // saved before taglines were per language
  return site;
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
    `SELECT p.id AS party_id, p.note, p.responded_at, g.id, g.name, g.email, g.attending, g.meal, g.dietary
     FROM parties p LEFT JOIN guests g ON g.party_id = p.id ${where} ORDER BY p.id, g.id`,
  ).bind(...(ids ?? [])).all();
  const parties = new Map();
  for (const r of results) {
    if (!parties.has(r.party_id)) parties.set(r.party_id, { id: r.party_id, note: r.note, responded: !!r.responded_at, guests: [] });
    if (r.id !== null) {
      parties.get(r.party_id).guests.push({
        id: r.id, name: r.name, email: r.email, attending: r.attending === null ? null : !!r.attending, meal: r.meal, dietary: r.dietary,
      });
    }
  }
  return [...parties.values()];
}

const routes = {
  // Public: only what the landing page may show.
  "GET /api/site": async ({ env }) => {
    const { meals, ...site } = await loadSite(env); // meal options are for logged-in guests only
    return json(site);
  },
  "GET /api/admin/site": async ({ env, role }) => {
    needAdmin(role);
    return json(await loadSite(env));
  },
  // Numbers for the admin dashboard tiles.
  "GET /api/admin/status": async ({ env, role }) => {
    needAdmin(role);
    const g = await env.DB.prepare(
      "SELECT COUNT(*) AS total, COALESCE(SUM(attending = 1), 0) AS yes, COALESCE(SUM(attending = 0), 0) AS no FROM guests").first();
    const p = await env.DB.prepare(
      "SELECT COUNT(*) AS total, COALESCE(SUM(responded_at IS NOT NULL), 0) AS replied FROM parties").first();
    const photos = await env.DB.prepare("SELECT COUNT(*) AS n FROM photos").first();
    return json({
      guestPasswordSet: !!(await getSetting(env, "guest_password")),
      guests: g.total, attending: g.yes, declined: g.no, parties: p.total, replied: p.replied, photos: photos.n,
    });
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
    return json({ pages: PAGE_SLUGS.filter((s) => s !== "welcome" && have.has(s)), role });
  },
  // Text in the requested language, falling back to English unless exact=1 (used by the editor).
  "GET /api/pages": async ({ env, role, url }) => {
    needGuest(role);
    const slug = url.searchParams.get("slug");
    const lang = url.searchParams.get("lang") || "en";
    if (!PAGE_SLUGS.includes(slug) || !LANGS.includes(lang)) throw new HttpError(400, "Unknown page or language");
    if (url.searchParams.get("all") === "1") { // every language that has text (home page message to the guests)
      const { results: all } = await env.DB.prepare("SELECT lang, title, body FROM pages WHERE slug = ? AND body != ''").bind(slug).all();
      return json({ pages: LANGS.map((l) => all.find((r) => r.lang === l)).filter(Boolean) });
    }
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

  // Photos: bytes in KV, ordered ids in D1. The library is the couple's; guests only get the photos placed on the site.
  "GET /api/photos": async ({ env, role }) => {
    needAdmin(role);
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
    // Take the photo off the site wherever it was placed.
    const site = await loadSite(env);
    if (site.coverPhoto === id) site.coverPhoto = 0;
    for (const [slug, used] of Object.entries(site.pagePhotos)) if (used === id) delete site.pagePhotos[slug];
    delete site.photoFocus[id];
    await setSetting(env, "site", JSON.stringify(site));
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
  "POST /api/admin/guests/update": async ({ request, env, role }) => {
    needAdmin(role);
    const input = await body(request);
    const g = validateGuest(input);
    const attending = g.attending === null ? null : g.attending ? 1 : 0;
    const { meta } = await env.DB.prepare("UPDATE guests SET name = ?, name_key = ?, email = ?, attending = ?, meal = ?, dietary = ? WHERE id = ?")
      .bind(g.name, nameKey(g.name), g.email, attending, g.meal, g.dietary, Number(input.id)).run();
    if (!meta.changes) throw new HttpError(404, "Guest not found");
    return json({ ok: true });
  },
  "POST /api/admin/guests/add": async ({ request, env, role }) => {
    needAdmin(role);
    const input = await body(request);
    const g = validateGuest({ name: input.name, email: input.email, attending: null });
    const party = await env.DB.prepare("SELECT id FROM parties WHERE id = ?").bind(Number(input.partyId)).first();
    if (!party) throw new HttpError(404, "Group not found");
    await env.DB.prepare("INSERT INTO guests (party_id, name, name_key, email) VALUES (?, ?, ?, ?)")
      .bind(party.id, g.name, nameKey(g.name), g.email).run();
    return json({ ok: true });
  },
  "POST /api/admin/guests/delete": async ({ request, env, role }) => {
    needAdmin(role);
    const id = Number((await body(request)).id);
    await env.DB.batch([ // a group without guests is removed with its last guest
      env.DB.prepare("DELETE FROM guests WHERE id = ?").bind(id),
      env.DB.prepare("DELETE FROM parties WHERE NOT EXISTS (SELECT 1 FROM guests WHERE party_id = parties.id)"),
    ]);
    return json({ ok: true });
  },
  // CSV import: one batch of multi-row inserts with explicit ids, so even 500 guests stay a handful of queries.
  "POST /api/admin/guests/import": async ({ request, env, role }) => {
    needAdmin(role);
    const guests = csvGuests((await body(request)).csv);
    const { max } = await env.DB.prepare("SELECT COALESCE(MAX(id), 0) AS max FROM parties").first();
    const groupIds = new Map();
    let next = max;
    const rows = guests.map((g) => {
      const key = g.group || Symbol("own group");
      if (!groupIds.has(key)) groupIds.set(key, ++next);
      return [groupIds.get(key), g.name, nameKey(g.name), g.email];
    });
    const partyIds = [...groupIds.values()];
    const insert = (sql, list, width) => { // D1 allows at most 100 bound values per query
      const out = [];
      const per = Math.floor(100 / width);
      for (let i = 0; i < list.length; i += per) {
        const chunk = list.slice(i, i + per);
        out.push(env.DB.prepare(sql + chunk.map(() => `(${Array(width).fill("?").join(",")})`).join(",")).bind(...chunk.flat()));
      }
      return out;
    };
    await env.DB.batch([
      ...insert("INSERT INTO parties (id) VALUES ", partyIds.map((id) => [id]), 1),
      ...insert("INSERT INTO guests (party_id, name, name_key, email) VALUES ", rows, 4),
    ]);
    return json({ guests: rows.length, parties: partyIds.length });
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

/** Photo ids guests may see: the ones placed on the site. */
function placedPhotos(site) {
  return new Set([site.coverPhoto, ...Object.values(site.pagePhotos)].filter(Boolean));
}

async function servePhoto({ env, role }, id) {
  needGuest(role);
  if (role !== "admin" && !placedPhotos(await loadSite(env)).has(id)) throw new HttpError(404, "Photo not found");
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
