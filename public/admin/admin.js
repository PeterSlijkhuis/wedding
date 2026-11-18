import { init, get, post, upload, t, el, logout, formatDate, pageHref, LANGUAGES } from "/js/app.js";
import { TEMPLATES, PALETTES, FONTS, LAYOUTS, ARTS, MOTIONS, MOODS, resolveDesign, applyDesign } from "/js/designs.js";

const $ = (id) => document.getElementById(id);
let currentForm = null; // id of the form shown in the editor, or null
const PAGE_SLUGS = ["welcome", "story", "schedule", "travel", "faq", "gifts"]; // keep in sync with src/validate.js
const fmt = (text, vars) => text.replace(/\{(\w+)\}/g, (_, key) => vars[key]);

await init();
// The admin keeps its own neutral look; the couple's design only shows in the preview.
document.documentElement.removeAttribute("style");
for (const key of ["theme", "layout", "art", "tone"]) delete document.documentElement.dataset[key];
let site = await get("/api/admin/site");
$("logout").onclick = logout;
$("host").textContent = new URL(site.siteUrl || location.origin).host;

// ---------- Live preview ----------
const frame = $("preview");
const previewSelect = $("preview-page");

async function fillPreviewOptions() {
  const { pages } = await get("/api/nav");
  const options = [["/", t("admin.landing")], ["/home", t("nav.home")], ...pages.map((s) => [pageHref(s), t(`page.${s}`)]), ["/rsvp", t("nav.rsvp")]];
  previewSelect.replaceChildren(...options.map(([url, label]) => el("option", { value: url }, label)));
}

function setPreview(url) {
  if (![...previewSelect.options].some((o) => o.value === url)) {
    const slug = new URL(url, location.origin).searchParams.get("slug");
    previewSelect.append(el("option", { value: url }, slug ? t(`page.${slug}`) : url));
  }
  previewSelect.value = url;
  if (frame.getAttribute("src") !== url) frame.src = url;
}

// Unsaved design choices are shown in the preview right away, and again after it navigates.
frame.addEventListener("load", () => { if (currentForm === "design") previewDesign(); });
// The preview page asks for this while it starts, so its own saved design never overwrites the draft.
window.previewDraft = () => (currentForm === "design" ? designDraft() : null);
function previewDesign() {
  try { applyDesign(frame.contentDocument, designDraft()); } catch (err) { console.warn("Preview not ready", err); }
}

function reloadPreview() {
  try { frame.contentWindow.location.reload(); } catch (err) { console.warn("Could not reload the preview", err); }
}

previewSelect.onchange = () => { frame.src = previewSelect.value; };
for (const [id, mobile] of [["dev-desktop", false], ["dev-mobile", true]]) {
  $(id).onclick = () => {
    $("device").classList.toggle("mobile", mobile);
    $("dev-desktop").setAttribute("aria-pressed", String(!mobile));
    $("dev-mobile").setAttribute("aria-pressed", String(mobile));
  };
}
$("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(siteOrigin());
    $("copy").textContent = t("admin.copied");
  } catch (err) {
    $("copy").textContent = siteOrigin(); // Clipboard blocked: show the link so it can be copied by hand.
  }
  setTimeout(() => { $("copy").textContent = t("admin.share"); }, 2000);
};

// ---------- Save bar ----------
function setState(kind, message) {
  $("savestate").className = kind;
  $("savestate").textContent = message;
}
const markDirty = () => setState("dirty", t("admin.unsaved"));
const markSaved = () => setState("", t("admin.allSaved"));
$("panel-body").addEventListener("input", markDirty);
$("panel-body").addEventListener("change", markDirty);

// ---------- Forms: each has fill() (show saved values) and save() ----------
async function saveSite(changes) {
  await post("/api/admin/site", { ...site, ...changes });
  site = await get("/api/admin/site");
}

// ---------- Design: templates, then color, font, layout and art ----------
const checked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
let mood = "all";

function designDraft() {
  return { ...site, theme: checked("template") ?? site.theme, palette: checked("palette"), font: checked("font"),
    layout: checked("layout"), art: checked("art"), motion: checked("motion"), coverShape: checked("shape") ?? site.coverShape,
    coverPhoto: Number(checked("cover") ?? site.coverPhoto), accent: $("accent").dataset.custom ? $("accent").value : "" };
}

/** One choice card: a hidden radio plus whatever shows it. */
const choice = (name, value, selected, title, ...content) =>
  el("label", { class: "choice", title }, el("input", { type: "radio", name, value, checked: value === selected }), ...content);

