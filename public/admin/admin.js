import { init, get, post, upload, t, el, logout, formatDate, pageHref, LANGUAGES } from "/js/app.js";
import { TEMPLATES, PALETTES, FONTS, LAYOUTS, ARTS, MOODS, resolveDesign, applyDesign } from "/js/designs.js";

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
$("host").textContent = location.host;

// ---------- Live preview ----------
const frame = $("preview");
const previewSelect = $("preview-page");

async function fillPreviewOptions() {
  const { pages } = await get("/api/nav");
  const options = [["/", t("admin.landing")], ["/home", t("nav.home")], ...pages.map((s) => [pageHref(s), t(`page.${s}`)]), ["/rsvp", t("nav.rsvp")]];
  previewSelect.replaceChildren(...options.map(([url, label]) => el("option", { value: url }, label)));
}

function setPreview(url) {
  if (![...previewSelect.options].some((o) => o.value === url)) previewSelect.append(el("option", { value: url }, url));
  previewSelect.value = url;
  if (frame.getAttribute("src") !== url) frame.src = url;
}

// Unsaved design choices are shown in the preview right away, and again after it navigates.
frame.addEventListener("load", () => { if (currentForm === "design") previewDesign(); });
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
    await navigator.clipboard.writeText(location.origin);
    $("copy").textContent = t("admin.copied");
  } catch (err) {
    $("copy").textContent = location.origin; // Clipboard blocked: show the link so it can be copied by hand.
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
    layout: checked("layout"), art: checked("art"), accent: $("accent").dataset.custom ? $("accent").value : "" };
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
  $("arts").replaceChildren(...Object.entries(ARTS).map(([id, name]) => choice("art", id, design.art, name, el("span", {}, name))));
}

$("design").addEventListener("change", (e) => {
  if (e.target.name === "template") renderParts(TEMPLATES[e.target.value]); // a template resets the four parts
  if (e.target.name === "template" || e.target.name === "palette") {
    if (!$("accent").dataset.custom) $("accent").value = PALETTES[checked("palette")].accent;
  }
  previewDesign();
});

async function renderCoverPicker() {
  const { photos } = await get("/api/photos");
  $("cover-picker").replaceChildren(
    el("label", {}, el("input", { type: "radio", name: "cover", value: "0", checked: !site.coverPhoto }), el("span", { class: "none" }, t("admin.noCover"))),
    ...photos.map((id) => el("label", { title: t("tip.cover") },
      el("input", { type: "radio", name: "cover", value: String(id), checked: site.coverPhoto === id }),
      el("img", { src: `/api/photos/${id}`, loading: "lazy", alt: "" }))));
}


