// Shared page helpers: translations, theme, JSON API calls and a tiny DOM builder.
import { applyDesign } from "./designs.js";

export const LANGUAGES = { en: "English", es: "Español", nl: "Nederlands", mk: "Македонски" };
let strings = {};

function pickLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (err) { console.warn("localStorage unavailable", err); }
  const browser = (navigator.language || "en").slice(0, 2);
  return [fromUrl, saved, browser].find((l) => l in LANGUAGES) || "en";
}

/** Text for a key in the current language, falling back to the key itself. */
export const t = (key) => strings[key] ?? key;

/** Build an element: el("a", { href: "/x", class: "btn" }, "text", childNode). Null/false attributes are skipped. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (name === "class") node.className = value;
    else if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

async function request(path, options) {
  const res = await fetch(path, options);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unexpected response from the server (${res.status})`);
  }
  if (res.status === 401 && path !== "/api/login") {
    location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const get = (path) => request(path);

/** POST JSON and return the parsed body; throws Error with the server's message on failure. */
export const post = (path, body = {}) =>
  request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** POST a JPEG file body (photo upload). */
export const upload = (path, blob) => request(path, { method: "POST", headers: { "content-type": "image/jpeg" }, body: blob });

export const pageHref = (slug) => (slug === "photos" ? "/photos" : `/page?slug=${slug}`);

export async function logout() {
  await post("/api/logout");
  location.href = "/login";
}

/** Fill every select.lang with the languages and reload in the chosen one. */
function bindLangSelect() {
  const select = document.querySelector("select.lang");
  if (!select) return;
  select.replaceChildren(...Object.entries(LANGUAGES).map(([code, name]) => el("option", { value: code }, name)));
  select.value = document.documentElement.lang;
  select.onchange = () => {
    try { localStorage.setItem("lang", select.value); } catch (err) { console.warn("localStorage unavailable", err); }
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    location.href = url;
  };
}

function translateDom() {
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => { node.title = t(node.dataset.i18nTitle); node.setAttribute("aria-label", node.title); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
}

/** Load language and theme, translate the page. Returns the public site details. */
export async function init() {
  const lang = pickLanguage();
  const [site, langRes] = await Promise.all([get("/api/site"), fetch(`/i18n/${lang}.json`)]);
  if (!langRes.ok) throw new Error(`Missing translation file /i18n/${lang}.json`);
  strings = await langRes.json();
  document.documentElement.lang = lang;
  applyDesign(document, site);
  document.title = site.names;
  translateDom();
  bindLangSelect();
  return site;
}

/** "Saturday, 12 June 2027" in the current language, or "" when no date is set. */
export function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: "full" }).format(new Date(`${iso}T12:00:00`));
}

/** Split text into paragraphs on blank lines. Uses textContent only, so page text can never inject HTML. */
export function paragraphs(text) {
  return text.split(/\n\s*\n/).map((p) => el("p", {}, p.trim())).filter((p) => p.textContent);
}

/** Whole days from today until an ISO date, or null when the date is missing or past. */
export function daysUntil(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(`${iso}T00:00:00`) - Date.now()) / 86400000);
  return days > 0 ? days : null;
}

/** Site header for logged-in guests: names, then every page that has text, then RSVP. */
export async function guestHeader(site) {
  const { pages, role } = await get("/api/nav");
  const here = location.pathname + location.search;
  const links = [["/home", t("nav.home")], ...pages.map((s) => [pageHref(s), t(`page.${s}`)]), ["/rsvp", t("nav.rsvp")]];
  document.querySelector("header").replaceChildren(
    el("span", { class: "tools" },
      role === "admin" ? el("a", { href: "/admin/", title: t("tip.admin") }, t("nav.admin")) : null,
      el("select", { class: "lang", "aria-label": t("tip.lang"), title: t("tip.lang") }),
      el("button", { class: "link", onclick: logout, title: t("tip.logout") }, t("nav.logout"))),
    el("a", { class: "site-title", href: "/home" }, site.names),
    el("nav", {}, ...links.map(([href, label]) => el("a", { href, "aria-current": href === here ? "page" : null }, label))));
  bindLangSelect();
}