/** Small picture of a template: its colors, fonts and art, drawn with the same variables as the site. */
function miniSite(design) {
  const p = PALETTES[design.palette];
  const f = FONTS[design.font];
  return el("div", {
    class: "mini", "data-layout": design.layout, "data-art": design.art,
    style: `--bg:${p.bg};--text:${p.text};--muted:${p.muted};--accent:${p.accent};--accent-2:${p.accent2};--on-accent:${p.onAccent};--font-display:${f.display.replaceAll('"', "'")};--font:${f.body.replaceAll('"', "'")}`,
  }, el("span", { class: "art" }), el("b", {}, site.names || "Ana & Marko"), el("small", {}, "12 · 06 · 2027"), el("i", {}));
}

function renderTemplates(selected = checked("template") ?? site.theme) {
  $("moods").replaceChildren(...["all", ...MOODS].map((m) => el("button", {
    type: "button", class: m === mood ? "chip on" : "chip", "aria-pressed": String(m === mood),
    onclick: () => { mood = m; renderTemplates(); },
  }, t(`admin.mood.${m}`))));
  $("templates").replaceChildren(...Object.entries(TEMPLATES).filter(([, tpl]) => mood === "all" || tpl.mood === mood)
    .map(([id, tpl]) => choice("template", id, selected, tpl.name, miniSite(tpl), el("span", {}, tpl.name))));
}

function renderParts(design) {
  $("palettes").replaceChildren(...Object.entries(PALETTES).map(([id, p]) => choice("palette", id, design.palette, p.name,
    el("span", { class: "dots" }, ...[p.bg, p.accent, p.accent2, p.text].map((c) => el("i", { style: `background:${c}` }))), el("span", {}, p.name))));
  $("fonts").replaceChildren(...Object.entries(FONTS).map(([id, f]) => choice("font", id, design.font, f.name,
    el("span", { class: "sample", style: `font-family:${f.display.replaceAll('"', "'")}` }, "Aa"), el("span", {}, f.name))));
  $("layouts").replaceChildren(...Object.entries(LAYOUTS).map(([id, name]) => choice("layout", id, design.layout, name,
    el("span", { class: `schema ${id}` }, el("i", {}), el("i", {})), el("span", {}, name))));
  $("arts").replaceChildren(...Object.entries(ARTS).map(([id, a]) => choice("art", id, design.art, a.name, el("span", {}, a.name))));
  $("motions").replaceChildren(...Object.entries(MOTIONS).map(([id, name]) => choice("motion", id, design.motion, t(`admin.motion.${id}`), el("span", {}, name))));
}

$("design").addEventListener("change", (e) => {
  if (e.target.name === "template") renderParts(TEMPLATES[e.target.value]); // a template resets the four parts
  if (e.target.name === "template" || e.target.name === "motion") { // let the preview play its entrance again
    try {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith("entered:")) sessionStorage.removeItem(key);
    } catch (err) { console.warn("sessionStorage unavailable", err); }
    reloadPreview();
  }
  if (e.target.name === "template" || e.target.name === "palette") {
    if (!$("accent").dataset.custom) $("accent").value = PALETTES[checked("palette")].accent;
  }
  previewDesign();
});

/** Pick one photo from the library (or none) with radio buttons named `name`. */
async function renderPhotoPicker(container, name, selected, tip) {
  const { photos } = await get("/api/photos");
  $(container).replaceChildren(
    el("label", {}, el("input", { type: "radio", name, value: "0", checked: !selected }), el("span", { class: "none" }, t("admin.noPhoto"))),
    ...photos.map((id) => el("label", { title: t(tip) },
      el("input", { type: "radio", name, value: String(id), checked: selected === id }),
      el("img", { src: `/api/photos/${id}`, loading: "lazy", alt: "", style: focusStyle(id) }))));
}
const focusStyle = (id) => { const [x, y] = site.photoFocus[id] ?? [50, 50]; return `object-position:${x}% ${y}%`; };
const SHAPES = ["rounded", "arch", "circle", "wide"];


