import { init, get, post, upload, t, el, logout, LANGUAGES } from "/js/app.js";

const PAGE_SLUGS = ["story", "schedule", "travel", "faq", "gifts"]; // keep in sync with src/validate.js
const $ = (id) => document.getElementById(id);

await init();
$("logout").onclick = logout;

/** Wire a form: run() on submit, show the result in the form's .status line. */
function bindForm(id, run, doneKey = "admin.savedGeneric") {
  const form = $(id);
  const status = form.querySelector(".status");
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await run(form);
      status.className = "status ok";
      status.textContent = t(doneKey);
    } catch (err) {
      status.className = "status error";
      status.textContent = err.message;
    }
  };
}

// Site details
const site = await get("/api/admin/site");
$("names").value = site.names;
$("date").value = site.date;
$("tagline").value = site.tagline;
$("theme").value = site.theme;
$("meals").value = site.meals.join(", ");
bindForm("site", async () => {
  await post("/api/admin/site", {
    names: $("names").value, date: $("date").value, tagline: $("tagline").value, theme: $("theme").value, meals: $("meals").value,
  });
  document.documentElement.dataset.theme = $("theme").value;
});

// Guest password
bindForm("guest-password", () => post("/api/admin/guest-password", { password: $("password").value }), "admin.saved");

// Page texts
$("slug").replaceChildren(...PAGE_SLUGS.map((s) => el("option", { value: s }, t(`page.${s}`))));
$("lang").replaceChildren(...Object.entries(LANGUAGES).map(([code, name]) => el("option", { value: code }, name)));
$("lang").value = document.documentElement.lang;
async function loadPage() {
  const page = await get(`/api/pages?slug=${$("slug").value}&lang=${$("lang").value}&exact=1`);
  $("title").value = page.title;
  $("body").value = page.body;
}
$("slug").onchange = loadPage;
$("lang").onchange = loadPage;
await loadPage();
bindForm("page", () => post("/api/admin/pages", {
  slug: $("slug").value, lang: $("lang").value, title: $("title").value, body: $("body").value,
}));

// Guests (basic list; CSV import and the full dashboard come in the next step)
function mark(g) {
  return g.attending === null ? "" : g.attending ? " ✓" : " ✗";
}
async function renderParties() {
  const { parties } = await get("/api/admin/parties");
  if (!parties.length) return $("parties").replaceChildren(el("p", { class: "muted" }, t("admin.noGuests")));
  $("parties").replaceChildren(...parties.map((p) => el("div", { class: "party" },
    el("div", {},
      el("div", {}, p.guests.map((g) => g.name + mark(g)).join(", ")),
      el("small", { class: "muted" }, p.responded ? t("admin.replied") : t("admin.pending"))),
    el("button", {
      class: "link",
      onclick: async () => {
        if (!confirm(t("admin.confirmDelete"))) return;
        await post("/api/admin/parties/delete", { id: p.id });
        await renderParties();
      },
    }, t("admin.delete")))));
}
await renderParties();
bindForm("add-party", async () => {
  await post("/api/admin/parties", { names: $("party-names").value });
  $("party-names").value = "";
  await renderParties();
});

// Photos: shrink on the device to a 1600px JPEG, then upload one at a time.
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
      onclick: async () => {
        if (!confirm(t("admin.confirmDelete"))) return;
        await post("/api/admin/photos/delete", { id });
        await renderPhotos();
      },
    }, "\u00d7"))));
}
await renderPhotos();

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
};