const FORMS = {
  details: {
    fill() {
      $("names").value = site.names;
      $("date").value = site.date;
      $("deadline").value = site.rsvpDeadline;
      $("location").value = site.location;
      $("countdown").checked = site.countdown;
      $("meals").value = site.meals.join(", ");
      for (const lang of Object.keys(LANGUAGES)) $(`tagline-${lang}`).value = site.tagline[lang] ?? "";
    },
    save: () => saveSite({
      names: $("names").value, date: $("date").value, rsvpDeadline: $("deadline").value, location: $("location").value,
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
      await renderCoverPicker();
      previewDesign();
    },
    save: () => {
      const { theme, palette, font, layout, art, accent } = designDraft();
      return saveSite({ theme, palette, font, layout, art, accent, coverPhoto: Number(checked("cover") ?? 0) });
    },
  },
  page: {
    async fill() {
      const page = await get(`/api/pages?slug=${$("slug").value}&lang=${$("lang").value}&exact=1`);
      $("title").value = page.title;
      $("body").value = page.body;
    },
    async save() {
      await post("/api/admin/pages", { slug: $("slug").value, lang: $("lang").value, title: $("title").value, body: $("body").value });
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
    pages: fmt(t("admin.s.pages"), { n: nav.pages.filter((s) => s !== "photos").length }),
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

async function renderGuests() {
  const { parties } = await get("/api/admin/parties");
  if (!parties.length) return $("parties").replaceChildren(el("p", { class: "muted" }, t("admin.noGuests")));
  $("parties").replaceChildren(...parties.map((p) => el("div", { class: "party" },
    el("div", {}, p.guests.map((g) => g.name + mark(g)).join(", ")),
    el("button", {
      class: "link",
      onclick: async () => {
        if (!confirm(t("admin.confirmDelete"))) return;
        await post("/api/admin/parties/delete", { id: p.id });
        await renderGuests();
      },
    }, t("admin.delete")))));
}

async function renderRsvp() {
  const [status, { parties }] = await Promise.all([get("/api/admin/status"), get("/api/admin/parties")]);
  const stat = (n, label) => el("div", {}, el("b", {}, String(n)), label);
  $("stats").replaceChildren(
    stat(status.guests, t("admin.stat.guests")), stat(status.attending, t("admin.stat.attending")),
    stat(status.declined, t("admin.stat.declined")), stat(status.guests - status.attending - status.declined, t("admin.stat.noReply")));
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

/** Shrink to a 1600px JPEG so photos stay small enough for free storage. */
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not convert the image"))), "image/jpeg", 0.85));
}

async function renderPhotos() {
  const { photos } = await get("/api/photos");
  if (!photos.length) return $("photos").replaceChildren(el("p", { class: "muted" }, t("admin.noPhotos")));
  $("photos").replaceChildren(...photos.map((id) => el("div", { class: "thumb" },
    el("img", { src: `/api/photos/${id}`, loading: "lazy", alt: "" }),
    el("button", {
      type: "button",
      title: t("tip.deletePhoto"),
      onclick: async () => {
        if (!confirm(t("admin.confirmDelete"))) return;
        await post("/api/admin/photos/delete", { id });
        await renderPhotos();
        await fillPreviewOptions();
        reloadPreview();
      },
    }, "×"))));
}

$("photo-files").onchange = async (e) => {
  const files = [...e.target.files];
  const status = $("photo-status");
  const failed = [];
  for (const [i, file] of files.entries()) {
    status.className = "status";
    status.textContent = `${t("admin.uploading")} ${i + 1}/${files.length}`;
    try {
      await upload("/api/admin/photos", await shrink(file));
    } catch (err) {
      failed.push(`${file.name} (${err.message})`);
    }
  }
  e.target.value = "";
  status.className = failed.length ? "status error" : "status ok";
  status.textContent = failed.length ? `${t("admin.photoFailed")} ${failed.join(", ")}` : t("admin.savedGeneric");
  await renderPhotos();
  await fillPreviewOptions();
  setPreview("/photos");
  reloadPreview();
};

// ---------- Router: #dashboard, #details, #design, #pages, #photos, #guests, #rsvp, #privacy ----------
const VIEWS = {
  dashboard: { preview: "/home" },
  details: { form: "details", preview: "/", title: "admin.tile.details" },
  design: { form: "design", preview: "/home", title: "admin.tile.design" },
  pages: { form: "page", preview: () => pageHref($("slug").value), title: "admin.tile.website" },
  photos: { preview: "/photos", title: "admin.tile.photos", load: renderPhotos },
  guests: { preview: "/rsvp", title: "admin.tile.guests", load: renderGuests },
  rsvp: { preview: "/rsvp", title: "admin.tile.rsvp", load: renderRsvp },
  privacy: { form: "privacy", preview: "/", title: "admin.tile.privacy" },
};

async function show() {
  const name = location.hash.slice(1);
  const view = name in VIEWS ? name : "dashboard";
  const config = VIEWS[view];
  currentForm = config.form ?? null;
  document.body.dataset.mode = view === "dashboard" ? "dashboard" : "editor";
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