const FORMS = {
  details: {
    fill() {
      $("names").value = site.names;
      $("date").value = site.date;
      $("deadline").value = site.rsvpDeadline;
      $("location").value = site.location;
      $("site-url").value = site.siteUrl;
      $("countdown").checked = site.countdown;
      $("meals").value = site.meals.join(", ");
      for (const lang of Object.keys(LANGUAGES)) $(`tagline-${lang}`).value = site.tagline[lang] ?? "";
    },
    save: () => saveSite({
      names: $("names").value, date: $("date").value, rsvpDeadline: $("deadline").value, location: $("location").value, siteUrl: $("site-url").value,
      countdown: $("countdown").checked, meals: $("meals").value,
      tagline: Object.fromEntries(Object.keys(LANGUAGES).map((lang) => [lang, $(`tagline-${lang}`).value])),
    }),
  },
  design: {
    async fill() {
      const design = resolveDesign(site);
      renderTemplates(site.theme);
      renderParts(design);
      $("accent").dataset.custom = site.accent ? "1" : "";
      $("accent").value = site.accent || PALETTES[design.palette].accent;
      await renderPhotoPicker("cover-picker", "cover", site.coverPhoto, "tip.cover");
      $("shapes").replaceChildren(...SHAPES.map((id) => choice("shape", id, site.coverShape, t(`admin.shape.${id}`), el("span", {}, t(`admin.shape.${id}`)))));
      previewDesign();
    },
    save: () => {
      const { theme, palette, font, layout, art, motion, accent } = designDraft();
      return saveSite({ theme, palette, font, layout, art, motion, accent, coverPhoto: Number(checked("cover") ?? 0), coverShape: checked("shape") });
    },
  },
  page: {
    async fill() {
      const page = await get(`/api/pages?slug=${$("slug").value}&lang=${$("lang").value}&exact=1`);
      $("title").value = page.title;
      $("body").value = page.body;
      await renderPhotoPicker("page-photo-picker", "page-photo", site.pagePhotos[$("slug").value] ?? 0, "tip.pagePhoto");
    },
    async save() {
      await post("/api/admin/pages", { slug: $("slug").value, lang: $("lang").value, title: $("title").value, body: $("body").value });
      await saveSite({ pagePhotos: { ...site.pagePhotos, [$("slug").value]: Number(checked("page-photo") ?? 0) } });
      await fillPreviewOptions();
    },
  },
  privacy: {
    async fill() {
      const status = await get("/api/admin/status");
      $("pw-state").textContent = status.guestPasswordSet ? t("admin.pwSet") : t("admin.pwNotSet");
      $("password").value = "";
    },
    async save() {
      await post("/api/admin/guest-password", { password: $("password").value });
      await FORMS.privacy.fill();
    },
  },
};

$("accent").oninput = () => { $("accent").dataset.custom = "1"; previewDesign(); };
$("accent-reset").onclick = () => { $("accent").dataset.custom = ""; $("accent").value = PALETTES[checked("palette")].accent; markDirty(); previewDesign(); };

$("slug").replaceChildren(...PAGE_SLUGS.map((s) => el("option", { value: s }, t(`page.${s}`))));
$("lang").replaceChildren(...Object.entries(LANGUAGES).map(([code, name]) => el("option", { value: code }, name)));
$("lang").value = document.documentElement.lang;

for (const id of Object.keys(FORMS)) {
  $(id).onsubmit = async (e) => {
    e.preventDefault();
    try {
      await FORMS[id].save();
      markSaved();
      reloadPreview();
      await renderDashboard();
    } catch (err) {
      setState("error", err.message);
    }
  };
}
$("slug").onchange = $("lang").onchange = async () => { await FORMS.page.fill(); markSaved(); setPreview(pageHref($("slug").value)); };
$("cancel").onclick = async () => { await FORMS[currentForm].fill(); markSaved(); reloadPreview(); };
$("save").onclick = () => $(currentForm).requestSubmit();

// ---------- Dashboard ----------
const TILES = [ // view, icon, gradient, label key. Views missing from the status map are not built yet.
  ["pages", "\u{1F5BC}️", ["#3d7ff0", "#8dbbff"], "admin.tile.website"],
  ["design", "\u{1F3A8}", ["#e0508a", "#ff9bbd"], "admin.tile.design"],
  ["details", "\u{1F4C5}", ["#f0b429", "#ffe08a"], "admin.tile.details"],
  ["guests", "\u{1F465}", ["#6b4fd8", "#a894f2"], "admin.tile.guests"],
  ["rsvp", "✅", ["#f08a1c", "#ffc471"], "admin.tile.rsvp"],
  ["photos", "\u{1F4F7}", ["#e04a4a", "#ff9f9f"], "admin.tile.photos"],
  ["tables", "\u{1FA91}", ["#14a3a3", "#7fdcdc"], "admin.tile.tables"],
  ["drinks", "\u{1F942}", ["#22a861", "#8fe3b4"], "admin.tile.drinks"],
  ["privacy", "\u{1F512}", ["#5a6b8c", "#a7b4cc"], "admin.tile.privacy"],
];

