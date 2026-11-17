// Pure input validation, no I/O. Every function throws HttpError(400) on bad input.
import { HttpError } from "./util.js";

export const THEMES = ["classic", "modern", "garden"];
export const PAGE_SLUGS = ["welcome", "story", "schedule", "travel", "faq", "gifts"]; // "welcome" is shown on the home page, not in the menu
export const LANGS = ["en", "es", "nl", "mk"];

function text(value, max, field) {
  const s = String(value ?? "").trim();
  if (s.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters)`);
  return s;
}

/** Lowercase, accent-free form of a name, used to match what guests type. */
export const nameKey = (s) => String(s).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");

function isoDate(value, field) {
  const date = text(value, 10, field);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, `${field} must look like 2027-06-12`);
  return date;
}

export function validateSite(input) {
  const date = isoDate(input.date, "Date");
  const rsvpDeadline = isoDate(input.rsvpDeadline, "RSVP deadline");
  // Tagline is per language. A plain string (older saved data) counts as English.
  const rawTagline = typeof input.tagline === "string" ? { en: input.tagline } : input.tagline ?? {};
  const tagline = {};
  for (const lang of LANGS) {
    const line = text(rawTagline[lang], 200, "Tagline");
    if (line) tagline[lang] = line;
  }
  const theme = text(input.theme, 20, "Theme") || "classic";
  if (!THEMES.includes(theme)) throw new HttpError(400, `Theme must be one of: ${THEMES.join(", ")}`);
  const rawMeals = Array.isArray(input.meals) ? input.meals : String(input.meals ?? "").split(",");
  const meals = rawMeals.map((m) => text(m, 60, "Meal option")).filter(Boolean);
  if (meals.length > 10) throw new HttpError(400, "At most 10 meal options");
  return { names: text(input.names, 100, "Names"), date, rsvpDeadline, tagline, theme, meals };
}

export function validatePage(input) {
  const slug = String(input.slug ?? "");
  const lang = String(input.lang ?? "");
  if (!PAGE_SLUGS.includes(slug)) throw new HttpError(400, "Unknown page");
  if (!LANGS.includes(lang)) throw new HttpError(400, "Unknown language");
  return { slug, lang, title: text(input.title, 100, "Title"), body: text(input.body, 20000, "Text") };
}

/** One guest name per line, blank lines ignored. */
export function parseNames(input) {
  const names = String(input ?? "").split(/\r?\n/).map((n) => text(n, 100, "Name")).filter(Boolean);
  if (!names.length) throw new HttpError(400, "Enter at least one name");
  if (names.length > 20) throw new HttpError(400, "At most 20 names per group");
  return names;
}

/**
 * @param {object} input request body: { guests: [{ id, attending, meal, dietary }], note }
 * @param {number[]} partyIds ids of every guest in the party being answered
 * @param {string[]} meals meal options configured by the couple (empty = no meal question)
 */
export function validateRsvp(input, partyIds, meals) {
  const answers = Array.isArray(input.guests) ? input.guests : [];
  if (answers.length !== partyIds.length) throw new HttpError(400, "Answer for every guest in the group");
  const seen = new Set();
  const guests = answers.map((a) => {
    const id = Number(a.id);
    if (!partyIds.includes(id) || seen.has(id)) throw new HttpError(400, "Unknown guest in answer");
    seen.add(id);
    if (typeof a.attending !== "boolean") throw new HttpError(400, "Answer yes or no for every guest");
    if (!a.attending) return { id, attending: false, meal: "", dietary: "" };
    const meal = text(a.meal, 60, "Meal");
    if (meals.length && !meals.includes(meal)) throw new HttpError(400, "Pick a meal for every guest who is attending");
    return { id, attending: true, meal, dietary: text(a.dietary, 300, "Dietary needs") };
  });
  return { guests, note: text(input.note, 1000, "Message") };
}

export const MAX_PHOTO_BYTES = 2_000_000;

/** @param {ArrayBuffer} data uploaded photo; the admin page always sends a resized JPEG. */
export function validatePhoto(data) {
  if (data.byteLength < 3 || data.byteLength > MAX_PHOTO_BYTES) {
    throw new HttpError(400, `Photo must be a JPEG under ${MAX_PHOTO_BYTES / 1_000_000} MB`);
  }
  const [a, b, c] = new Uint8Array(data, 0, 3);
  if (a !== 0xff || b !== 0xd8 || c !== 0xff) throw new HttpError(400, "Photo must be a JPEG");
}
