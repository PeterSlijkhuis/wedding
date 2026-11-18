// Pure input validation, no I/O. Every function throws HttpError(400) on bad input.
import { HttpError } from "./util.js";
import { TEMPLATES, PALETTES, FONTS, LAYOUTS, ARTS, MOTIONS } from "../public/js/designs.js";

export const THEMES = Object.keys(TEMPLATES);
export const PAGE_SLUGS = ["welcome", "story", "schedule", "travel", "faq", "gifts"]; // "welcome" is shown on the home page, not in the menu
export const LANGS = ["en", "es", "nl", "mk"];
export const COVER_SHAPES = ["rounded", "arch", "circle", "wide"];

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
  const accent = text(input.accent, 7, "Accent color");
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) throw new HttpError(400, "Accent color must look like #6b7355");
  // Tagline is per language. A plain string (older saved data) counts as English.
  const rawTagline = typeof input.tagline === "string" ? { en: input.tagline } : input.tagline ?? {};
  const tagline = {};
  for (const lang of LANGS) {
    const line = text(rawTagline[lang], 200, "Tagline");
    if (line) tagline[lang] = line;
  }
  const theme = text(input.theme, 20, "Theme") || "sage";
  if (!THEMES.includes(theme)) throw new HttpError(400, `Theme must be one of: ${THEMES.join(", ")}`);
  // Each design part is optional: empty means "use the template's choice".
  const part = (key, list) => {
    const value = text(input[key], 20, key);
    if (value && !(value in list)) throw new HttpError(400, `${key} must be one of: ${Object.keys(list).join(", ")}`);
    return value;
  };
  const design = { palette: part("palette", PALETTES), font: part("font", FONTS), layout: part("layout", LAYOUTS), art: part("art", ARTS), motion: part("motion", MOTIONS) };
  const rawMeals = Array.isArray(input.meals) ? input.meals : String(input.meals ?? "").split(",");
  const meals = rawMeals.map((m) => text(m, 60, "Meal option")).filter(Boolean);
  if (meals.length > 10) throw new HttpError(400, "At most 10 meal options");
  const coverPhoto = Number(input.coverPhoto ?? 0);
  if (!Number.isInteger(coverPhoto) || coverPhoto < 0) throw new HttpError(400, "Cover photo must be a photo id or 0");
  const coverShape = text(input.coverShape, 10, "Photo shape") || "rounded";
  if (!COVER_SHAPES.includes(coverShape)) throw new HttpError(400, `Photo shape must be one of: ${COVER_SHAPES.join(", ")}`);
  // A photo at the top of a text page: { story: 3 }.
  const pagePhotos = {};
  for (const [slug, id] of Object.entries(input.pagePhotos ?? {})) {
    if (!PAGE_SLUGS.includes(slug) || !Number.isInteger(id) || id < 0) throw new HttpError(400, "Page photos must map a page to a photo id");
    if (id) pagePhotos[slug] = id;
  }
  // Where each photo is anchored when it is cropped, in percent: { 3: [50, 30] }.
  const photoFocus = {};
  const focusEntries = Object.entries(input.photoFocus ?? {});
  if (focusEntries.length > 500) throw new HttpError(400, "Too many photo focus points");
  for (const [id, point] of focusEntries) {
    const ok = /^\d+$/.test(id) && Array.isArray(point) && point.length === 2 && point.every((n) => Number.isInteger(n) && n >= 0 && n <= 100);
    if (!ok) throw new HttpError(400, "A focus point is two whole percentages, like [50, 30]");
    photoFocus[id] = point;
  }
  // The address guests use (your own domain). Emails link there instead of wherever the admin happens to be open.
  let siteUrl = text(input.siteUrl, 200, "Website address");
  if (siteUrl) {
    try {
      const u = new URL(/^https?:\/\//.test(siteUrl) ? siteUrl : `https://${siteUrl}`);
      if (u.protocol !== "https:") throw new Error("not https");
      siteUrl = u.origin;
    } catch {
      throw new HttpError(400, "Website address must look like https://our-wedding.com");
    }
  }
  return {
    names: text(input.names, 100, "Names"), date, location: text(input.location, 200, "Location"), rsvpDeadline, siteUrl,
    countdown: input.countdown === true, tagline, theme, ...design, accent, coverPhoto, coverShape, pagePhotos, photoFocus, meals,
  };
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

export function email(value) {
  const s = text(value, 200, "Email");
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new HttpError(400, `"${s}" does not look like an email address`);
  return s.toLowerCase();
}

/** One guest as the couple edits it in the guest list. attending: true, false or null (no reply). */
export function validateGuest(input) {
  const name = text(input.name, 100, "Name");
  if (!name) throw new HttpError(400, "Enter a name");
  if (![true, false, null].includes(input.attending)) throw new HttpError(400, "RSVP must be yes, no or no reply");
  const yes = input.attending === true;
  return {
    name, email: email(input.email), attending: input.attending,
    meal: yes ? text(input.meal, 60, "Meal") : "", dietary: yes ? text(input.dietary, 300, "Dietary needs") : "",
  };
}

/** Split CSV text into rows of cells. Handles quotes, and semicolons as Excel writes them in Dutch and Spanish. */
export function parseCsv(input) {
  const src = String(input ?? "").replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Invitation draft: who it is from, the subject and the couple's message. */
export function validateInvite(input) {
  const from = text(input.from, 200, "From");
  const address = from.match(/<([^>]+)>$/)?.[1] ?? from;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) throw new HttpError(400, 'From must look like "Ana & Marko <hello@your-domain.com>"');
  const subject = text(input.subject, 150, "Subject");
  const message = text(input.message, 5000, "Message");
  if (!subject || !message) throw new HttpError(400, "Write a subject and a message");
  const kind = ["savedate", "invitation", "thanks"].includes(input.kind) ? input.kind : "invitation";
  return { kind, from, replyTo: email(input.replyTo), subject, message, button: text(input.button, 60, "Button") || "Open our website" };
}

/** A guest signing themselves up from the save-the-date link: their own name and email, plus who comes with them. */
export function validateSignup(input) {
  const name = text(input.name, 100, "Name");
  const address = email(input.email);
  if (!name || !address) throw new HttpError(400, "Enter your name and email");
  const others = String(input.others ?? "").split(/\r?\n/).map((n) => text(n, 100, "Name")).filter(Boolean);
  if (others.length > 10) throw new HttpError(400, "At most 10 people with you");
  return { name, email: address, others };
}

export const MAX_IMPORT = 500;

/** Guests from an uploaded CSV with a header row: name (required), email, group. Same group = one invitation. */
export function csvGuests(input) {
  const [header, ...rows] = parseCsv(input);
  if (!header) throw new HttpError(400, "The file is empty");
  const col = (...names) => header.findIndex((h) => names.includes(nameKey(h)));
  const [n, e, g] = [col("name", "naam", "nombre", "име"), col("email", "e-mail", "correo"), col("group", "groep", "grupo", "група")];
  if (n < 0) throw new HttpError(400, "The first row needs a column called name");
  const guests = rows.map((r, i) => {
    const name = text(r[n], 100, `Name on row ${i + 2}`);
    try {
      return { name, email: e < 0 ? "" : email(r[e]), group: g < 0 ? "" : String(r[g] ?? "").trim() };
    } catch (err) {
      throw new HttpError(400, `Row ${i + 2}: ${err.message}`);
    }
  }).filter((x) => x.name);
  if (!guests.length) throw new HttpError(400, "No names found in the file");
  if (guests.length > MAX_IMPORT) throw new HttpError(400, `At most ${MAX_IMPORT} guests per file`);
  return guests;
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