async function renderDashboard() {
  const [status, nav] = await Promise.all([get("/api/admin/status"), get("/api/nav")]);
  const statusText = {
    pages: fmt(t("admin.s.pages"), { n: nav.pages.length }),
    design: TEMPLATES[site.theme]?.name ?? site.theme,
    details: site.date ? formatDate(site.date) : t("admin.s.noDate"),
    guests: fmt(t("admin.s.guests"), { n: status.guests, p: status.parties }),
    rsvp: fmt(t("admin.s.rsvp"), { n: status.replied, p: status.parties }),
    photos: fmt(t("admin.s.photos"), { n: status.photos }),
    privacy: status.guestPasswordSet ? t("admin.s.pwSet") : t("admin.s.pwNot"),
  };
  $("brand").textContent = site.names;
  $("drawer-names").textContent = site.names;
  $("drawer-date").textContent = formatDate(site.date);
  $("chips").replaceChildren(...[
    site.date ? el("span", { class: "chip" }, formatDate(site.date)) : null,
    site.location ? el("span", { class: "chip" }, site.location) : null,
    el("button", { type: "button", class: "chip", title: t("tip.copy"), onclick: () => $("copy").click() }, t("admin.share")),
    el("a", { class: "chip", href: "/home", target: "_blank", rel: "noopener", title: t("tip.openSite") }, t("admin.openSite"))].filter(Boolean));
  $("tiles").replaceChildren(...TILES.map(([view, icon, [c1, c2], labelKey]) => {
    const soon = !(view in statusText);
    return el(soon ? "span" : "a", { class: soon ? "tile soon" : "tile", href: soon ? null : `#${view}`, title: t(soon ? "tip.soon" : `tip.tile.${view}`) },
      el("span", { class: "icon", style: `--c1:${c1};--c2:${c2}` }, icon),
      el("b", {}, t(labelKey)),
      el("small", {}, soon ? t("admin.soon") : statusText[view]));
  }));
}

// ---------- Guests, RSVP, photos ----------
const mark = (g) => (g.attending === null ? "" : g.attending ? " ✓" : " ✗");
const rsvpKey = (g) => (g.attending === null ? "none" : g.attending ? "yes" : "no");
const RSVP_LABEL = { yes: "admin.stat.attending", no: "admin.stat.declined", none: "admin.stat.noReply" };
let parties = [];
const KINDS = ["savedate", "invitation", "thanks"];
const EMAIL_CLASS = { opened: "yes", clicked: "yes", bounced: "no", complained: "no" };
let shownGuests = []; // guests in the table right now (after search and filter), for "send to the guests shown"

async function renderGuests() {
  const [data, emails] = await Promise.all([get("/api/admin/parties"), get("/api/admin/emails")]);
  ({ parties } = data);
  signup = emails.signup;
  drawSignup();
  drawGuestRows();
}

/** Table of every guest, grouped by invitation, filtered by the search box and the RSVP filter. */
function drawGuestRows() {
  const query = $("guest-search").value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  const filter = $("guest-filter").value;
  const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const rows = [];
  shownGuests = [];
  for (const p of parties) {
    const matches = p.guests.filter((g) => (filter === "all" || rsvpKey(g) === filter)
      && (!query || plain(`${g.name} ${g.email}`).includes(query)));
    shownGuests.push(...matches);
    matches.forEach((g, i) => {
      const others = p.guests.filter((x) => x !== g).map((x) => x.name).join(", ");
      rows.push(el("tr", { class: i === 0 ? "first" : null, tabindex: "0", title: t("tip.editGuest"),
        onclick: () => openGuest(p, g), onkeydown: (e) => { if (e.key === "Enter") openGuest(p, g); } },
      el("td", {}, el("b", {}, g.name), p.source === "signup" ? el("span", { class: "pill small-pill" }, t("admin.badge.signup")) : null),
      el("td", { class: "group" }, others),
      el("td", {}, g.email),
      el("td", {}, el("div", { class: "emails" }, ...KINDS.filter((k) => g.emails[k]).map((k) => el("span", {
        class: `pill ${EMAIL_CLASS[g.emails[k].status] ?? ""}`, title: g.emails[k].at ? `${g.emails[k].at} UTC` : null,
      }, `${t(`admin.kind.${k}`)}: ${t(`admin.email.${g.emails[k].status}`)}`)))),
      el("td", {}, el("span", { class: `pill ${rsvpKey(g)}` }, t(RSVP_LABEL[rsvpKey(g)]))),
      el("td", {}, g.meal),
      el("td", {}, g.dietary)));
    });
  }
  const empty = parties.length ? t("admin.noMatches") : t("admin.noGuests");
  $("guest-rows").replaceChildren(...(rows.length ? rows : [el("tr", {}, el("td", { colspan: "7", class: "muted" }, empty))]));
}
$("guest-search").oninput = drawGuestRows;
$("guest-filter").onchange = drawGuestRows;

let editing = null; // { party, guest } shown in the guest dialog
function openGuest(party, guest) {
  editing = { party, guest };
  $("guest-title").textContent = guest.name;
  $("g-name").value = guest.name;
  $("g-email").value = guest.email;
  $("g-rsvp").value = rsvpKey(guest);
  $("g-meal").value = guest.meal;
  $("g-dietary").value = guest.dietary;
  $("g-meals").replaceChildren(...site.meals.map((m) => el("option", { value: m })));
  $("g-yes").hidden = $("g-rsvp").value !== "yes";
  const others = party.guests.filter((x) => x !== guest).map((x) => x.name + mark(x));
  $("g-group").textContent = others.length ? `${t("admin.groupWith")} ${others.join(", ")}` : t("admin.groupAlone");
  $("g-note").textContent = party.note ? `${t("admin.groupNote")}: “${party.note}”` : "";
  $("g-add").value = "";
  $("g-status").textContent = "";
  $("guest-dialog").showModal();
}
$("g-rsvp").onchange = () => { $("g-yes").hidden = $("g-rsvp").value !== "yes"; };
$("g-cancel").onclick = () => $("guest-dialog").close();

async function guestAction(path, data) {
  try {
    await post(path, data);
    $("guest-dialog").close();
    await renderGuests();
  } catch (err) {
    $("g-status").className = "status error";
    $("g-status").textContent = err.message;
  }
}
$("guest-form").onsubmit = (e) => {
  e.preventDefault();
  const rsvp = $("g-rsvp").value;
  guestAction("/api/admin/guests/update", {
    id: editing.guest.id, name: $("g-name").value, email: $("g-email").value,
    attending: rsvp === "none" ? null : rsvp === "yes", meal: $("g-meal").value, dietary: $("g-dietary").value,
  });
};
$("g-add-btn").onclick = () => guestAction("/api/admin/guests/add", { partyId: editing.party.id, name: $("g-add").value });
$("g-delete").onclick = () => {
  if (confirm(fmt(t("admin.confirmDeleteGuest"), { name: editing.guest.name }))) guestAction("/api/admin/guests/delete", { id: editing.guest.id });
};

// CSV in the same columns the import reads, so an export can be edited in Excel and imported into a fresh site.
const csvCell = (v) => (/[",;\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
$("csv-export").onclick = () => {
  const lines = [["group", "name", "email", "rsvp", "meal", "dietary", "message", ...KINDS]];
  for (const p of parties) for (const g of p.guests) lines.push([p.id, g.name, g.email, rsvpKey(g), g.meal, g.dietary, p.note, ...KINDS.map((k) => g.emails[k]?.status ?? "")]);
  const blob = new Blob(["﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n")], { type: "text/csv" });
  el("a", { href: URL.createObjectURL(blob), download: "guests.csv" }).click();
};
$("csv-file").onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const status = $("guest-status");
  try {
    const n = await post("/api/admin/guests/import", { csv: await file.text() });
    status.className = "status";
    status.textContent = fmt(t("admin.imported"), { n: n.guests, p: n.parties });
    await renderGuests();
  } catch (err) {
    status.className = "status error";
    status.textContent = err.message;
  }
};

// ---------- Emails: save the date, invitation, thank you ----------
let emailMax = 100;
let emailSettings = { from: "", replyTo: "", drafts: {} };
const kind = () => $("i-kind").value;
const recipients = () => {
  const all = parties.flatMap((p) => p.guests).filter((g) => g.email);
  const who = $("i-who").value;
  if (who === "new") return all.filter((g) => !g.emails[kind()]);
  if (who === "attending") return all.filter((g) => g.attending);
  return who === "shown" ? shownGuests.filter((g) => g.email) : all;
};
const countRecipients = () => {
  const n = recipients().length;
  $("i-count").textContent = fmt(t(n > emailMax ? "admin.invite.tooMany" : "admin.invite.count"), { n, max: emailMax });
};
/** Show the saved draft of the chosen kind, keeping what was typed for the other kinds. */
function fillDraft() {
  const d = emailSettings.drafts[kind()] ?? {};
  $("i-subject").value = d.subject ?? `${site.names}: ${t(`admin.kind.${kind()}`)}`;
  $("i-message").value = d.message ?? "";
  $("i-button").value = d.button ?? t(kind() === "savedate" && $("signup-on").checked ? "signup.submit" : "admin.invite.buttonDefault");
  countRecipients();
}
const keepDraft = () => {
  emailSettings.drafts[$("i-kind").dataset.shown] = { subject: $("i-subject").value, message: $("i-message").value, button: $("i-button").value };
};
$("i-kind").onchange = () => { keepDraft(); $("i-kind").dataset.shown = kind(); fillDraft(); };
$("i-who").onchange = countRecipients;
$("invite-open").onclick = async () => {
  const data = await get("/api/admin/emails");
  emailMax = data.max;
  emailSettings = data.settings;
  $("invite-setup").hidden = data.ready;
  $("invite-tracking").hidden = !data.ready || data.tracking;
  $("i-from").value = emailSettings.from;
  $("i-reply").value = emailSettings.replyTo;
  $("i-kind").dataset.shown = kind();
  $("i-status").textContent = "";
  fillDraft();
  $("invite-dialog").showModal();
};
$("i-cancel").onclick = () => $("invite-dialog").close();
const emailDraft = () => ({ kind: kind(), from: $("i-from").value, replyTo: $("i-reply").value, subject: $("i-subject").value,
  message: $("i-message").value, button: $("i-button").value, lang: document.documentElement.lang });
async function sendEmail(extra, confirmText) {
  const status = $("i-status");
  if (confirmText && !confirm(confirmText)) return;
  try {
    status.className = "status";
    status.textContent = t("admin.invite.sending");
    const { sent } = await post("/api/admin/emails/send", { ...emailDraft(), ...extra });
    keepDraft();
    status.textContent = fmt(t("admin.invite.sent"), { n: sent });
    if (!extra.test) await renderGuests();
    countRecipients();
  } catch (err) {
    status.className = "status error";
    status.textContent = err.message;
  }
}
$("i-test-btn").onclick = () => {
  if (!$("i-test").reportValidity() || !$("i-test").value) return $("i-test").focus();
  sendEmail({ test: $("i-test").value });
};
$("invite-form").onsubmit = (e) => {
  e.preventDefault();
  const list = recipients();
  if (!list.length || list.length > emailMax) return countRecipients();
  sendEmail({ guestIds: list.map((g) => g.id) }, fmt(t("admin.invite.confirm"), { n: list.length }));
};

// ---------- Sign-up link ----------
let signup = { enabled: false, code: "" };
const siteOrigin = () => site.siteUrl || location.origin;
const signupUrl = () => `${siteOrigin()}/signup?code=${signup.code}`;
function drawSignup() {
  $("signup-on").checked = signup.enabled;
  $("signup-url").textContent = signup.enabled ? signupUrl() : "";
  $("signup-copy").hidden = $("signup-renew").hidden = !signup.enabled;
}
async function changeSignup(change) {
  signup = await post("/api/admin/signup", change);
  drawSignup();
}
$("signup-on").onchange = () => changeSignup({ enabled: $("signup-on").checked });
$("signup-renew").onclick = () => changeSignup({ renew: true });
$("signup-copy").onclick = async () => {
  await navigator.clipboard.writeText(signupUrl());
  $("signup-copy").textContent = t("admin.copied");
  setTimeout(() => { $("signup-copy").textContent = t("admin.signup.copy"); }, 2000);
};

async function renderRsvp() {
  const [status, data] = await Promise.all([get("/api/admin/status"), get("/api/admin/parties")]);
  ({ parties } = data);
  const stat = (n, label) => el("div", {}, el("b", {}, String(n)), label);
  $("stats").replaceChildren(
    stat(status.guests, t("admin.stat.guests")), stat(status.attending, t("admin.stat.attending")),
    stat(status.declined, t("admin.stat.declined")), stat(status.guests - status.attending - status.declined, t("admin.stat.noReply")));
  const meals = new Map();
  for (const p of parties) for (const g of p.guests) if (g.attending && g.meal) meals.set(g.meal, (meals.get(g.meal) ?? 0) + 1);
  $("meal-counts").replaceChildren(...[...meals].map(([meal, n]) => el("span", { class: "pill" }, `${meal}: ${n}`)));
  if (!parties.length) return $("answers").replaceChildren(el("p", { class: "muted" }, t("admin.noGuests")));
  $("answers").replaceChildren(...parties.map((p) => el("div", { class: "answer" },
    ...p.guests.map((g) => el("div", {}, g.name + mark(g),
      g.attending && (g.meal || g.dietary) ? el("small", {}, [g.meal, g.dietary].filter(Boolean).join(" · ")) : null)),
    p.responded ? (p.note ? el("small", {}, `“${p.note}”`) : null) : el("small", {}, t("admin.pending")))));
}

$("add-party").onsubmit = async (e) => {
  e.preventDefault();
  const status = e.target.querySelector(".status");
  try {
    await post("/api/admin/parties", { names: $("party-names").value });
    $("party-names").value = "";
    status.textContent = "";
    await renderGuests();
  } catch (err) {
    status.className = "status error";
    status.textContent = err.message;
  }
};

// ---------- Photo library ----------
/** Resize on this device to at most 2000px and re-encode as JPEG: small enough for free storage, and the
 *  re-encode drops the camera's metadata (GPS location included). */
async function shrink(file) {
  const bitmap = await createImageBitmap(file); // applies the camera's rotation
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (quality) => new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(t("admin.photoUnreadable")))), "image/jpeg", quality));
  const blob = await encode(0.85);
  return blob.size <= 1.9 * 1024 * 1024 ? blob : encode(0.7); // the server takes up to 2 MB
}

/** Where a photo is used on the site, for its badges. */
function placesOf(id) {
  const places = [];
  if (site.coverPhoto === id) places.push(t("admin.badge.cover"));
  for (const [slug, used] of Object.entries(site.pagePhotos)) if (used === id) places.push(t(`page.${slug}`));
  return places;
}

async function afterPhotoChange() {
  await renderPhotos();
  await renderDashboard();
  reloadPreview();
}

async function renderPhotos() {
  const { photos } = await get("/api/photos");
  if (!photos.length) return $("photos").replaceChildren(el("p", { class: "muted" }, t("admin.noPhotos")));
  $("photos").replaceChildren(...photos.map((id) => {
    const places = placesOf(id);
    const action = (icon, tip, onclick) => el("button", { type: "button", class: "icon", title: t(tip), "aria-label": t(tip), onclick }, icon);
    return el("figure", { class: "item" },
      el("img", { src: `/api/photos/${id}`, loading: "lazy", decoding: "async", alt: "", style: focusStyle(id),
        onload: (e) => e.target.classList.add("loaded") }),
      places.length ? el("figcaption", {}, ...places.map((p) => el("span", {}, p))) : null,
      el("div", { class: "actions" },
        action("\u2605", "tip.setCover", async () => { await saveSite({ coverPhoto: id }); setPreview("/home"); await afterPhotoChange(); }),
        action("\u2316", "tip.focus", () => openFocus(id)),
        action("\u2715", "tip.deletePhoto", async () => {
          if (!confirm(places.length ? `${t("admin.confirmDeleteUsed")} ${places.join(", ")}` : t("admin.confirmDelete"))) return;
          await post("/api/admin/photos/delete", { id });
          site = await get("/api/admin/site");
          await afterPhotoChange();
        })));
  }));
}

async function uploadFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
  if (!images.length) return;
  const status = $("photo-status");
  const failed = [];
  if ($("photos").querySelector("p.muted")) $("photos").replaceChildren();
  // Show every photo at once as a placeholder, then upload them one by one.
  const queue = images.map((file) => {
    const tile = el("figure", { class: "item uploading" }, el("span", { class: "spinner", "aria-hidden": "true" }));
    $("photos").prepend(tile);
    return { file, tile };
  });
  for (const [i, { file, tile }] of queue.entries()) {
    status.className = "status";
    status.textContent = `${t("admin.uploading")} ${i + 1}/${queue.length}`;
    try {
      const blob = await shrink(file);
      const preview = URL.createObjectURL(blob);
      tile.prepend(el("img", { src: preview, alt: "", class: "loaded", onload: () => URL.revokeObjectURL(preview) }));
      await upload("/api/admin/photos", blob);
      tile.classList.remove("uploading");
    } catch (err) {
      failed.push(`${file.name} (${err.message})`);
      tile.remove();
    }
  }
  status.className = failed.length ? "status error" : "status ok";
  status.textContent = failed.length ? `${t("admin.photoFailed")} ${failed.join(", ")}` : t("admin.savedGeneric");
  await renderPhotos();
  await renderDashboard();
}

$("photo-files").onchange = async (e) => {
  await uploadFiles(e.target.files);
  e.target.value = "";
};
for (const type of ["dragenter", "dragover"]) {
  $("dropzone").addEventListener(type, (e) => { e.preventDefault(); $("dropzone").classList.add("over"); });
}
for (const type of ["dragleave", "drop"]) {
  $("dropzone").addEventListener(type, () => $("dropzone").classList.remove("over"));
}
$("dropzone").addEventListener("drop", (e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); });

// Focus point: where a photo stays anchored when a frame crops it.
let focusId = null;
let focusPoint = [50, 50];
function showFocus() {
  const [x, y] = focusPoint;
  $("focus-dot").style.left = `${x}%`;
  $("focus-dot").style.top = `${y}%`;
  for (const img of $("focus-previews").querySelectorAll("img")) img.style.objectPosition = `${x}% ${y}%`;
}
function openFocus(id) {
  focusId = id;
  focusPoint = [...(site.photoFocus[id] ?? [50, 50])];
  $("focus-img").src = `/api/photos/${id}`;
  $("focus-previews").replaceChildren(...["portrait", "square", "wide"].map((shape) =>
    el("figure", { class: shape }, el("img", { src: `/api/photos/${id}`, alt: "" }), el("figcaption", {}, t(`admin.crop.${shape}`)))));
  showFocus();
  $("focus-dialog").showModal();
}
function pointAt(e) {
  const box = $("focus-img").getBoundingClientRect();
  const clamp = (n) => Math.round(Math.min(100, Math.max(0, n)));
  focusPoint = [clamp(((e.clientX - box.left) / box.width) * 100), clamp(((e.clientY - box.top) / box.height) * 100)];
  showFocus();
}
$("focus-stage").addEventListener("pointerdown", (e) => { $("focus-stage").setPointerCapture(e.pointerId); pointAt(e); });
$("focus-stage").addEventListener("pointermove", (e) => { if (e.buttons) pointAt(e); });
$("focus-stage").addEventListener("keydown", (e) => {
  const step = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
  if (!step) return;
  e.preventDefault();
  focusPoint = focusPoint.map((n, i) => Math.min(100, Math.max(0, n + step[i])));
  showFocus();
});
$("focus-cancel").onclick = () => $("focus-dialog").close();
$("focus-save").onclick = async () => {
  await saveSite({ photoFocus: { ...site.photoFocus, [focusId]: focusPoint } });
  $("focus-dialog").close();
  await afterPhotoChange();
};

// ---------- Router: #dashboard, #details, #design, #pages, #photos, #guests, #rsvp, #privacy ----------
const VIEWS = {
  dashboard: { preview: "/home" },
  details: { form: "details", preview: "/", title: "admin.tile.details" },
  design: { form: "design", preview: "/home", title: "admin.tile.design" },
  pages: { form: "page", preview: () => pageHref($("slug").value), title: "admin.tile.website" },
  photos: { preview: "/home", title: "admin.tile.photos", load: renderPhotos },
  guests: { preview: "/rsvp", title: "admin.tile.guests", load: renderGuests, wide: true },
  rsvp: { preview: "/rsvp", title: "admin.tile.rsvp", load: renderRsvp, wide: true },
  privacy: { form: "privacy", preview: "/", title: "admin.tile.privacy" },
};

async function show() {
  const name = location.hash.slice(1);
  const view = name in VIEWS ? name : "dashboard";
  const config = VIEWS[view];
  currentForm = config.form ?? null;
  document.body.dataset.mode = view === "dashboard" ? "dashboard" : config.wide ? "wide" : "editor";
  $("drawer").hidden = true;
  $("editor-top").hidden = view === "dashboard";
  $("savebar").hidden = !currentForm;
  if (config.title) $("section-title").textContent = t(config.title);
  for (const section of document.querySelectorAll("[data-view]")) section.hidden = section.dataset.view !== view;
  $("panel-body").scrollTop = 0;
  setPreview(typeof config.preview === "function" ? config.preview() : config.preview);
  if (view === "dashboard") await renderDashboard();
  if (config.load) await config.load();
  if (currentForm) {
    await FORMS[currentForm].fill();
    markSaved();
  }
}

$("menu-open").onclick = () => { $("drawer").hidden = false; };
$("menu-close").onclick = () => { $("drawer").hidden = true; };
window.addEventListener("hashchange", show);

await fillPreviewOptions();
await show();
